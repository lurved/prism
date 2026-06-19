/**
 * Type Me — shared server logic.
 * Storage is Upstash Redis (already provisioned for this project) rather than
 * Postgres — same two-entity model from the build spec, mapped onto keys:
 *
 *   tm:subject:{slug}   JSON   { name, ownerToken, createdAt }
 *   tm:ratings:{slug}   list   compact JSON per rating { ei,sn,tf,jp,rt,ts }
 *   tm:raters:{slug}    set    rater_token soft-dedupe
 *   tm:slugs            set    every slug ever minted (uniqueness check)
 *   tm:rl:{bucket}      str    rate-limit counters (TTL)
 */

const crypto = require("crypto");
const Redis = require("ioredis");

// TCP Redis via the project's REDIS_URL (rediss:// → TLS auto-detected).
// Module-level singleton so warm invocations reuse the connection.
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: false,
    })
  : null;
if (redis) redis.on("error", (e) => console.error("redis:", e.message));

const TARGET_RATERS = 3;

// ── Axes: only what the server needs to validate + tally. The rich copy
//    (prompts, labels, descriptions) is owned by the frontend, verbatim from
//    the prototype's AXES. ──
const AXES = [
  { key: "EI", left: "E", right: "I" },
  { key: "SN", left: "S", right: "N" },
  { key: "TF", left: "T", right: "F" },
  { key: "JP", left: "J", right: "P" },
];
const FIELD = { EI: "ei", SN: "sn", TF: "tf", JP: "jp" };

// ── The 16 type portraits. Nicknames are the standard set; one-liners are ours
//    (copied verbatim from the prototype — see build spec §1). ──
const TYPES = {
  INTJ: { name: "The Architect", line: "Comes across as the one with a plan when no one else has one. Independent and a few steps ahead, they trust their own logic over the crowd and would rather build the system than follow it. People read them as private, exacting, and quietly certain." },
  INTP: { name: "The Logician", line: "Reads as the resident thinker — endlessly curious about how things work, happy to poke holes in any idea including their own. They live a half-step inside their own head, chasing the interesting problem over the practical one, and come across as precise, original, and a little detached." },
  ENTJ: { name: "The Commander", line: "Comes across as someone who takes the wheel. Direct, organized, and goal-first, they spot the path and start moving people down it. Others read them as confident and decisive — sometimes blunt, rarely uncertain." },
  ENTP: { name: "The Debater", line: "The one who'll argue the other side just to see where it goes. Quick, inventive, and allergic to dull consensus, they spark off ideas and turn small talk into a sparring match. People find them clever, restless, and hard to pin down." },
  INFJ: { name: "The Advocate", line: "Reads as quietly intense — warm on the surface, with a private conviction running underneath. They care about meaning and the people around them, and tend to sense what others are feeling before it's said. Others find them insightful, idealistic, and a little hard to fully know." },
  INFP: { name: "The Mediator", line: "Comes across as gentle and a touch dreamy, guided more by what feels right than by the rulebook. They hold deep values quietly and light up around meaning, creativity, and sincerity. People read them as kind, principled, and more steel-cored than they look." },
  ENFJ: { name: "The Protagonist", line: "The one who pulls a room together. Warm, expressive, and tuned to how everyone's doing, they naturally rally people around a shared idea. Others read them as charismatic, encouraging, and genuinely invested in you." },
  ENFP: { name: "The Campaigner", line: "Reads as bright and spontaneous, finding a spark of possibility in almost everything. Enthusiastic and people-loving, they chase curiosity wherever it leads and bring others along for the ride. People find them warm, expressive, and scattered in the best way." },
  ISTJ: { name: "The Logistician", line: "Comes across as the dependable one — does what they say, on time, done right. Practical and order-loving, they trust proven methods and keep things running while others improvise. Others read them as steady, precise, and quietly responsible." },
  ISFJ: { name: "The Defender", line: "Reads as warm and unshowy, the person quietly making sure everyone's okay. Loyal and attentive to detail, they remember the small things and show care through action rather than words. People find them kind, reliable, and easy to lean on." },
  ESTJ: { name: "The Executive", line: "The one who takes charge and gets it organized. Direct, practical, and decisive, they value structure and aren't shy about saying how things should run. Others read them as confident, dependable, and firmly in command." },
  ESFJ: { name: "The Consul", line: "Comes across as the social glue — warm, attentive, always looking out for the group. They thrive on connection and harmony, remembering the birthdays and smoothing things over. People read them as caring, sociable, and generous with their time." },
  ISTP: { name: "The Virtuoso", line: "Reads as calm and capable, the one who quietly figures out how to fix it. Hands-on and unflappable, they'd rather do than discuss and stay cool when things get chaotic. Others find them independent, practical, and hard to ruffle." },
  ISFP: { name: "The Adventurer", line: "Comes across as easygoing and quietly creative, living in the moment more than the plan. Gentle and a little private, they show who they are through what they make and do rather than what they say. People read them as warm, artistic, and refreshingly unpretentious." },
  ESTP: { name: "The Entrepreneur", line: "The one who's first to act and last to overthink it. Bold, energetic, and tuned to the present, they thrive on momentum and aren't fazed by a little risk. Others read them as charismatic, spontaneous, and impossible to bore." },
  ESFP: { name: "The Entertainer", line: "Reads as the spark of the room — fun, spontaneous, fully in the moment. They love people, color, and a good time, and pull others into the energy with them. People find them warm, lively, and generous with attention." },
};

// ── id helpers ──
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function nanoid(size) {
  const bytes = crypto.randomBytes(size);
  let out = "";
  for (let i = 0; i < size; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
function token() {
  return crypto.randomBytes(24).toString("hex"); // 48 chars, secret
}

// ── rate limiting ──
async function rateLimit(bucket, max, windowSec) {
  if (!redis) return true; // no store → don't block (dev)
  const key = `tm:rl:${bucket}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, windowSec);
  return n <= max;
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// ── subjects ──
async function createSubject(name) {
  if (!redis) throw new Error("store-unavailable");
  let slug;
  for (let i = 0; i < 6; i++) {
    slug = nanoid(8);
    const added = await redis.sadd("tm:slugs", slug);
    if (added === 1) break; // unique
    slug = null;
  }
  if (!slug) throw new Error("slug-collision");

  const ownerToken = token();
  const subject = { name, ownerToken, round: 1, createdAt: new Date().toISOString() };
  await redis.set(`tm:subject:${slug}`, JSON.stringify(subject));
  return { slug, ownerToken };
}

// Owner-only fresh start: wipe ratings + dedupe set, bump the round so
// previously-rated friends are no longer blocked from rating again.
async function resetSubject(slug) {
  if (!redis) throw new Error("store-unavailable");
  const subject = await getSubject(slug);
  if (!subject) return null;
  subject.round = (subject.round || 1) + 1;
  await redis.set(`tm:subject:${slug}`, JSON.stringify(subject));
  await redis.del(`tm:ratings:${slug}`, `tm:raters:${slug}`);
  return subject.round;
}

async function getSubject(slug) {
  if (!redis) return null;
  const raw = await redis.get(`tm:subject:${slug}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw; // upstash may auto-parse
}

async function getRatings(slug) {
  if (!redis) return [];
  const rows = await redis.lrange(`tm:ratings:${slug}`, 0, -1);
  return rows.map((r) => (typeof r === "string" ? JSON.parse(r) : r));
}

// Returns { added:bool, raterCount, already:bool }
async function addRating(slug, letters, raterToken) {
  if (!redis) throw new Error("store-unavailable");
  if (raterToken) {
    const seen = await redis.sismember(`tm:raters:${slug}`, raterToken);
    if (seen) {
      const raterCount = await redis.llen(`tm:ratings:${slug}`);
      return { added: false, already: true, raterCount };
    }
    await redis.sadd(`tm:raters:${slug}`, raterToken);
  }
  const row = {
    ei: letters.EI, sn: letters.SN, tf: letters.TF, jp: letters.JP,
    rt: raterToken || null, ts: new Date().toISOString(),
  };
  await redis.rpush(`tm:ratings:${slug}`, JSON.stringify(row));
  const raterCount = await redis.llen(`tm:ratings:${slug}`);
  return { added: true, already: false, raterCount };
}

// ── validation ──
function validateLetters(body) {
  const out = {};
  for (const axis of AXES) {
    const v = body[axis.key] ?? body[FIELD[axis.key]];
    if (v !== axis.left && v !== axis.right) {
      return { error: `Invalid ${axis.key}` };
    }
    out[axis.key] = v;
  }
  return { letters: out };
}

// ── scoring (build spec §6) ──
// Tally each axis; majority wins. If any axis is an even-count tie, DON'T
// force a type — that tie becomes the growth loop ("one more friend settles it").
function score(ratings) {
  const raterCount = ratings.length;
  const tallies = AXES.map((axis) => {
    let leftCount = 0;
    for (const r of ratings) {
      const v = r[FIELD[axis.key]];
      if (v === axis.left) leftCount++;
    }
    const rightCount = raterCount - leftCount;
    let leadLetter = null;
    if (leftCount > rightCount) leadLetter = axis.left;
    else if (rightCount > leftCount) leadLetter = axis.right;
    const split = raterCount ? Math.min(leftCount, rightCount) / raterCount : 0;
    return { key: axis.key, leftCount, rightCount, leadLetter, split };
  });

  const tiedAxes = tallies.filter((t) => raterCount > 0 && t.leadLetter === null).map((t) => t.key);
  const hasTie = tiedAxes.length > 0;

  let code = null;
  let portrait = null;
  if (raterCount > 0 && !hasTie) {
    code = tallies.map((t) => t.leadLetter).join("");
    portrait = TYPES[code] || null;
  }

  return { raterCount, tallies, hasTie, tiedAxes, code, portrait };
}

module.exports = {
  redis, TARGET_RATERS, AXES, TYPES,
  nanoid, token, rateLimit, clientIp,
  createSubject, resetSubject, getSubject, getRatings, addRating,
  validateLetters, score,
};
