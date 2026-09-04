/**
 * Font embedding for the print CV.
 *
 * The print faces are fetched once,
 * cached in .fonts/, and inlined as base64 @font-face rules so the PDF embeds
 * them and renders identically on any machine.
 *
 * If the fetch fails — offline, proxy, whatever — this returns an empty string
 * and the stylesheet falls back to its Georgia / Arial stacks. A CV that
 * renders in fallback type is a minor loss; one that fails to render is not.
 */

const fs = require("fs");
const path = require("path");

const CACHE = path.join(__dirname, "..", ".fonts");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Aptos is Microsoft's Office default and the preferred face, but it is not
// on Google Fonts and cannot be embedded here. Inter is the closest widely
// available humanist sans and stands in for the PDF only; the .docx asks for
// Aptos by name, so anyone with Office sees the real thing.
const FAMILIES = [
  { css: "Inter:wght@400;500;600;700", family: "Inter" },
];

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * @returns {Promise<string>} @font-face CSS with embedded woff2, or "" on failure.
 */
async function embeddedCss() {
  const cached = path.join(CACHE, "faces.css");
  if (fs.existsSync(cached)) return fs.readFileSync(cached, "utf8");

  try {
    fs.mkdirSync(CACHE, { recursive: true });
    let out = "";

    for (const fam of FAMILIES) {
      const css = await fetchText(
        `https://fonts.googleapis.com/css2?family=${fam.css}&display=swap`
      );
      // Keep the latin block only — the rest is weight the CV never uses.
      const blocks = css.split("@font-face").slice(1).map((b) => "@font-face" + b);
      for (const block of blocks) {
        if (!/unicode-range:[^;]*U\+0000/.test(block) && /unicode-range/.test(block)) continue;
        const url = (block.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
        if (!url) continue;
        const buf = await fetchBuffer(url);
        // Google ships font-display:swap. Headless Chrome can snapshot the
        // page before a swapped face applies, silently printing the fallback
        // — which is how a cold cache produced a DejaVu PDF. block makes it
        // wait; the face is a data URI, so there is nothing to wait for.
        out += block.replace(/font-display:\s*swap/g, "font-display: block").replace(
          /url\(https:[^)]+\.woff2\)/,
          `url(data:font/woff2;base64,${buf.toString("base64")})`
        );
      }
    }

    if (!out) throw new Error("no faces resolved");
    fs.writeFileSync(cached, out);
    return out;
  } catch (e) {
    console.warn(`  fonts: falling back to system stacks (${e.message})`);
    return "";
  }
}

module.exports = { embeddedCss };
