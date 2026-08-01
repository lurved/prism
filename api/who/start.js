/**
 * POST /api/who/start — host deals roles and begins night 1.
 * Body: { code, playerId, token }
 */
const lib = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }
  res.setHeader("Cache-Control", "no-store");

  try {
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
  } catch (err) {
    console.error("who/start:", err);
    res.status(500).json({ error: "server-error" });
  }
};
