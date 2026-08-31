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

const FONT = "Calibri";
const INK = "000000";
const MUTED = "333333";

/** Build the flat block model for a tailored CV. */
function blocks({ profile, headline, summary, groups, spotlight }) {
  const b = [];
  b.push({ t: "name", text: profile.name.toUpperCase() });
  if (headline) b.push({ t: "sub", text: headline });

  const contact = [profile.location, profile.email, "[Phone number]"].filter(Boolean);
  b.push({ t: "contact", text: contact.join("  |  ") });
  b.push({
    t: "contact",
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
const run = (text, o = {}) => new TextRun({ text, font: FONT, color: o.color || INK, size: o.size || 21, bold: o.bold, italics: o.italics, characterSpacing: o.spacing });

function toDocx(model, outPath) {
  const children = [];
  for (const blk of model) {
    switch (blk.t) {
      case "name":
        children.push(new Paragraph({ spacing: { after: 40 }, children: [run(blk.text, { bold: true, size: 34, spacing: 30 })] }));
        break;
      case "sub":
        children.push(new Paragraph({ spacing: { after: 40 }, children: [run(blk.text, { size: 22, color: MUTED })] }));
        break;
      case "contact":
        children.push(new Paragraph({
          spacing: { after: 30 },
          children: blk.link
            ? [new ExternalHyperlink({ link: blk.link, children: [run(blk.text, { size: 20 })] })]
            : [run(blk.text, { size: 20 })],
        }));
        break;
      case "h2":
        children.push(new Paragraph({
          spacing: { before: 260, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 2, color: INK } },
          children: [run(blk.text.toUpperCase(), { bold: true, size: 22, spacing: 20 })],
        }));
        break;
      case "company":
        children.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [run(blk.text, { bold: true, size: 22 })] }));
        break;
      case "role":
        children.push(new Paragraph({
          spacing: { before: 20, after: 60 },
          children: [run(blk.role, { italics: true }), run("  |  ", { color: MUTED }), run(blk.dates, { color: MUTED })],
        }));
        break;
      case "labelled":
        children.push(new Paragraph({
          spacing: { after: 90 },
          children: [run(blk.label + ": ", { bold: true }), run(blk.text)],
        }));
        break;
      case "bullet":
        children.push(new Paragraph({
          numbering: { reference: "cv-bullets", level: 0 },
          spacing: { after: 60 },
          children: [run(blk.text)],
        }));
        break;
      default:
        children.push(new Paragraph({ spacing: { after: 100 }, children: [run(blk.text)] }));
    }
  }

  const doc = new Document({
    creator: "Priscilla Liu",
    title: "Curriculum Vitae",
    numbering: {
      config: [{
        reference: "cv-bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
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

module.exports = { blocks, toDocx, toText };
