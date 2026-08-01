/**
 * POST /api/who/host — host-only controls.
 * Body: { code, playerId, token, action, targetId? }
 *   action: "force_tally" (skip waiting on stragglers this phase)
 *         | "kick" (remove a player who hasn't joined the game yet, lobby only)
 */
const lib = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }
  res.setHeader("Cache-Control", "no-store");

  try {
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
  } catch (err) {
    console.error("who/host:", err);
    res.status(500).json({ error: "server-error" });
  }
};
