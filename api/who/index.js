/**
 * WHO — single entry point for the whole API.
 *
 * Every operation lives behind this one function, dispatched on `op`, because
 * Vercel counts each api/*.js file as a separate Serverless Function and the
 * project sits close to the plan's per-deployment function cap. Splitting these
 * operations into separate files pushed the deployment over that cap and it
 * stopped building — hence one file, one function.
 *
 *   POST /api/who  { op: "create", name }
 *   POST /api/who  { op: "join", code, name }
 *   POST /api/who  { op: "deal", code, playerId, token }
 *   POST /api/who  { op: "host", code, playerId, token, action, targetId? }
 *   GET  /api/who?op=state&code=&playerId=&token=
 *
 * `op` is deliberately distinct from the `action` field the host controls use,
 * so routing never collides with request payloads.
 */
const lib = require("./_lib");

// ── op: create ── the creator is the host, and the host is the moderator.
async function opCreate(req, res) {
  if (!(await lib.rateLimit(`who-create:${lib.clientIp(req)}`, 10, 60))) {
    res.status(429).json({ error: "rate-limited" });
    return;
  }
  if (!lib.redis) {
    res.status(503).json({ error: "store-unavailable" });
    return;
  }

  const name = String(req.body?.name || "").trim().slice(0, 24);
  if (!name) {
    res.status(400).json({ error: "invalid-name" });
    return;
  }

  let code = null;
  for (let i = 0; i < 8; i++) {
    const candidate = lib.roomCode(4);
    if ((await lib.redis.sadd("who:codes", candidate)) === 1) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    res.status(500).json({ error: "code-collision" });
    return;
  }
  await lib.redis.expire("who:codes", lib.ROOM_TTL);

  const playerId = lib.id();
  const playerToken = lib.token();
  await lib.saveRoom(code, {
    code, hostPlayerId: playerId, phase: "lobby", round: 0,
    createdAt: new Date().toISOString(),
  });
  await lib.savePlayer(code, {
    id: playerId, name, token: playerToken,
    role: null, isHost: true, joinedAt: new Date().toISOString(),
  });
  await lib.redis.rpush(`who:order:${code}`, playerId);
  await lib.redis.expire(`who:order:${code}`, lib.ROOM_TTL);

  res.status(200).json({ code, playerId, token: playerToken });
}

// ── op: join ──
async function opJoin(req, res) {
  if (!(await lib.rateLimit(`who-join:${lib.clientIp(req)}`, 20, 60))) {
    res.status(429).json({ error: "rate-limited" });
    return;
  }
  if (!lib.redis) {
    res.status(503).json({ error: "store-unavailable" });
    return;
  }

  const code = String(req.body?.code || "").trim().toUpperCase();
  const name = String(req.body?.name || "").trim().slice(0, 24);
  if (!code || !name) {
    res.status(400).json({ error: "invalid-input" });
    return;
  }

  const room = await lib.getRoom(code);
  if (!room) {
    res.status(404).json({ error: "room-not-found" });
    return;
  }
  if (room.phase !== "lobby") {
    res.status(409).json({ error: "already-dealt" });
    return;
  }

  const players = await lib.getPlayers(code);
  const order = await lib.getOrder(code);
  // The cap counts players, so the moderator doesn't eat one of the slots.
  if (order.length - 1 >= lib.MAX_PLAYERS) {
    res.status(409).json({ error: "room-full" });
    return;
  }
  if (Object.values(players).some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    res.status(409).json({ error: "name-taken" });
    return;
  }

  const playerId = lib.id();
  const playerToken = lib.token();
  await lib.savePlayer(code, {
    id: playerId, name, token: playerToken,
    role: null, isHost: false, joinedAt: new Date().toISOString(),
  });
  await lib.redis.rpush(`who:order:${code}`, playerId);

  res.status(200).json({ code, playerId, token: playerToken, hostPlayerId: room.hostPlayerId });
}

// ── op: deal ── host-only; hands out roles and starts the in-person game.
async function opDeal(req, res) {
  const { playerId, token } = req.body || {};
  const ctx = await lib.authPlayer(req, res, { code: req.body?.code, playerId, token });
  if (!ctx) return;
  const { room, player } = ctx;

  if (!player.isHost) {
    res.status(403).json({ error: "not-host" });
    return;
  }
  const order = await lib.getOrder(room.code);
  const playerCount = order.length - 1; // exclude the moderator
  if (playerCount < lib.MIN_PLAYERS) {
    res.status(409).json({ error: "not-enough-players", min: lib.MIN_PLAYERS });
    return;
  }

  const round = await lib.dealRoles(room.code);
  res.status(200).json({ ok: true, round });
}

// ── op: host ── host-only controls.
async function opHost(req, res) {
  const { playerId, token, action, targetId } = req.body || {};
  const ctx = await lib.authPlayer(req, res, { code: req.body?.code, playerId, token });
  if (!ctx) return;
  const { room, player } = ctx;

  if (!player.isHost) {
    res.status(403).json({ error: "not-host" });
    return;
  }

  if (action === "reopen") {
    await lib.reopenLobby(room.code);
    res.status(200).json({ ok: true });
    return;
  }

  if (action === "kick") {
    if (!targetId || targetId === room.hostPlayerId) {
      res.status(400).json({ error: "invalid-target" });
      return;
    }
    await lib.redis.hdel(`who:players:${room.code}`, targetId);
    await lib.redis.lrem(`who:order:${room.code}`, 0, targetId);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(400).json({ error: "invalid-action" });
}

// ── op: state ──
// Player-scoped: you always get your own role and never anyone else's. The
// moderator is the sole exception — running the night phase at the table is
// impossible without the full roster.
async function opState(req, res) {
  const { playerId, token } = req.query || {};
  const ctx = await lib.authPlayer(req, res, { code: req.query?.code, playerId, token });
  if (!ctx) return;

  const code = ctx.room.code;
  const room = await lib.getRoom(code);
  const players = await lib.getPlayers(code);
  const order = await lib.getOrder(code);
  const me = players[playerId];
  const dealt = room.phase === "dealt";
  const iAmModerator = !!me.isHost;

  const roster = order
    .map((pid) => players[pid])
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      // Only ever reveal a role to its owner, or to the moderator once dealt.
      role: dealt && (p.id === playerId || iAmModerator) ? p.role : null,
    }));

  const playerCount = roster.filter((p) => !p.isHost).length;

  res.status(200).json({
    code,
    phase: room.phase,
    round: room.round || 0,
    minPlayers: lib.MIN_PLAYERS,
    maxPlayers: lib.MAX_PLAYERS,
    playerCount,
    // What the next (or current) deal looks like — drives the moderator's
    // "this game has 2 wolves…" summary.
    composition: lib.composition(playerCount),
    you: {
      id: me.id,
      name: me.name,
      isHost: me.isHost,
      role: dealt ? me.role : null,
    },
    players: roster,
  });
}

const POST_OPS = { create: opCreate, join: opJoin, deal: opDeal, host: opHost };

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      if ((req.query?.op || "") !== "state") {
        res.status(400).json({ error: "invalid-op" });
        return;
      }
      await opState(req, res);
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "method-not-allowed" });
      return;
    }
    const op = POST_OPS[req.body?.op];
    if (!op) {
      res.status(400).json({ error: "invalid-op" });
      return;
    }
    await op(req, res);
  } catch (err) {
    console.error("who:", err);
    if (!res.headersSent) res.status(500).json({ error: "server-error" });
  }
};
