/**
 * Private contact details, deliberately kept out of the repository.
 *
 * lurved/prism is a public repo, so anything committed here is indexed,
 * scraped, and permanent in git history even after a later deletion. An
 * email address is already public on the site by choice; a mobile number is
 * a different exposure, so the value lives outside version control and only
 * the loader is committed.
 *
 * Resolution order:
 *   1. Environment variables (CV_PHONE). Durable across sessions if set in
 *      the environment config, and never touches the repo — the right home
 *      for this.
 *   2. jobs/.private.json — gitignored. Fine locally; lost whenever the
 *      container is rebuilt.
 *   3. A visible placeholder, so a missing value is obvious on the page
 *      rather than silently producing a CV with no phone number.
 */

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", ".private.json");

function load() {
  let file = {};
  try {
    if (fs.existsSync(FILE)) file = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    console.warn("  private: .private.json is unreadable, ignoring");
  }
  return {
    phone: process.env.CV_PHONE || file.phone || "[Phone number]",
  };
}

module.exports = { load, FILE };
