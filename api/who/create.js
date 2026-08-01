/**
 * POST /api/who/create — host opens a new lobby.
 * Body: { name }  →  { code, playerId, token }
 */
const lib = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }
  res.setHeader("Cache-Control", "no-store");

  try {
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
    const player = {
      id: playerId, name, token: playerToken,
      role: null, alive: true, isHost: true, joinedAt: new Date().toISOString(),
    };
    const room = {
      code, hostPlayerId: playerId, phase: "lobby", round: 0, winner: null,
      createdAt: new Date().toISOString(),
    };

    await lib.saveRoom(code, room);
    await lib.savePlayer(code, player);
    await lib.redis.rpush(`who:order:${code}`, playerId);
    await lib.redis.expire(`who:order:${code}`, lib.ROOM_TTL);
    await lib.appendLog(code, { type: "join", text: `${name} opened the lobby.` });

    res.status(200).json({ code, playerId, token: playerToken });
  } catch (err) {
    console.error("who/create:", err);
    res.status(500).json({ error: "server-error" });
  }
};
