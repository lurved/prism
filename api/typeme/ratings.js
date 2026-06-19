/**
 * POST /api/typeme/ratings?slug={slug}
 *   body: { ei, sn, tf, jp, raterToken }  → { ok, raterCount, already }
 * Validates every letter against its axis (never trust the client). Soft-dedupes
 * by raterToken: a repeat browser doesn't double-count, it just gets the result.
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

    const { letters, error } = lib.validateLetters(req.body || {});
    if (error) return res.status(400).json({ error });

    const ok = await lib.rateLimit(`rate:${lib.clientIp(req)}`, 60, 3600);
    if (!ok) return res.status(429).json({ error: "Too many submissions. Try again later." });

    const raterToken = (req.body?.raterToken ?? "").toString().slice(0, 64) || null;
    const result = await lib.addRating(slug, letters, raterToken);

    return res.status(200).json({
      ok: true,
      already: result.already,
      raterCount: result.raterCount,
    });
  } catch (err) {
    console.error("ratings:", err);
    if (err.message === "store-unavailable") {
      return res.status(503).json({ error: "Storage not configured." });
    }
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
