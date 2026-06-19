/**
 * GET /api/typeme/subject?slug={slug}[&ownerToken=…]
 *   → { name, raterCount, tallies, code, portrait, hasTie, tiedAxes, isOwner }
 * Computes the resolved type server-side (build spec §6). The public slug never
 * grants owner powers — isOwner is true only when a matching ownerToken is sent.
 */
const lib = require("./_lib");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const slug = (req.query.slug ?? "").toString();
    if (!slug) return res.status(400).json({ error: "slug required" });

    const subject = await lib.getSubject(slug);
    if (!subject) return res.status(404).json({ error: "Not found" });

    const ratings = await lib.getRatings(slug);
    const result = lib.score(ratings);

    const ownerToken = (req.query.ownerToken ?? "").toString();
    const isOwner = !!ownerToken && ownerToken === subject.ownerToken;

    return res.status(200).json({
      name: subject.name,
      raterCount: result.raterCount,
      tallies: result.tallies,
      code: result.code,
      portrait: result.portrait,
      hasTie: result.hasTie,
      tiedAxes: result.tiedAxes,
      isOwner,
    });
  } catch (err) {
    console.error("subject:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
};
