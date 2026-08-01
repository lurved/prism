/**
 * WHO — single entry point for the whole game API.
 *
 * Every operation lives behind this one function, dispatched on `op`, because
 * Vercel counts each api/*.js file as a separate Serverless Function and the
 * project sits close to the plan's per-deployment function cap. Splitting these
 * six operations into six files pushed the whole deployment over that cap and
 * it stopped building — hence one file, one function.
 *
 *   POST /api/who  { op: "create", name }
 *   POST /api/who  { op: "join", code, name }
 *   POST /api/who  { op: "start", code, playerId, token }
 *   POST /api/who  { op: "move", code, playerId, token, type, targetId?, text? }
 *   POST /api/who  { op: "host", code, playerId, token, action, targetId? }
 *   GET  /api/who?op=state&code=&playerId=&token=
 *
 * `op` is deliberately distinct from the `type`/`action` fields the game itself
 * uses, so routing never collides with gameplay payloads.
 */
const lib = require("./_lib");

const NIGHT_ROLE = { wolf_vote: "werewolf", seer_check: "seer", doctor_protect: "doctor" };

// ── op: create ──
async function opCreate(req, res) {
  const ip = lib.clientIp(req);
  if (!(await lib.rateLimit(`who-create:${ip}`, 10, 60))) {
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
    const added = await lib.redis.sadd("who:codes", candidate);
    if (added === 1) {
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
    code, hostPlayerId: playerId, phase: "lobby", round: 0, winner: null,
    createdAt: new Date().toISOString(),
  });
  await lib.savePlayer(code, {
    id: playerId, name, token: playerToken,
    role: null, alive: true, isHost: true, joinedAt: new Date().toISOString(),
  });
  await lib.redis.rpush(`who:order:${code}`, playerId);
  await lib.redis.expire(`who:order:${code}`, lib.ROOM_TTL);
  await lib.appendLog(code, { type: "join", text: `${name} opened the lobby.` });

  res.status(200).json({ code, playerId, token: playerToken });
}

// ── op: join ──
async function opJoin(req, res) {
  const ip = lib.clientIp(req);
  if (!(await lib.rateLimit(`who-join:${ip}`, 20, 60))) {
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
    res.status(409).json({ error: "already-started" });
    return;
  }

  const players = await lib.getPlayers(code);
  const order = await lib.getOrder(code);
  if (order.length >= lib.MAX_PLAYERS) {
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
    role: null, alive: true, isHost: false, joinedAt: new Date().toISOString(),
  });
  await lib.redis.rpush(`who:order:${code}`, playerId);
  await lib.appendLog(code, { type: "join", text: `${name} joined the lobby.` });

  res.status(200).json({ code, playerId, token: playerToken, hostPlayerId: room.hostPlayerId });
}

// ── op: start ──
async function opStart(req, res) {
  const { playerId, token } = req.body || {};
  const ctx = await lib.authPlayer(req, res, { code: req.body?.code, playerId, token });
  if (!ctx) return;
  const { room, player } = ctx;
  const code = room.code;

  if (!player.isHost) {
    res.status(403).json({ error: "not-host" });
    return;
  }
  if (room.phase !== "lobby") {
    res.status(409).json({ error: "already-started" });
    return;
  }
  const order = await lib.getOrder(code);
  if (order.length < lib.MIN_PLAYERS) {
    res.status(409).json({ error: "not-enough-players", min: lib.MIN_PLAYERS });
    return;
  }

  await lib.startGame(code);
  res.status(200).json({ ok: true });
}

// ── op: move (night action, lynch vote, or chat) ──
async function opMove(req, res) {
  const { playerId, token, type, targetId, text } = req.body || {};
  const ctx = await lib.authPlayer(req, res, { code: req.body?.code, playerId, token });
  if (!ctx) return;
  const { room, player } = ctx;
  const code = room.code;

  if (type === "chat") {
    const clean = String(text || "").trim().slice(0, 300);
    if (!clean) {
      res.status(400).json({ error: "empty-message" });
      return;
    }
    if (!(await lib.rateLimit(`who-chat:${playerId}`, 20, 30))) {
      res.status(429).json({ error: "rate-limited" });
      return;
    }
    await lib.appendChat(code, { playerId, name: player.name, text: clean });
    res.status(200).json({ ok: true });
    return;
  }

  if (!player.alive) {
    res.status(403).json({ error: "player-dead" });
    return;
  }

  const players = await lib.getPlayers(code);
  const target = targetId && targetId !== "skip" ? players[targetId] : null;

  if (type === "lynch_vote") {
    if (room.phase !== "day") {
      res.status(409).json({ error: "wrong-phase" });
      return;
    }
    if (targetId !== "skip" && (!target || !target.alive)) {
      res.status(400).json({ error: "invalid-target" });
      return;
    }
    await lib.submitAction(code, room.round, "day", playerId, { type, targetId });
    await lib.tryResolve(code);
    res.status(200).json({ ok: true });
    return;
  }

  const requiredRole = NIGHT_ROLE[type];
  if (!requiredRole) {
    res.status(400).json({ error: "invalid-action-type" });
    return;
  }
  if (room.phase !== "night") {
    res.status(409).json({ error: "wrong-phase" });
    return;
  }
  if (player.role !== requiredRole) {
    res.status(403).json({ error: "wrong-role" });
    return;
  }
  if (!target || !target.alive) {
    res.status(400).json({ error: "invalid-target" });
    return;
  }
  if (type === "wolf_vote" && (target.role === "werewolf" || target.id === player.id)) {
    res.status(400).json({ error: "invalid-target" });
    return;
  }
  if (type === "seer_check" && target.id === player.id) {
    res.status(400).json({ error: "invalid-target" });
    return;
  }
  if (type === "doctor_protect" && player.lastProtectedId === target.id) {
    res.status(400).json({ error: "cannot-repeat-protect" });
    return;
  }

  // Seer learns the result immediately (that's the whole point of the role);
  // keep the private history on the player record rather than re-deriving
  // it from the action log on every poll.
  if (type === "seer_check") {
    player.seerChecks = player.seerChecks || [];
    player.seerChecks.push({
      round: room.round, targetId: target.id, targetName: target.name,
      isWolf: target.role === "werewolf",
    });
    await lib.savePlayer(code, player);
  }

  await lib.submitAction(code, room.round, "night", playerId, { type, targetId });
  await lib.tryResolve(code);
  res.status(200).json({ ok: true });
}

// ── op: host ──
async function opHost(req, res) {
  const { playerId, token, action, targetId } = req.body || {};
  const ctx = await lib.authPlayer(req, res, { code: req.body?.code, playerId, token });
  if (!ctx) return;
  const { room, player } = ctx;
  const code = room.code;

  if (!player.isHost) {
    res.status(403).json({ error: "not-host" });
    return;
  }

  if (action === "force_tally") {
    if (room.phase !== "night" && room.phase !== "day") {
      res.status(409).json({ error: "wrong-phase" });
      return;
    }
    await lib.tryResolve(code, { force: true });
    res.status(200).json({ ok: true });
    return;
  }

  if (action === "kick") {
    if (room.phase !== "lobby") {
      res.status(409).json({ error: "already-started" });
      return;
    }
    if (!targetId || targetId === room.hostPlayerId) {
      res.status(400).json({ error: "invalid-target" });
      return;
    }
    await lib.redis.hdel(`who:players:${code}`, targetId);
    await lib.redis.lrem(`who:order:${code}`, 0, targetId);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(400).json({ error: "invalid-action" });
}

// ── op: state ──
// Returns a view scoped to the requesting player: their own role and private
// history, everyone else's public status, and enough aggregate progress to show
// "2 of 3 have chosen" without leaking identities.
async function opState(req, res) {
  const { playerId, token } = req.query || {};
  const ctx = await lib.authPlayer(req, res, { code: req.query?.code, playerId, token });
  if (!ctx) return;
  const code = ctx.room.code;

  // A poll can be the thing that nudges a stalled phase forward (e.g. the last
  // actor's own tryResolve call raced/failed) — safe to call again, it no-ops
  // once the phase has already moved on.
  if (ctx.room.phase === "night" || ctx.room.phase === "day") {
    await lib.tryResolve(code);
  }

  const room = await lib.getRoom(code);
  const players = await lib.getPlayers(code);
  const order = await lib.getOrder(code);
  const me = players[playerId];

  const alive = Object.values(players).filter((p) => p.alive);
  const iAmWolf = me.role === "werewolf";
  const gameOver = room.phase === "ended";

  const publicPlayers = order
    .map((pid) => players[pid])
    .filter(Boolean)
    .map((p) => {
      const revealRole =
        p.id === playerId || !p.alive || gameOver || (iAmWolf && p.role === "werewolf");
      return { id: p.id, name: p.name, isHost: p.isHost, alive: p.alive, role: revealRole ? p.role : null };
    });

  let canAct = false;
  let actionType = null;
  let submitted = false;
  let progress = null;

  if (room.phase === "night") {
    const actions = await lib.getActions(code, room.round, "night");
    const wolves = alive.filter((p) => p.role === "werewolf");
    const seer = alive.find((p) => p.role === "seer");
    const doctor = alive.find((p) => p.role === "doctor");
    progress = {
      submittedCount:
        wolves.filter((w) => actions[w.id]).length +
        (seer && actions[seer.id] ? 1 : 0) +
        (doctor && actions[doctor.id] ? 1 : 0),
      requiredCount: wolves.length + (seer ? 1 : 0) + (doctor ? 1 : 0),
    };

    const roleAction = { werewolf: "wolf_vote", seer: "seer_check", doctor: "doctor_protect" }[me.role];
    if (roleAction && me.alive) {
      actionType = roleAction;
      canAct = true;
      submitted = !!actions[playerId];
    }
  } else if (room.phase === "day") {
    const actions = await lib.getActions(code, room.round, "day");
    progress = { submittedCount: alive.filter((p) => actions[p.id]).length, requiredCount: alive.length };
    if (me.alive) {
      actionType = "lynch_vote";
      canAct = true;
      submitted = !!actions[playerId];
    }
  }

  res.status(200).json({
    code,
    phase: room.phase,
    round: room.round,
    winner: room.winner || null,
    minPlayers: lib.MIN_PLAYERS,
    maxPlayers: lib.MAX_PLAYERS,
    you: {
      id: me.id,
      name: me.name,
      isHost: me.isHost,
      alive: me.alive,
      role: room.phase === "lobby" ? null : me.role,
      canAct,
      actionType,
      submitted,
      seerChecks: me.role === "seer" ? me.seerChecks || [] : undefined,
      lastProtectedId: me.role === "doctor" ? me.lastProtectedId || null : undefined,
    },
    players: publicPlayers,
    progress,
    log: (await lib.getLog(code)).slice(-60),
    chat: (await lib.getChat(code)).slice(-60),
  });
}

const POST_OPS = { create: opCreate, join: opJoin, start: opStart, move: opMove, host: opHost };

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
