/**
 * WEREWOLF — shared server logic.
 *
 * The app is a role dealer for an in-person werewolf game, not an online game
 * engine: it hands every player a private role and hands the host — who is the
 * moderator — the full roster. Everything after that (night, day, voting) is
 * played face to face, so there are no phases, actions, votes or chat here.
 *
 * Storage is the same Upstash/ioredis instance used by typeme. The key prefix
 * is still `who:` — it predates the move from /who to /werewolf and is kept on
 * purpose: it's invisible to users, and renaming it would orphan every live
 * room mid-game for no benefit. Not an oversight.
 *
 *   who:codes            set    every active room code (uniqueness)
 *   who:room:{code}      JSON   { code, hostPlayerId, phase, round }
 *   who:players:{code}   hash   playerId -> JSON { id, name, token, role, isHost }
 *   who:order:{code}     list   playerIds in join order
 *   who:rl:{bucket}      str    rate-limit counters (TTL)
 *
 * All room keys carry a TTL so abandoned rooms fall out of Redis on their own
 * rather than needing a cleanup job.
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

const ROOM_TTL = 6 * 60 * 60; // 6h — a long games night, then it expires

// Counts below are PLAYERS, excluding the host/moderator (who is never dealt a
// playing role). Four is the smallest deal that still yields a real game
// (1 wolf, 1 seer, 2 villagers).
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 20;

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

// ── rate limiting ──
async function rateLimit(bucket, max, windowSec) {
  if (!redis) return true; // no store → don't block (dev)
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
  return parse(await redis.hget(`who:players:${code}`, playerId));
}
async function savePlayer(code, player) {
  await redis.hset(`who:players:${code}`, player.id, JSON.stringify(player));
  await redis.expire(`who:players:${code}`, ROOM_TTL);
}
async function getOrder(code) {
  if (!redis) return [];
  return redis.lrange(`who:order:${code}`, 0, -1);
}

// ── roles ──
const ROLE_LABEL = {
  moderator: "Moderator",
  werewolf: "Werewolf",
  seer: "Seer",
  doctor: "Doctor",
  villager: "Villager",
};
function roleLabel(role) {
  return ROLE_LABEL[role] || role;
}

// Composition for n players (moderator excluded). Wolves stay a clear minority
// at every size; the seer joins from 4 players and the doctor from 6.
function composition(n) {
  const werewolf = Math.max(1, Math.floor(n / 4));
  const seer = n >= 4 ? 1 : 0;
  const doctor = n >= 6 ? 1 : 0;
  const villager = Math.max(0, n - werewolf - seer - doctor);
  return { werewolf, seer, doctor, villager };
}

function buildRoleDeck(n) {
  const c = composition(n);
  const deck = [];
  for (const [role, count] of Object.entries(c)) {
    for (let i = 0; i < count; i++) deck.push(role);
  }
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

// Deals a fresh set of roles to everyone except the host, who is always the
// moderator. Safe to call repeatedly — each call is a new round.
async function dealRoles(code) {
  const order = await getOrder(code);
  const players = await getPlayers(code);
  const room = await getRoom(code);

  const playerIds = order.filter((pid) => players[pid] && pid !== room.hostPlayerId);
  const deck = buildRoleDeck(playerIds.length);

  for (let i = 0; i < playerIds.length; i++) {
    const p = players[playerIds[i]];
    p.role = deck[i];
    await savePlayer(code, p);
  }
  const host = players[room.hostPlayerId];
  if (host) {
    host.role = "moderator";
    await savePlayer(code, host);
  }

  room.phase = "dealt";
  room.round = (room.round || 0) + 1;
  await saveRoom(code, room);
  return room.round;
}

// Clears every dealt role and reopens the room so latecomers can join.
async function reopenLobby(code) {
  const players = await getPlayers(code);
  for (const p of Object.values(players)) {
    p.role = null;
    await savePlayer(code, p);
  }
  const room = await getRoom(code);
  room.phase = "lobby";
  await saveRoom(code, room);
}

// ── auth ──
// Loads the room + requesting player and checks the token. Writes an error
// response and returns null on failure, so callers can `if (!ctx) return;`.
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
  roleLabel, composition, buildRoleDeck, dealRoles, reopenLobby, authPlayer,
};
