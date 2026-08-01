/**
 * GET /api/who/state?code=&playerId=&token= — polled every couple seconds by
 * the client. Returns a view scoped to the requesting player: their own role
 * and private history, everyone else's public status, and enough aggregate
 * progress to show "2 of 3 wolves have chosen" without leaking identities.
 */
const lib = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }
  res.setHeader("Cache-Control", "no-store");

  try {
    const { playerId, token } = req.query || {};
    const ctx = await lib.authPlayer(req, res, { code: req.query?.code, playerId, token });
    if (!ctx) return;
    const code = ctx.room.code;

    // A poll can be the thing that nudges a stalled phase forward (e.g. the
    // last actor's own tryResolve call raced/failed) — safe to call again,
    // it no-ops once the phase has already moved on.
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
        return {
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          alive: p.alive,
          role: revealRole ? p.role : null,
        };
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
      const required = wolves.length + (seer ? 1 : 0) + (doctor ? 1 : 0);
      const done =
        wolves.filter((w) => actions[w.id]).length +
        (seer && actions[seer.id] ? 1 : 0) +
        (doctor && actions[doctor.id] ? 1 : 0);
      progress = { submittedCount: done, requiredCount: required };

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

    const log = (await lib.getLog(code)).slice(-60);
    const chat = (await lib.getChat(code)).slice(-60);

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
      log,
      chat,
    });
  } catch (err) {
    console.error("who/state:", err);
    res.status(500).json({ error: "server-error" });
  }
};
