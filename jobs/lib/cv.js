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
  BorderStyle, LevelFormat, ExternalHyperlink, TabStopType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// Aptos throughout — Microsoft's Office default since 2023, so present on any
// current Office install, and gracefully substituted on older ones. Font
// choice does not affect ATS parsing at all; parsers read text and discard
// typeface. This is a legibility and impression decision, not a technical one.
//
// Greyscale by design. Nothing here is borrowed from the pris.la site: a CV
// is a different document with a different job, it may be printed, and a
// restrained neutral palette carries the hierarchy without a house style.
const DISPLAY = "Aptos";
const FONT = "Aptos";
const INK = "1A1A1A";
const NAVY = "111111";   // heading ink
const MUTED = "6B6B6B";
const RULE = "9A9A9A";   // the rule under the contact block
const HAIR = "D8D8D8";   // section underlines
// Width of the date rail, in twips. Wide enough for "Sep 2025 – Present".
const GUTTER = 1650;

/** Build the flat block model for a tailored CV. */
function blocks({ profile, headline, summary, groups, flatTerms, spotlight }) {
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
  } else if (flatTerms && flatTerms.length) {
    b.push({ t: "h2", text: "Core Competencies" });
    b.push({ t: "para", text: flatTerms.join("  ·  ") });
  }

  if (spotlight && spotlight.items.length) {
    b.push({ t: "h2", text: spotlight.title });
    if (spotlight.intro) b.push({ t: "para", text: spotlight.intro });
    for (const item of spotlight.items) b.push({ t: "bullet", text: item });
  }

  b.push({ t: "h2", text: "Professional Experience" });
  for (const e of profile.experience || []) {
    // Role leads, company sits under it: a reader scans for what you did
    // before where you did it, and the roles are the interesting part here.
    b.push({
      t: "entry",
      dates: e.period,
      role: e.role,
      company: `${e.company} — ${profile.location || "Singapore"}`,
    });
    for (const h of e.highlights || []) b.push({ t: "bullet", text: h, indent: true });
  }

  if ((profile.education || []).length || (profile.certifications || []).length) {
    b.push({ t: "h2", text: "Education and Certifications" });
    for (const e of profile.education || []) b.push({ t: "bullet", text: e });
    for (const c of profile.certifications || []) {
      const parts = [`${c.name} — ${c.issuer}`];
      if (c.issued) parts.push(`Issued ${c.issued}`);
      if (c.credentialId) parts.push(`Credential ID ${c.credentialId}`);
      b.push({ t: "bullet", text: parts.join("  ·  ") });
    }
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
        children.push(new Paragraph({ spacing: { after: 70 }, children: [run(blk.text, { size: 21, bold: true, color: INK })] }));
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
      case "entry":
        // The date rail is a tab stop with a hanging indent, not a table or a
        // text box. Extraction sees one continuous line — "Sep 2025 – Present
        // Director, Sustainability and Digital" — which every parser handles.
        children.push(new Paragraph({
          spacing: { before: 230, after: 0 },
          keepNext: true,
          indent: { left: GUTTER, hanging: GUTTER },
          tabStops: [{ type: TabStopType.LEFT, position: GUTTER }],
          children: [
            run(blk.dates, { color: MUTED, size: 18 }),
            run("\t"),
            run(blk.role.toUpperCase(), { bold: true, size: 20, color: NAVY, spacing: 16 }),
          ],
        }));
        children.push(new Paragraph({
          spacing: { before: 20, after: 80 },
          keepNext: true,
          indent: { left: GUTTER },
          children: [run(blk.company, { color: MUTED })],
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
          numbering: { reference: blk.indent ? "cv-bullets-rail" : "cv-bullets", level: 0 },
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
      config: [
        {
          reference: "cv-bullets",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
            run: { color: RULE, font: FONT },
            style: { paragraph: { indent: { left: 288, hanging: 180 } } },
          }],
        },
        {
          reference: "cv-bullets-rail",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
            run: { color: RULE, font: FONT },
            style: { paragraph: { indent: { left: GUTTER + 240, hanging: 180 } } },
          }],
        },
      ],
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
      case "entry":
        parts.push(
          `<div class="entry"><div class="when">${esc(blk.dates)}</div>` +
          `<div class="what"><p class="r">${esc(blk.role)}</p>` +
          `<p class="c">${esc(blk.company)}</p></div></div>`
        );
        break;
      case "labelled": parts.push(`<p class="labelled"><b>${esc(blk.label)}</b> ${esc(blk.text)}</p>`); break;
      case "bullet":
        if (!openList) { parts.push(`<ul class="b${blk.indent ? " rail" : ""}">`); openList = true; }
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
  --ink:#1a1a1a;
  --navy:#111111;   /* heading ink */
  --muted:#6b6b6b;
  --rule:#9a9a9a;   /* rule under the contact block */
  --hair:#d8d8d8;   /* section underlines */
}
@page{ size:A4; margin:13mm 15mm; }
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; background:#fff; }
body{
  font-family:'Aptos','Inter','Segoe UI',system-ui,-apple-system,Arial,sans-serif;
  color:var(--ink); font-size:9.6pt; line-height:1.46;
  -webkit-font-smoothing:antialiased;
}
h1{
  font-weight:700; font-size:24pt; line-height:1.05; letter-spacing:-.01em;
  color:var(--navy); margin:0 0 3pt;
}
.headline{
  font-size:10.5pt; font-weight:700; color:var(--ink);
  margin:0 0 5pt; letter-spacing:.005em;
}
.contact{
  font-size:8.6pt; color:var(--ink); margin:0 0 2pt;
}
.contact.last{ padding-bottom:7pt; border-bottom:1.2pt solid var(--rule); margin-bottom:0; }
h2{
  font-size:8.2pt; font-weight:700; text-transform:uppercase; letter-spacing:.16em;
  color:var(--navy); margin:15pt 0 6pt; padding-bottom:3pt;
  border-bottom:.75pt solid var(--hair);
  break-after:avoid; page-break-after:avoid;
}
p{ margin:0 0 5pt; }
/* Date rail. Visual only — the DOM order is dates, role, company, bullets,
   so extracted text still reads in the right sequence. */
.entry{
  display:flex; gap:0; margin:9pt 0 3pt;
  break-inside:avoid; page-break-inside:avoid;
  break-after:avoid; page-break-after:avoid;
}
.entry .when{
  flex:0 0 88pt; padding-right:8pt; padding-top:1pt;
  font-size:8pt; color:var(--muted);
  font-variant-numeric:tabular-nums;
}
.entry .what{ flex:1; min-width:0; }
.entry .r{
  margin:0; font-weight:700; font-size:9.6pt; color:var(--navy);
  text-transform:uppercase; letter-spacing:.055em;
}
.entry .c{ margin:1.5pt 0 0; color:var(--muted); }
.labelled b{ color:var(--navy); }
ul.b{ margin:0 0 5pt; padding:0; list-style:none; }
ul.b.rail{ padding-left:88pt; }
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
      case "entry":
        out.push("", `${blk.role.toUpperCase()}  |  ${blk.dates}`, blk.company);
        break;
      case "labelled": out.push(`${blk.label}: ${blk.text}`); break;
      case "bullet": out.push(`- ${blk.text}`); break;
      default: out.push(blk.text);
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

module.exports = { blocks, toDocx, toText, toHtml };
