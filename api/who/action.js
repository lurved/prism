/**
 * POST /api/who/action — submit a night action, a lynch vote, or a chat line.
 * Body: { code, playerId, token, type, targetId?, text? }
 *   type: "wolf_vote" | "seer_check" | "doctor_protect" | "lynch_vote" | "chat"
 */
const lib = require("./_lib");

const NIGHT_ROLE = { wolf_vote: "werewolf", seer_check: "seer", doctor_protect: "doctor" };

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }
  res.setHeader("Cache-Control", "no-store");

  try {
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
      if (targetId !== "skip") {
        if (!target || !target.alive) {
          res.status(400).json({ error: "invalid-target" });
          return;
        }
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
      const isWolf = target.role === "werewolf";
      player.seerChecks = player.seerChecks || [];
      player.seerChecks.push({ round: room.round, targetId: target.id, targetName: target.name, isWolf });
      await lib.savePlayer(code, player);
    }

    await lib.submitAction(code, room.round, "night", playerId, { type, targetId });
    await lib.tryResolve(code);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("who/action:", err);
    res.status(500).json({ error: "server-error" });
  }
};
