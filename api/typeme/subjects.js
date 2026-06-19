/**
 * POST /api/typeme/subjects   body: { name }  → { slug, ownerToken }
 * Mints a subject + secret owner token. Rate-limited per IP.
 */
const lib = require("./_lib");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const name = (req.body?.name ?? "").toString().trim();
    if (name.length < 1 || name.length > 40) {
      return res.status(400).json({ error: "Name must be 1–40 characters." });
    }

    const ok = await lib.rateLimit(`create:${lib.clientIp(req)}`, 15, 3600);
    if (!ok) return res.status(429).json({ error: "Too many links created. Try again later." });

    const { slug, ownerToken } = await lib.createSubject(name);
    return res.status(200).json({ slug, ownerToken });
  } catch (err) {
    console.error("subjects:", err);
    if (err.message === "store-unavailable") {
      return res.status(503).json({ error: "Storage not configured." });
    }
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
