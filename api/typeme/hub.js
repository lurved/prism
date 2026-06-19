/**
 * Serves the SPA shell for /typeme/u/{slug} (and …/rate) with per-subject
 * Open Graph / Twitter meta injected, so a pasted link unfurls into a rich
 * preview in WhatsApp / iMessage. The same app.js then renders the live screen.
 */
const lib = require("./_lib");

function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function shell({ slug, mode, title, description, image, url }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="pris.la" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231C1B18'/%3E%3Ctext x='16' y='22' font-family='Georgia,serif' font-size='18' fill='%23F2F1ED' text-anchor='middle'%3ET%3C/text%3E%3C/svg%3E" />
  <link rel="stylesheet" href="/typeme/app.css" />
</head>
<body>
  <div id="app"></div>
  <script>window.__BOOT__ = { slug: ${JSON.stringify(slug)}, mode: ${JSON.stringify(mode || "hub")} };</script>
  <script src="/typeme/data.js"></script>
  <script src="/typeme/app.js"></script>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  const slug = (req.query.slug ?? "").toString();
  const mode = req.query.mode === "rate" ? "rate" : "hub";
  const base = "https://pris.la";
  const url = `${base}/typeme/u/${slug}${mode === "rate" ? "/rate" : ""}`;
  const image = `${base}/api/typeme/og?slug=${encodeURIComponent(slug)}`;

  let title = "Type Me";
  let description = "Get typed by the people who know you. Four taps, one verdict.";

  try {
    const subject = await lib.getSubject(slug);
    if (subject) {
      const ratings = await lib.getRatings(slug);
      const result = lib.score(ratings);
      if (mode === "rate") {
        title = `Type ${subject.name}`;
        description = `How does ${subject.name} come across? Four taps — they only ever see the counts.`;
      } else if (result.portrait) {
        title = `${subject.name} comes across as ${result.portrait.name}`;
        description = `${result.raterCount} friends typed ${subject.name}. ${result.code} — see where they disagree, then get typed yourself.`;
      } else {
        title = `Type ${subject.name}`;
        description = `${subject.name}'s friends are typing them. Add your read — four taps, anonymous.`;
      }
    }
  } catch (err) {
    console.error("hub:", err);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(shell({ slug, mode, title, description, image, url }));
};
