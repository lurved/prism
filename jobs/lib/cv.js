/**
 * ATS-safe CV generation.
 *
 * The document is assembled once as a flat block list, then rendered to both
 * .docx (for upload) and .txt (for forms with a paste box). Keeping one model
 * means the two files can never drift apart.
 *
 * ATS constraints held deliberately: single column, no tables, no text boxes,
 * no headers or footers, no images or icons, one common font, standard
 * section headings, reverse-chronological experience.
 *
 * Emphasis is tunable; facts are not. Summary and competency blocks are
 * selected per posting, but every experience bullet comes verbatim from
 * profile.js, so the tool cannot invent a claim to fit a job description.
 */

const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  BorderStyle, LevelFormat, ExternalHyperlink,
} = require("docx");
const fs = require("fs");
const path = require("path");

// The .docx uses Georgia and Calibri rather than the pris.la webfaces:
// an unavailable font is silently substituted by Word, and an unpredictable
// substitution is a functional defect. Georgia carries the same warm serif
// role as Newsreader and is present on effectively every machine.
// Colour is the part of the system that survives intact — ATS parsers strip
// it, so it costs nothing and is the whole visual signature.
const DISPLAY = "Georgia";
const FONT = "Calibri";
const INK = "1A1C2E";    // navy-biased near-black
const NAVY = "262A4F";   // pris.la navy-700
const MUTED = "5A5F7D";
const RULE = "F0A8B8";   // pris.la pink — rules only, never type
const HAIR = "DCDAE6";

/** Build the flat block model for a tailored CV. */
function blocks({ profile, headline, summary, groups, spotlight }) {
  const b = [];
  b.push({ t: "name", text: profile.name.toUpperCase() });
  if (headline) b.push({ t: "sub", text: headline });

  // CV_PHONE lets a machine override the committed number without editing
  // the profile; the placeholder makes a missing one visible rather than
  // silently shipping a CV with no way to call the candidate.
  const phone = process.env.CV_PHONE || profile.phone || "[Phone number]";
  const contact = [profile.location, profile.email, phone].filter(Boolean);
  b.push({ t: "contact", text: contact.join("  |  ") });
  b.push({
    t: "contact",
    last: true,
    text: `LinkedIn: ${(profile.linkedin || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}  |  Portfolio: pris.la`,
    link: profile.linkedin,
  });

  b.push({ t: "h2", text: "Professional Summary" });
  b.push({ t: "para", text: summary });

  if (groups && groups.length) {
    b.push({ t: "h2", text: "Core Competencies" });
    for (const g of groups) b.push({ t: "labelled", label: g.name, text: g.terms.join(", ") });
  }

  if (spotlight && spotlight.items.length) {
    b.push({ t: "h2", text: spotlight.title });
    if (spotlight.intro) b.push({ t: "para", text: spotlight.intro });
    for (const item of spotlight.items) b.push({ t: "bullet", text: item });
  }

  b.push({ t: "h2", text: "Professional Experience" });
  for (const e of profile.experience || []) {
    b.push({ t: "company", text: `${e.company.toUpperCase()} — ${profile.location || "Singapore"}` });
    b.push({ t: "role", role: e.role, dates: e.period });
    for (const h of e.highlights || []) b.push({ t: "bullet", text: h });
  }

  if ((profile.education || []).length) {
    b.push({ t: "h2", text: "Education and Certifications" });
    for (const e of profile.education) b.push({ t: "bullet", text: e });
  }
  if ((profile.awards || []).length) {
    b.push({ t: "h2", text: "Awards and Recognition" });
    for (const a of profile.awards) b.push({ t: "bullet", text: a });
  }
  if ((profile.speakingAndThoughtLeadership || []).length) {
    b.push({ t: "h2", text: "Speaking and Thought Leadership" });
    for (const s of profile.speakingAndThoughtLeadership) b.push({ t: "bullet", text: s });
  }
  return b;
}

// ── renderers ──────────────────────────────────────────────────────────
const run = (text, o = {}) => new TextRun({ text, font: o.font || FONT, color: o.color || INK, size: o.size || 21, bold: o.bold, italics: o.italics, characterSpacing: o.spacing });

function toDocx(model, outPath) {
  const children = [];
  // The contact block is closed with a pink rule; blk.last marks the line
  // that carries it.
  model.forEach((blk) => {
    switch (blk.t) {
      case "name":
        children.push(new Paragraph({ spacing: { after: 50 }, children: [run(blk.text, { font: DISPLAY, size: 40, color: NAVY, spacing: 12 })] }));
        break;
      case "sub":
        children.push(new Paragraph({ spacing: { after: 70 }, children: [run(blk.text, { size: 21, color: MUTED })] }));
        break;
      case "contact":
        children.push(new Paragraph({
          spacing: { after: blk.last ? 200 : 30 },
          border: blk.last
            ? { bottom: { style: BorderStyle.SINGLE, size: 10, space: 6, color: RULE } }
            : undefined,
          children: blk.link
            ? [new ExternalHyperlink({ link: blk.link, children: [run(blk.text, { size: 19 })] })]
            : [run(blk.text, { size: 19 })],
        }));
        break;
      case "h2":
        children.push(new Paragraph({
          spacing: { before: 300, after: 130 },
          keepNext: true,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 3, color: HAIR } },
          children: [run(blk.text.toUpperCase(), { bold: true, size: 17, color: NAVY, spacing: 34 })],
        }));
        break;
      case "company":
        children.push(new Paragraph({ spacing: { before: 210, after: 0 }, keepNext: true, children: [run(blk.text, { bold: true, size: 21, color: NAVY })] }));
        break;
      case "role":
        children.push(new Paragraph({
          spacing: { before: 20, after: 70 },
          keepNext: true,
          children: [run(blk.role, { italics: true }), run("  ·  ", { color: MUTED }), run(blk.dates, { color: MUTED })],
        }));
        break;
      case "labelled":
        children.push(new Paragraph({
          spacing: { after: 95 },
          children: [run(blk.label + ": ", { bold: true, color: NAVY }), run(blk.text)],
        }));
        break;
      case "bullet":
        children.push(new Paragraph({
          numbering: { reference: "cv-bullets", level: 0 },
          spacing: { after: 65 },
          children: [run(blk.text)],
        }));
        break;
      default:
        children.push(new Paragraph({ spacing: { after: 100 }, children: [run(blk.text)] }));
    }
  });

  const doc = new Document({
    creator: "Priscilla Liu",
    title: "Curriculum Vitae",
    numbering: {
      config: [{
        reference: "cv-bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
          run: { color: RULE, font: FONT },
          style: { paragraph: { indent: { left: 288, hanging: 180 } } },
        }],
      }],
    },
    styles: { default: { document: { run: { font: FONT, size: 21, color: INK } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, right: 900, bottom: 720, left: 900 } } },
      children,
    }],
  });

  return Packer.toBuffer(doc).then((buf) => {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buf);
  });
}

/**
 * Print renderer — the pris.la system adapted for paper.
 *
 * The site is light type on navy; a CV cannot be. Navy becomes the ink and
 * the heading colour, the pink survives as hairline rules only (at 12px on
 * white it fails contrast as text, so it is never used for one), and the
 * ground goes white because a recruiter may print this.
 *
 * Structurally identical to the .docx: one column, real text, standard
 * headings, no tables or boxes. A PDF printed from this parses like the
 * .docx does — the design lives in colour and type, which parsers discard
 * anyway, rather than in layout, which is what actually breaks them.
 */
function toHtml(model, { fontCss = "" } = {}) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const parts = [];
  let openList = false;

  const closeList = () => { if (openList) { parts.push("</ul>"); openList = false; } };

  for (const blk of model) {
    if (blk.t !== "bullet") closeList();
    switch (blk.t) {
      case "name": parts.push(`<h1>${esc(blk.text)}</h1>`); break;
      case "sub": parts.push(`<p class="headline">${esc(blk.text)}</p>`); break;
      case "contact": parts.push(`<p class="contact${blk.last ? " last" : ""}">${esc(blk.text)}</p>`); break;
      case "h2": parts.push(`<h2>${esc(blk.text)}</h2>`); break;
      case "company": parts.push(`<p class="company">${esc(blk.text)}</p>`); break;
      case "role": parts.push(`<p class="role"><span class="rt">${esc(blk.role)}</span><span class="rd">${esc(blk.dates)}</span></p>`); break;
      case "labelled": parts.push(`<p class="labelled"><b>${esc(blk.label)}</b> ${esc(blk.text)}</p>`); break;
      case "bullet":
        if (!openList) { parts.push('<ul class="b">'); openList = true; }
        parts.push(`<li>${esc(blk.text)}</li>`);
        break;
      default: parts.push(`<p>${esc(blk.text)}</p>`);
    }
  }
  closeList();

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>CV</title>
<style>
${fontCss}
:root{
  --ink:#1a1c2e;        /* navy-biased near-black, not a default grey */
  --navy:#262a4f;       /* pris.la navy-700 — headings and name */
  --muted:#5a5f7d;      /* navy-biased secondary */
  --rule:#f0a8b8;       /* pris.la pink — decorative rules only, never type */
  --hair:#dcdae6;
}
@page{ size:A4; margin:13mm 15mm; }
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; background:#fff; }
body{
  font-family:'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;
  color:var(--ink); font-size:9.6pt; line-height:1.46;
  -webkit-font-smoothing:antialiased;
}
h1{
  font-family:'Newsreader',Georgia,serif; font-weight:400;
  font-size:27pt; line-height:1.02; letter-spacing:-.015em;
  color:var(--navy); margin:0 0 3pt;
}
.headline{
  font-size:10.5pt; color:var(--muted); margin:0 0 5pt; letter-spacing:.005em;
}
.contact{
  font-family:'Space Mono',ui-monospace,'Courier New',monospace;
  font-size:7.8pt; color:var(--ink); margin:0 0 2pt; letter-spacing:.01em;
}
.contact.last{ padding-bottom:7pt; border-bottom:1.2pt solid var(--rule); margin-bottom:0; }
h2{
  font-family:'Space Mono',ui-monospace,'Courier New',monospace;
  font-size:8pt; font-weight:700; text-transform:uppercase; letter-spacing:.15em;
  color:var(--navy); margin:15pt 0 6pt; padding-bottom:3pt;
  border-bottom:.75pt solid var(--hair);
  break-after:avoid; page-break-after:avoid;
}
p{ margin:0 0 5pt; }
.company{
  font-weight:700; font-size:10pt; color:var(--navy);
  margin:9pt 0 0; letter-spacing:.005em;
  break-after:avoid; page-break-after:avoid;
}
.role{
  display:flex; justify-content:space-between; gap:12pt;
  margin:1pt 0 4pt; break-after:avoid; page-break-after:avoid;
}
.rt{ font-style:italic; color:var(--ink); }
.rd{ color:var(--muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
.labelled b{ color:var(--navy); }
ul.b{ margin:0 0 5pt; padding:0; list-style:none; }
ul.b li{
  position:relative; padding-left:11pt; margin-bottom:3.2pt;
  break-inside:avoid; page-break-inside:avoid;
}
ul.b li::before{
  content:""; position:absolute; left:2pt; top:5.2pt;
  width:3.6pt; height:1.1pt; background:var(--rule);
}
</style></head><body>
${parts.join("\n")}
</body></html>`;
}

function toText(model) {
  const out = [];
  for (const blk of model) {
    switch (blk.t) {
      case "h2": out.push("", blk.text.toUpperCase(), "-".repeat(blk.text.length)); break;
      case "role": out.push(`${blk.role}  |  ${blk.dates}`); break;
      case "labelled": out.push(`${blk.label}: ${blk.text}`); break;
      case "bullet": out.push(`- ${blk.text}`); break;
      case "company": out.push("", blk.text); break;
      default: out.push(blk.text);
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

module.exports = { blocks, toDocx, toText, toHtml };
