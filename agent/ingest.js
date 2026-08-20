#!/usr/bin/env node
/**
 * Knowledge ingest — turns a folder on Priscilla's machine into the agent's
 * only source of truth.
 *
 *   node ingest.js --dry-run     # report what would be ingested, write nothing
 *   node ingest.js               # write agent/knowledge/corpus.json
 *   node ingest.js --src /some/other/folder
 *
 * The deployed agent (Vercel) cannot read a local disk, so this runs locally
 * and commits its output. Anything ingested becomes answerable by a public
 * chat widget — read MANIFEST.md after every run before committing.
 */

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "ingest.config.json");
const OUT_DIR = path.join(__dirname, "knowledge");

/**
 * Never ingested, whatever ingest.config.json says. Credentials, keychains and
 * OS/library noise have no business inside a public agent's context window.
 */
const HARD_DENY = [
  "**/.ssh/**", "**/.aws/**", "**/.gnupg/**", "**/.gpg/**", "**/.docker/**",
  "**/.kube/**", "**/.npm/**", "**/.cache/**", "**/.Trash/**",
  "**/Library/**", "**/Applications/**", "**/.config/**", "**/.local/**",
  "**/.vscode/**", "**/.idea/**",
  "**/.env", "**/.env.*", "**/*.pem", "**/*.key", "**/*.p12", "**/*.pfx",
  "**/*.keychain", "**/*.keychain-db", "**/id_rsa*", "**/id_ed25519*",
  "**/credentials", "**/*credentials*.json", "**/*secret*", "**/*password*",
];

/** Content that looks like a live credential — file is dropped, not chunked. */
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-ant-[A-Za-z0-9_-]{20,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
];

// ---------------------------------------------------------------- globbing

/** Minimal glob → RegExp. Supports **, * and ?; everything else is literal. */
function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // `**/` may match zero directories, so the slash is part of the group.
        if (glob[i + 2] === "/") { out += "(?:.*/)?"; i += 2; }
        else { out += ".*"; i += 1; }
      } else {
        out += "[^/]*";
      }
    } else if (c === "?") {
      out += "[^/]";
    } else {
      out += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${out}$`);
}

function matchesAny(relPath, globs) {
  return globs.some((g) => globToRegExp(g).test(relPath));
}

// -------------------------------------------------------------- extraction

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Optional parsers: installed locally for ingest, never needed at runtime. */
function optionalRequire(name) {
  try { return require(name); } catch { return null; }
}

async function extractText(absPath, ext) {
  if (ext === ".pdf") {
    const pdfParse = optionalRequire("pdf-parse");
    if (!pdfParse) return { text: null, skip: "pdf-parse not installed (npm i pdf-parse)" };
    const data = await pdfParse(fs.readFileSync(absPath));
    return { text: data.text };
  }

  if (ext === ".docx") {
    const mammoth = optionalRequire("mammoth");
    if (!mammoth) return { text: null, skip: "mammoth not installed (npm i mammoth)" };
    const { value } = await mammoth.extractRawText({ path: absPath });
    return { text: value };
  }

  const raw = fs.readFileSync(absPath, "utf8");
  if (ext === ".html" || ext === ".htm") return { text: stripHtml(raw) };
  if (ext === ".json") {
    // Pretty-print so the chunker has line structure to split on.
    try { return { text: JSON.stringify(JSON.parse(raw), null, 2) }; }
    catch { return { text: raw }; }
  }
  return { text: raw };
}

function normalise(text) {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ---------------------------------------------------------------- chunking

/**
 * Split on blank lines, then pack paragraphs up to chunkChars with a little
 * overlap so a fact spanning a boundary is still retrievable from either side.
 */
function chunk(text, { chunkChars, chunkOverlapChars }) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = "";

  const flush = () => {
    if (!current.trim()) return;
    chunks.push(current.trim());
    current = chunkOverlapChars > 0 ? current.slice(-chunkOverlapChars) : "";
  };

  for (const para of paragraphs) {
    if (para.length > chunkChars) {
      flush();
      for (let i = 0; i < para.length; i += chunkChars) {
        chunks.push(para.slice(i, i + chunkChars).trim());
      }
      current = "";
      continue;
    }
    if (current.length + para.length + 2 > chunkChars) flush();
    current += (current ? "\n\n" : "") + para;
  }
  flush();

  return chunks.filter((c) => c.length > 40);
}

/** First markdown heading or non-trivial line, used as a human-readable label. */
function titleOf(text, relPath) {
  const heading = text.match(/^#{1,3}\s+(.+)$/m);
  if (heading) return heading[1].trim().slice(0, 120);
  const firstLine = text.split("\n").find((l) => l.trim().length > 8);
  return (firstLine ? firstLine.trim() : path.basename(relPath)).slice(0, 120);
}

// ------------------------------------------------------------------ walking

function walk(root, { exclude, extensions, maxFileBytes, maxFiles }, report) {
  const found = [];
  const stack = [root];

  while (stack.length && found.length < maxFiles) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (err) { report.unreadable.push({ path: dir, reason: err.code }); continue; }

    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      const rel = path.relative(root, abs);

      if (matchesAny(rel, HARD_DENY)) { report.denied.push(rel); continue; }
      if (matchesAny(rel, exclude)) { report.excluded.push(rel); continue; }

      if (entry.isSymbolicLink()) { report.skipped.push({ rel, reason: "symlink" }); continue; }
      if (entry.isDirectory()) { stack.push(abs); continue; }
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!extensions.includes(ext)) continue;

      let stat;
      try { stat = fs.statSync(abs); }
      catch (err) { report.unreadable.push({ path: rel, reason: err.code }); continue; }
      if (stat.size > maxFileBytes) { report.skipped.push({ rel, reason: `${stat.size} bytes over maxFileBytes` }); continue; }

      found.push({ abs, rel, ext, size: stat.size, mtime: stat.mtime.toISOString() });
    }
  }

  return found;
}

// -------------------------------------------------------------------- main

function parseArgs(argv) {
  const args = { dryRun: false, src: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run" || argv[i] === "-n") args.dryRun = true;
    else if (argv[i] === "--src") args.src = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

  const sourceDir = args.src || process.env.AGENT_SOURCE_DIR || config.sourceDir;
  const include = config.include && config.include.length ? config.include : ["**"];

  if (!fs.existsSync(sourceDir)) {
    console.error(`\nSource folder not found: ${sourceDir}`);
    console.error("Run this on the machine that has the folder, or pass --src <path>.\n");
    process.exit(1);
  }

  const report = { denied: [], excluded: [], skipped: [], unreadable: [], secrets: [] };
  const candidates = walk(sourceDir, {
    exclude: config.exclude || [],
    extensions: config.extensions,
    maxFileBytes: config.maxFileBytes,
    maxFiles: config.maxFiles,
  }, report);

  const files = candidates.filter((f) => {
    if (matchesAny(f.rel, include)) return true;
    report.excluded.push(f.rel);
    return false;
  });

  const documents = [];
  let chunkCount = 0;

  for (const file of files) {
    let text;
    try {
      const result = await extractText(file.abs, file.ext);
      if (!result.text) { report.skipped.push({ rel: file.rel, reason: result.skip }); continue; }
      text = normalise(result.text);
    } catch (err) {
      report.unreadable.push({ path: file.rel, reason: err.message });
      continue;
    }

    // Credential check first: a short file is still a leak worth reporting.
    if (SECRET_PATTERNS.some((re) => re.test(text))) { report.secrets.push(file.rel); continue; }
    if (text.length < 80) { report.skipped.push({ rel: file.rel, reason: "under 80 chars of text" }); continue; }

    const chunks = chunk(text, {
      chunkChars: config.chunkChars || 1200,
      chunkOverlapChars: config.chunkOverlapChars || 150,
    });
    if (!chunks.length) { report.skipped.push({ rel: file.rel, reason: "no usable chunks" }); continue; }

    documents.push({
      id: file.rel,
      source: file.rel,
      title: titleOf(text, file.rel),
      mtime: file.mtime,
      bytes: file.size,
      chunks: chunks.map((body, index) => ({ index, text: body })),
    });
    chunkCount += chunks.length;
  }

  documents.sort((a, b) => a.source.localeCompare(b.source));

  const corpus = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    documentCount: documents.length,
    chunkCount,
    documents,
  };

  printSummary(corpus, report, args.dryRun);

  if (args.dryRun) {
    console.log("Dry run — nothing written. Re-run without --dry-run to write the corpus.\n");
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "corpus.json"), JSON.stringify(corpus, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "MANIFEST.md"), renderManifest(corpus, report));

  console.log(`Wrote knowledge/corpus.json and knowledge/MANIFEST.md`);
  console.log(`Review MANIFEST.md before committing — every ingested file becomes publicly answerable.\n`);
}

function printSummary(corpus, report, dryRun) {
  console.log(`\n${dryRun ? "Would ingest" : "Ingested"} from ${corpus.sourceDir}`);
  console.log(`  documents: ${corpus.documentCount}`);
  console.log(`  chunks:    ${corpus.chunkCount}`);
  console.log(`  ~tokens:   ${estimateTokens(corpus)}`);
  if (report.secrets.length) console.log(`  dropped (looked like credentials): ${report.secrets.length}`);
  if (report.denied.length) console.log(`  blocked by hard denylist: ${report.denied.length}`);
  if (report.unreadable.length) console.log(`  unreadable: ${report.unreadable.length}`);
  console.log("");
  for (const doc of corpus.documents) {
    console.log(`  ${doc.source} — ${doc.chunks.length} chunk(s)`);
  }
  console.log("");
}

function estimateTokens(corpus) {
  const chars = corpus.documents.reduce(
    (sum, d) => sum + d.chunks.reduce((s, c) => s + c.text.length, 0), 0);
  return Math.round(chars / 4);
}

function renderManifest(corpus, report) {
  const lines = [
    "# Agent knowledge manifest",
    "",
    "Generated by `agent/ingest.js`. Everything listed here is answerable by the",
    "public chat agent on pris.la. If a file should not be, remove it from the",
    "source folder or add it to `exclude` in `ingest.config.json`, then re-run.",
    "",
    `- Generated: ${corpus.generatedAt}`,
    `- Source folder: \`${corpus.sourceDir}\``,
    `- Documents: ${corpus.documentCount}`,
    `- Chunks: ${corpus.chunkCount}`,
    `- Estimated tokens: ~${estimateTokens(corpus)}`,
    "",
    "## Ingested documents",
    "",
    "| Source | Title | Chunks | Modified |",
    "| --- | --- | --- | --- |",
  ];

  for (const doc of corpus.documents) {
    const title = doc.title.replace(/\|/g, "\\|");
    lines.push(`| \`${doc.source}\` | ${title} | ${doc.chunks.length} | ${doc.mtime.slice(0, 10)} |`);
  }

  const section = (heading, items) => {
    if (!items.length) return;
    lines.push("", `## ${heading}`, "");
    for (const item of items.slice(0, 100)) {
      lines.push(typeof item === "string" ? `- \`${item}\`` : `- \`${item.rel || item.path}\` — ${item.reason}`);
    }
    if (items.length > 100) lines.push(`- …and ${items.length - 100} more`);
  };

  section("Dropped — content matched a credential pattern", report.secrets);
  section("Skipped", report.skipped);
  section("Unreadable", report.unreadable);

  lines.push("", `Blocked by the built-in denylist: ${report.denied.length} path(s).`, "");
  return lines.join("\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
