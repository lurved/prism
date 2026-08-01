/**
 * WHO — shared server logic for the werewolf party game.
 * Storage is the same Upstash/ioredis instance used by typeme, keyed as:
 *
 *   who:codes                     set    every active room code (uniqueness)
 *   who:room:{code}                JSON   room/game state (phase, round, host, night plan)
 *   who:players:{code}             hash   playerId -> JSON player record (name, role, alive, token)
 *   who:order:{code}               list   playerIds in join order
 *   who:actions:{code}:{round}:{phase}  hash  playerId -> JSON submitted action (this round+phase)
 *   who:log:{code}                 list   public narrative event log (deaths, lynches, phase changes)
 *   who:chat:{code}                list   day-phase discussion messages
 *   who:rl:{bucket}                str    rate-limit counters (TTL)
 *
 * All room keys carry a TTL so finished/abandoned games fall out of Redis on
 * their own rather than needing a cleanup job.
 */

const crypto = require("crypto");
const Redis = require("ioredis");

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: false,
    })
  : null;
if (redis) redis.on("error", (e) => console.error("redis:", e.message));

const ROOM_TTL = 6 * 60 * 60; // 6h — long enough for a full game + stragglers
const MIN_PLAYERS = 5;
const MAX_PLAYERS = 20;
const CHAT_CAP = 200;
const LOG_CAP = 300;

// ── id helpers ──
// Room codes: short, spoken/typed aloud, no ambiguous chars (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function roomCode(size = 4) {
  const bytes = crypto.randomBytes(size);
  let out = "";
  for (let i = 0; i < size; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}
function id() {
  return crypto.randomBytes(9).toString("hex"); // playerId, not secret
}
function token() {
  return crypto.randomBytes(24).toString("hex"); // secret, per-player auth
}

function parse(raw) {
  if (raw == null) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

// ── rate limiting (same shape as typeme's) ──
async function rateLimit(bucket, max, windowSec) {
  if (!redis) return true;
  const key = `who:rl:${bucket}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, windowSec);
  return n <= max;
}
function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// ── room / player primitives ──
async function getRoom(code) {
  if (!redis) return null;
  return parse(await redis.get(`who:room:${code}`));
}
async function saveRoom(code, room) {
  await redis.set(`who:room:${code}`, JSON.stringify(room), "EX", ROOM_TTL);
}
async function getPlayers(code) {
  if (!redis) return {};
  const raw = await redis.hgetall(`who:players:${code}`);
  const out = {};
  for (const [pid, v] of Object.entries(raw)) out[pid] = parse(v);
  return out;
}
async function getPlayer(code, playerId) {
  if (!redis) return null;
  const raw = await redis.hget(`who:players:${code}`, playerId);
  return parse(raw);
}
async function savePlayer(code, player) {
  await redis.hset(`who:players:${code}`, player.id, JSON.stringify(player));
  await redis.expire(`who:players:${code}`, ROOM_TTL);
}
async function getOrder(code) {
  if (!redis) return [];
  return redis.lrange(`who:order:${code}`, 0, -1);
}

async function appendLog(code, entry) {
  const row = { ...entry, ts: new Date().toISOString() };
  await redis.rpush(`who:log:${code}`, JSON.stringify(row));
  await redis.ltrim(`who:log:${code}`, -LOG_CAP, -1);
  await redis.expire(`who:log:${code}`, ROOM_TTL);
}
async function getLog(code) {
  if (!redis) return [];
  const rows = await redis.lrange(`who:log:${code}`, 0, -1);
  return rows.map(parse);
}

async function appendChat(code, entry) {
  const row = { ...entry, ts: new Date().toISOString() };
  await redis.rpush(`who:chat:${code}`, JSON.stringify(row));
  await redis.ltrim(`who:chat:${code}`, -CHAT_CAP, -1);
  await redis.expire(`who:chat:${code}`, ROOM_TTL);
}
async function getChat(code) {
  if (!redis) return [];
  const rows = await redis.lrange(`who:chat:${code}`, 0, -1);
  return rows.map(parse);
}

// ── night/day action bookkeeping ──
function actionsKey(code, round, phase) {
  return `who:actions:${code}:${round}:${phase}`;
}
async function submitAction(code, round, phase, playerId, action) {
  const key = actionsKey(code, round, phase);
  await redis.hset(key, playerId, JSON.stringify({ ...action, ts: new Date().toISOString() }));
  await redis.expire(key, ROOM_TTL);
}
async function getActions(code, round, phase) {
  if (!redis) return {};
  const raw = await redis.hgetall(actionsKey(code, round, phase));
  const out = {};
  for (const [pid, v] of Object.entries(raw)) out[pid] = parse(v);
  return out;
}

// ── role assignment ──
// Scales the special-role count to the lobby size; villagers fill the rest.
// Kept deliberately conservative so wolves never approach half the table.
function buildRoleDeck(n) {
  const wolves = Math.max(1, Math.floor(n / 4));
  const seer = n >= 5 ? 1 : 0;
  const doctor = n >= 7 ? 1 : 0;
  const villagers = n - wolves - seer - doctor;
  const deck = [];
  for (let i = 0; i < wolves; i++) deck.push("werewolf");
  for (let i = 0; i < seer; i++) deck.push("seer");
  for (let i = 0; i < doctor; i++) deck.push("doctor");
  for (let i = 0; i < villagers; i++) deck.push("villager");
  return shuffle(deck);
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomBytes(1)[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function countAlive(players, role) {
  return Object.values(players).filter((p) => p.alive && (!role || p.role === role)).length;
}

// Winner check: null while the game continues.
function checkWinner(players) {
  const wolves = countAlive(players, "werewolf");
  const others = Object.values(players).filter((p) => p.alive && p.role !== "werewolf").length;
  if (wolves === 0) return "villagers";
  if (wolves >= others) return "werewolves";
  return null;
}

// Tally votes into a target id; returns null on a tie (no lynch/no kill).
function tallyVotes(actions, aliveIds) {
  const counts = {};
  for (const pid of Object.keys(actions)) {
    if (!aliveIds.includes(pid)) continue; // dead player actions are stale, ignore
    const target = actions[pid].targetId;
    if (!target || target === "skip") continue;
    counts[target] = (counts[target] || 0) + 1;
  }
  let best = null;
  let bestCount = 0;
  let tie = false;
  for (const [target, c] of Object.entries(counts)) {
    if (c > bestCount) {
      best = target;
      bestCount = c;
      tie = false;
    } else if (c === bestCount) {
      tie = true;
    }
  }
  if (tie || !best) return null;
  return best;
}

const ROLE_LABEL = { werewolf: "Werewolf", seer: "Seer", doctor: "Doctor", villager: "Villager" };
function roleLabel(role) {
  return ROLE_LABEL[role] || role;
}

async function acquireLock(code, round, phase) {
  if (!redis) return true;
  const key = `who:lock:${code}:${round}:${phase}`;
  const ok = await redis.set(key, "1", "NX", "EX", 30);
  return ok === "OK";
}

// Deals roles across every joined player and moves the room into night 1.
async function startGame(code) {
  const order = await getOrder(code);
  const players = await getPlayers(code);
  const deck = buildRoleDeck(order.length);
  for (let i = 0; i < order.length; i++) {
    const p = players[order[i]];
    p.role = deck[i];
    p.alive = true;
    p.lastProtectedId = null;
    await savePlayer(code, p);
  }
  const room = await getRoom(code);
  room.phase = "night";
  room.round = 1;
  room.winner = null;
  await saveRoom(code, room);
  await appendLog(code, { type: "start", round: 1, text: "Roles are dealt. Night falls on the village." });
}

// Resolves the current phase once every required actor has submitted (or,
// with force:true, on-demand from the host — missing actions count as an
// abstain/no-target rather than blocking the game forever).
async function tryResolve(code, { force = false } = {}) {
  const room = await getRoom(code);
  if (!room || (room.phase !== "night" && room.phase !== "day")) return;

  const players = await getPlayers(code);
  const alive = Object.values(players).filter((p) => p.alive);
  const { phase, round } = room;
  const actions = await getActions(code, round, phase);

  if (phase === "night") {
    const wolves = alive.filter((p) => p.role === "werewolf");
    const seer = alive.find((p) => p.role === "seer");
    const doctor = alive.find((p) => p.role === "doctor");
    const ready =
      wolves.every((w) => actions[w.id]) &&
      (!seer || !!actions[seer.id]) &&
      (!doctor || !!actions[doctor.id]);
    if (!ready && !force) return;
    if (!(await acquireLock(code, round, phase))) return;

    const wolfIds = wolves.map((w) => w.id);
    const wolfTarget = tallyVotes(actions, wolfIds);
    const doctorProtectId = doctor && actions[doctor.id] ? actions[doctor.id].targetId : null;
    if (doctor) {
      doctor.lastProtectedId = doctorProtectId || null;
      await savePlayer(code, doctor);
    }

    let diedId = null;
    let saved = false;
    if (wolfTarget) {
      if (doctorProtectId && doctorProtectId === wolfTarget) saved = true;
      else diedId = wolfTarget;
    }

    if (diedId) {
      const victim = players[diedId];
      victim.alive = false;
      await savePlayer(code, victim);
      await appendLog(code, {
        type: "death", round, playerId: diedId, name: victim.name, role: victim.role,
        text: `${victim.name} was found dead. They were a ${roleLabel(victim.role)}.`,
      });
    } else if (saved) {
      await appendLog(code, { type: "saved", round, text: "Someone was attacked in the night, but survived." });
    } else {
      await appendLog(code, { type: "peaceful", round, text: "The village wakes to find everyone safe." });
    }

    await finishPhase(code, room);
    return;
  }

  if (phase === "day") {
    const ready = alive.every((p) => actions[p.id]);
    if (!ready && !force) return;
    if (!(await acquireLock(code, round, phase))) return;

    const aliveIds = alive.map((p) => p.id);
    const lynchTarget = tallyVotes(actions, aliveIds);
    if (lynchTarget) {
      const victim = players[lynchTarget];
      victim.alive = false;
      await savePlayer(code, victim);
      await appendLog(code, {
        type: "lynch", round, playerId: lynchTarget, name: victim.name, role: victim.role,
        text: `${victim.name} was voted out by the village. They were a ${roleLabel(victim.role)}.`,
      });
    } else {
      await appendLog(code, { type: "no-lynch", round, text: "The village couldn't agree. No one was voted out." });
    }

    await finishPhase(code, room, { advanceRound: true });
    return;
  }
}

// Shared tail of tryResolve: check for a winner, or move to the next phase.
async function finishPhase(code, room, { advanceRound = false } = {}) {
  const playersNow = await getPlayers(code);
  const winner = checkWinner(playersNow);
  if (winner) {
    room.phase = "ended";
    room.winner = winner;
    await appendLog(code, {
      type: "ended",
      text: winner === "villagers"
        ? "The village has eliminated every werewolf. Villagers win!"
        : "The werewolves equal or outnumber the village. Werewolves win!",
    });
  } else if (advanceRound) {
    room.phase = "night";
    room.round += 1;
  } else {
    room.phase = "day";
  }
  await saveRoom(code, room);
}

// Shared auth: loads the room + the requesting player and checks the token.
// Writes an error response and returns null on failure so callers can
// `if (!ctx) return;` straight after calling this.
async function authPlayer(req, res, params) {
  const code = String(params.code || "").trim().toUpperCase();
  const { playerId, token: tok } = params;
  if (!code || !playerId || !tok) {
    res.status(400).json({ error: "missing-params" });
    return null;
  }
  if (!redis) {
    res.status(503).json({ error: "store-unavailable" });
    return null;
  }
  const room = await getRoom(code);
  if (!room) {
    res.status(404).json({ error: "room-not-found" });
    return null;
  }
  const player = await getPlayer(code, playerId);
  if (!player || player.token !== tok) {
    res.status(403).json({ error: "invalid-token" });
    return null;
  }
  return { room, player };
}

module.exports = {
  redis, MIN_PLAYERS, MAX_PLAYERS, ROOM_TTL,
  roomCode, id, token, parse, rateLimit, clientIp,
  getRoom, saveRoom, getPlayers, getPlayer, savePlayer, getOrder,
  appendLog, getLog, appendChat, getChat,
  submitAction, getActions,
  buildRoleDeck, countAlive, checkWinner, tallyVotes,
  roleLabel, startGame, tryResolve, authPlayer,
};
