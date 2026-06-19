/**
 * POST /api/typeme/reset?slug={slug}   body: { ownerToken }  → { ok, raterCount, round }
 * Owner-only: clears every rating for the subject and starts a fresh round.
 * The public slug never grants this — a matching secret ownerToken is required.
 */
const lib = require("./_lib");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const slug = (req.query.slug ?? "").toString();
    if (!slug) return res.status(400).json({ error: "slug required" });

    const subject = await lib.getSubject(slug);
    if (!subject) return res.status(404).json({ error: "Not found" });

    const ownerToken = (req.body?.ownerToken ?? "").toString();
    if (!ownerToken || ownerToken !== subject.ownerToken) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const ok = await lib.rateLimit(`reset:${lib.clientIp(req)}`, 30, 3600);
    if (!ok) return res.status(429).json({ error: "Too many resets. Try again later." });

    const round = await lib.resetSubject(slug);
    return res.status(200).json({ ok: true, raterCount: 0, round });
  } catch (err) {
    console.error("reset:", err);
    if (err.message === "store-unavailable") {
      return res.status(503).json({ error: "Storage not configured." });
    }
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
