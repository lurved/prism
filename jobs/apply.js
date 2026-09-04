#!/usr/bin/env node
/**
 * Application pipeline — one posting in, a decision and a tailored pack out.
 *
 *   node jobs/apply.js jobs/jds/some-role.txt --role "Design Lead" --org "Endowus"
 *   node jobs/apply.js jobs/jds/some-role.txt --score-only
 *
 * Produces jobs/applications/<slug>/ containing an ATS .docx, a matching
 * .txt for paste-box forms, a cover note, and a fit report showing which
 * requirements the profile evidences and which it does not — then records
 * the role in jobs/pipeline.json.
 *
 * What it does not do: submit anything. See jobs/README.md.
 */

const fs = require("fs");
const path = require("path");

const profile = require("../agent/profile");
const keywords = require("./lib/keywords");
const fit = require("./lib/fit");
const grouping = require("./lib/grouping");
const cv = require("./lib/cv");
const tailor = require("./lib/tailor");
const fonts = require("./lib/fonts");
const pdf = require("./lib/pdf");

const ROOT = __dirname;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--score-only") args.scoreOnly = true;
    else if (a === "--no-letter") args.noLetter = true;
    else if (a === "--no-pdf") args.noPdf = true;
    else if (a === "--force") args.force = true;
    else if (a.startsWith("--")) args[a.slice(2)] = argv[++i];
    else args._.push(a);
  }
  return args;
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/**
 * The CV filename is named for the candidate, not the posting.
 *
 * The directory already carries the role, which is what you need locally; the
 * file is what reaches a recruiter, who sorts by candidate and already knows
 * the role. A neutral name also fails quietly if it ever goes to the wrong
 * employer, where one naming the posting would announce it. Proper case
 * because a lowercase slug reads machine-generated on an emailed attachment.
 */
const cvFileBase = (profile) =>
  profile.name
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, ""))
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-") + "-CV";

/** Best-effort role/org from the posting's opening lines. */
function infer(jd, file) {
  const head = jd.split(/\r?\n/).slice(0, 12).map((l) => l.trim()).filter(Boolean);
  const roleLine = head.find((l) => /lead|head|director|manager|principal|senior|officer|engineer|designer|analyst/i.test(l) && l.length < 90);
  const orgLine = head.find((l) => /^(about|at)\s+[A-Z]/.test(l));
  return {
    role: roleLine || path.basename(file, path.extname(file)).replace(/-/g, " "),
    org: orgLine ? orgLine.replace(/^(about|at)\s+/i, "").replace(/[.,:].*$/, "") : null,
  };
}

function fitReport({ role, org, result, v, kw, groups, file }) {
  const L = [];
  L.push(`# Fit report — ${role}${org ? `, ${org}` : ""}`, "");
  L.push(`Source: \`${path.relative(process.cwd(), file)}\`  ·  Generated ${new Date().toISOString().slice(0, 10)}`, "");
  L.push(`## Verdict: ${v.band} (${result.requirementCoverage ?? result.coverage}% weighted coverage of stated requirements)`, "");
  L.push(v.note, "");
  L.push(`Overall keyword coverage: ${result.coverage}%  ·  Terms extracted: ${kw.length}  ·  Evidenced: ${result.matched.length}  ·  Gaps: ${result.gaps.length}`, "");

  L.push("## Requirements the profile evidences", "");
  for (const m of result.matched.slice(0, 20)) {
    L.push(`**${m.term}**${m.inRequirements ? " _(in requirements section)_" : ""}`);
    L.push(`> ${m.evidence[0].source} — ${m.evidence[0].text}`, "");
  }

  L.push("## Gaps — nothing in the profile supports these", "");
  if (!result.gaps.length) L.push("_None._", "");
  else {
    L.push("These are not on the CV, by design. Decide for each whether you have evidence the profile is missing, or whether it is a real gap to address in the letter.", "");
    for (const g of result.gaps) L.push(`- ${g.term}${g.inRequirements ? " **(stated requirement)**" : ""}`);
    L.push("");
  }

  L.push("## Competency blocks written to the CV", "");
  for (const g of groups) L.push(`**${g.name}** — ${g.terms.join(", ")}`, "");
  return L.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = args._[0];
  if (!file) {
    console.error("usage: node jobs/apply.js <jd-file> [--role R] [--org O] [--score-only] [--no-letter] [--force]");
    process.exit(1);
  }
  const jd = fs.readFileSync(file, "utf8");
  const guessed = infer(jd, file);
  const role = args.role || guessed.role;
  const org = args.org || guessed.org;

  // The employer's own name and product nouns are not candidate requirements —
  // no CV contains them — so scoring against them just depresses coverage.
  const orgWords = (org || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const kw = keywords
    .extract(jd, { limit: 66 })
    .filter((t) => !orgWords.some((w) => t.term.includes(w)))
    .slice(0, 60);
  const result = fit.score(profile, kw);
  const v = fit.verdict(result);
  const { groups, flat: flatTerms, leadTheme } = grouping.group(result.matched);

  const thinReqs = result.requirementTermCount != null && result.requirementTermCount < fit.THIN_REQUIREMENTS;
  const coveragePct = thinReqs ? result.coverage : (result.requirementCoverage ?? result.coverage);

  console.log(`\n  ${role}${org ? `  ·  ${org}` : ""}`);
  console.log(`  ${v.band} — ${coveragePct}% of the posting's vocabulary evidenced`);
  console.log(`  ${v.note}`);
  if (thinReqs) {
    console.log(`  NOTE: the requirements section is thin (${result.requirementTermCount} terms) and reads as boilerplate.`);
    if (result.requirementCoverage != null) {
      console.log(`        Scored on the whole posting instead; requirement-only coverage would say ${result.requirementCoverage}%.`);
    } else {
      console.log(`        No requirements heading was recognised at all, so the whole posting is weighted evenly.`);
    }
    console.log(`        The real demands are in the responsibilities — read the gap list, not the number.`);
  }
  console.log(`  Evidenced ${result.matched.length}/${kw.length} terms · lead theme: ${leadTheme || "n/a"}`);
  if (result.gaps.filter((g) => g.inRequirements).length) {
    console.log(`  Gaps in stated requirements: ${result.gaps.filter((g) => g.inRequirements).map((g) => g.term).join(", ")}`);
  }

  if (args.scoreOnly) return;

  const outDir = path.join(ROOT, "applications", slugify(`${org || ""} ${role}`));

  // A submitted application is a record of what was actually sent.
  // Regenerating it silently rewrites that record — the profile has moved on
  // since, so the files would no longer match the ones the employer has.
  const pipePathEarly = path.join(ROOT, "pipeline.json");
  const existing = fs.existsSync(pipePathEarly)
    ? JSON.parse(fs.readFileSync(pipePathEarly, "utf8")).find((p) => p.slug === path.basename(outDir))
    : null;
  if (existing && existing.status === "submitted" && !args.force) {
    console.log(`\n  Already submitted${existing.submitted ? ` on ${existing.submitted}` : ""} — not regenerating.`);
    console.log(`  The files on disk are what was sent. Pass --force to overwrite them.\n`);
    return;
  }
  fs.mkdirSync(outDir, { recursive: true });

  const spotlight = tailor.spotlightFor(profile, leadTheme);

  // A hand-written summary in summaries/<slug>.txt wins over anything the
  // tool drafts. The summary is the most-read block on the page and the one
  // most worth writing yourself; generation is the fallback, not the ceiling.
  const override = path.join(ROOT, "summaries", `${path.basename(outDir)}.txt`);
  const { text: summary, drafted } = fs.existsSync(override)
    ? { text: fs.readFileSync(override, "utf8").trim(), drafted: "hand-written" }
    : await tailor.summaryFor({ profile, jd, groups, fitResult: result });

  // The headline is positioning, like the summary — a hand-written one wins.
  const headlineFile = path.join(ROOT, "headlines", `${path.basename(outDir)}.txt`);
  const headline = fs.existsSync(headlineFile)
    ? fs.readFileSync(headlineFile, "utf8").trim()
    : tailor.headlineFor(profile, leadTheme);

  const model = cv.blocks({
    profile,
    headline,
    summary,
    groups,
    flatTerms,
    spotlight,
  });

  const base = cvFileBase(profile);
  await cv.toDocx(model, path.join(outDir, `${base}.docx`));
  const txt = cv.toText(model);
  fs.writeFileSync(path.join(outDir, `${base}.txt`), txt);

  // Typeset PDF in the pris.la faces, for sending to a person rather than a
  // portal. Same block model, so it can never disagree with the .docx.
  if (!args.noPdf) {
    const html = cv.toHtml(model, { fontCss: await fonts.embeddedCss() });
    fs.writeFileSync(path.join(outDir, `${base}.html`), html);
    pdf.render(html, path.join(outDir, `${base}.pdf`));
  }

  // Verify the tailored CV actually carries the terms it was built for.
  const cov = keywords.coverage(txt, result.matched);
  fs.writeFileSync(path.join(outDir, "fit-report.md"), fitReport({ role, org, result, v, kw, groups, file }));

  if (!args.noLetter) {
    const letterOverride = path.join(ROOT, "letters", `${path.basename(outDir)}.md`);
    const letter = fs.existsSync(letterOverride)
      ? fs.readFileSync(letterOverride, "utf8")
      : await tailor.letterFor({ profile, jd, role, org, fitResult: result });
    fs.writeFileSync(path.join(outDir, "cover-note.md"), letter);
  }

  // Pipeline record — the tracker exists so you can see what was sent where.
  const pipePath = path.join(ROOT, "pipeline.json");
  const pipeline = fs.existsSync(pipePath) ? JSON.parse(fs.readFileSync(pipePath, "utf8")) : [];
  const entry = {
    role, org,
    slug: path.basename(outDir),
    verdict: v.band,
    requirementCoverage: result.requirementCoverage ?? result.coverage,
    overallCoverage: result.coverage,
    thinRequirementsSection: thinReqs,
    cvKeywordCoverage: cov.pct,
    gapsInRequirements: result.gaps.filter((g) => g.inRequirements).map((g) => g.term),
    summaryDraftedBy: drafted,
    generated: new Date().toISOString(),
  };
  const i = pipeline.findIndex((p) => p.slug === entry.slug);
  if (i >= 0) pipeline[i] = { ...pipeline[i], ...entry };
  else pipeline.push({ ...entry, status: "drafted", submitted: null });
  fs.writeFileSync(pipePath, JSON.stringify(pipeline, null, 2) + "\n");

  console.log(`\n  CV carries ${cov.pct}% of the evidenced terms`);
  console.log(`  Summary drafted by: ${drafted}`);
  console.log(`  Headline: ${headline}`);
  console.log(`  → ${path.relative(process.cwd(), outDir)}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
