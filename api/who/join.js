/**
 * POST /api/who/join — a player joins an existing lobby by room code.
 * Body: { code, name }  →  { code, playerId, token, hostPlayerId }
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
    const taken = Object.values(players).some(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (taken) {
      res.status(409).json({ error: "name-taken" });
      return;
    }

    const playerId = lib.id();
    const playerToken = lib.token();
    const player = {
      id: playerId, name, token: playerToken,
      role: null, alive: true, isHost: false, joinedAt: new Date().toISOString(),
    };
    await lib.savePlayer(code, player);
    await lib.redis.rpush(`who:order:${code}`, playerId);
    await lib.appendLog(code, { type: "join", text: `${name} joined the lobby.` });

    res.status(200).json({ code, playerId, token: playerToken, hostPlayerId: room.hostPlayerId });
  } catch (err) {
    console.error("who/join:", err);
    res.status(500).json({ error: "server-error" });
  }
};
