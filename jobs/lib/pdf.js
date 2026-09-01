/**
 * HTML to PDF via the bundled Chromium.
 *
 * Chrome prints real text, not outlines, so the resulting PDF is still
 * machine-readable — which is the whole point of designing this one rather
 * than exporting a picture of a CV.
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const CANDIDATES = [
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].filter(Boolean);

function chromePath() {
  const glob = "/opt/pw-browsers";
  const found = CANDIDATES.find((p) => fs.existsSync(p));
  if (found) return found;
  // Fall back to any versioned chromium the image happens to ship.
  if (fs.existsSync(glob)) {
    for (const d of fs.readdirSync(glob)) {
      const p = path.join(glob, d, "chrome-linux", "chrome");
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

/**
 * @param {string} html   complete HTML document
 * @param {string} outPdf destination path
 * @returns {boolean}     false if no browser is available
 */
function render(html, outPdf) {
  const chrome = chromePath();
  if (!chrome) {
    console.warn("  pdf: no Chromium found, skipping");
    return false;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cv-"));
  const src = path.join(tmp, "cv.html");
  fs.writeFileSync(src, html);
  fs.mkdirSync(path.dirname(outPdf), { recursive: true });

  execFileSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--no-pdf-header-footer",
      `--print-to-pdf=${outPdf}`,
      `file://${src}`,
    ],
    { stdio: "pipe", timeout: 90000 }
  );

  fs.rmSync(tmp, { recursive: true, force: true });
  return fs.existsSync(outPdf);
}

module.exports = { render, chromePath };
