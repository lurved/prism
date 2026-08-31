/**
 * Tailoring — chooses what the CV leads with, and drafts the cover note.
 *
 * When ANTHROPIC_API_KEY is set the summary and letter are drafted by Claude
 * under a hard grounding rule: only facts present in profile.js may be used.
 * Without a key the tool still works, falling back to the profile's own
 * summary and a structured template. Either way the experience bullets are
 * untouched, so nothing here can fabricate a claim.
 */

const { BUCKETS } = require("./grouping");

const MODEL = process.env.JOBS_MODEL || "claude-opus-5";

const SPOTLIGHT_TITLES = {
  "AI and Technology": "Applied AI Experience",
  "Programme and Portfolio Delivery": "Selected Programme and Transformation Achievements",
  "Design, Product and Research": "Selected Product and Design Achievements",
  "Adoption, Change and Capability": "Selected Adoption and Change Achievements",
  "Leadership and Stakeholder Management": "Selected Leadership Achievements",
  "Measurement and Analytics": "Selected Analytics and Measurement Achievements",
};

/**
 * Pick the profile highlights that speak to the theme the posting leans on,
 * so the strongest evidence sits above the fold rather than buried in a role.
 */
function spotlightFor(profile, leadTheme) {
  if (!leadTheme) return null;
  const bucket = BUCKETS.find(([name]) => name === leadTheme);
  if (!bucket) return null;
  const re = bucket[1];

  const pool = [
    ...(profile.highlights || []).map((h) => ({ title: h.title, detail: h.detail })),
    ...(profile.independentWork || []).map((w) => ({ title: w.title, detail: w.detail })),
  ];

  const items = pool
    .filter((p) => re.test(`${p.title} ${p.detail}`.toLowerCase()))
    .slice(0, 5)
    .map((p) => `${p.title}: ${p.detail}`);

  if (items.length < 2) return null;
  return { title: SPOTLIGHT_TITLES[leadTheme] || "Selected Achievements", intro: null, items };
}

const HEADLINES = {
  "AI and Technology": "AI, Product and Technology Leader",
  "Programme and Portfolio Delivery": "Transformation, Programme and Delivery Leader",
  "Design, Product and Research": "Product and Design Leader",
  "Adoption, Change and Capability": "Transformation, Adoption and Change Leader",
  "Leadership and Stakeholder Management": "Product and Experience Leader",
  "Measurement and Analytics": "Product, Data and Insight Leader",
};

/** Headline for the posting's dominant theme, falling back to the profile's own. */
function headlineFor(profile, leadTheme) {
  return HEADLINES[leadTheme] || (profile.title || "").split("|").pop().trim() || null;
}

/**
 * profile.js is written in the third person for the site agent. A CV is not:
 * strip the name and the pronouns so the summary reads in CV voice, whichever
 * pronouns the profile happens to use.
 */
function depersonalise(text, name) {
  const first = (name || "").split(" ")[0];
  return String(text)
    .trim()
    .replace(/\s+/g, " ")
    .split(/(?<=\.)\s+/)
    .map((s) => {
      let t = s
        .replace(new RegExp(`^${name}\\s+(is|has|was)\\s+`, "i"), "")
        .replace(new RegExp(`^${first}\\s+(is|has|was)\\s+`, "i"), "")
        .replace(/^(She|He|They)\s+/i, "")
        .replace(/^(Her|His|Their)\s+/i, "");
      return t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join(" ");
}

function client() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    return new Anthropic();
  } catch {
    return null;
  }
}

const profileFacts = (profile) =>
  JSON.stringify(
    {
      summary: profile.summary,
      keyStrengths: profile.keyStrengths,
      highlights: profile.highlights,
      independentWork: profile.independentWork,
      experience: profile.experience,
      education: profile.education,
      awards: profile.awards,
    },
    null,
    1
  );

const GROUNDING = `Rules you must not break:
- Use ONLY facts that appear in the PROFILE block. Never invent an employer, date, metric, title, tool or claim.
- If the posting asks for something the profile does not evidence, leave it out. Do not imply it.
- Use British/Singapore spelling (programme, organisation, prioritise).
- Plain prose. No markdown headings, no bullet characters, no em-dash-heavy style.`;

async function summaryFor({ profile, jd, groups, fitResult }) {
  const api = client();
  const themes = groups.slice(0, 3).map((g) => g.name).join(", ");
  const fallback = `${depersonalise(profile.summary, profile.name)} Core focus for this role: ${themes}.`;
  if (!api) return { text: fallback, drafted: "template" };

  const msg = await api.messages.create({
    model: MODEL,
    max_tokens: 700,
    system: `You write ATS-optimised CV summaries. ${GROUNDING}`,
    messages: [{
      role: "user",
      content: `PROFILE:\n${profileFacts(profile)}\n\nJOB POSTING:\n${jd.slice(0, 6000)}\n\nKeywords this posting weights that the profile evidences: ${fitResult.matched.slice(0, 25).map((m) => m.term).join(", ")}\n\nWrite a Professional Summary of 4 to 5 sentences for this posting. Lead with the single requirement the posting screens hardest on. Work in the matched keywords naturally — an ATS reads frequency and context. Quantify with metrics from the profile. Output the paragraph only.`,
    }],
  });
  const text = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
  return { text: text || fallback, drafted: text ? MODEL : "template" };
}

async function letterFor({ profile, jd, role, org, fitResult }) {
  const api = client();
  const gaps = fitResult.gaps.slice(0, 8).map((g) => g.term).join(", ");
  if (!api) {
    return [
      `# Cover note — ${role}${org ? `, ${org}` : ""}`,
      "",
      "_Template draft. Set ANTHROPIC_API_KEY for a tailored draft._",
      "",
      "Dear [hiring manager],",
      "",
      `I'm writing about the ${role} role.`,
      "",
      depersonalise(profile.summary, profile.name),
      "",
      "**Strongest evidence for this posting:**",
      "",
      ...fitResult.matched.slice(0, 5).map((m) => `- ${m.term} — ${m.evidence[0].source}: ${m.evidence[0].text}`),
      "",
      `**Gaps to address directly:** ${gaps || "none identified"}`,
      "",
      "I'd welcome the chance to talk.",
      "",
      profile.name,
      "",
    ].join("\n");
  }

  const msg = await api.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: `You write cover letters for senior candidates. ${GROUNDING}
- 350 to 450 words. Direct, specific, no throat-clearing and no flattery of the company.
- Structure: the requirement they screen hardest on, then scale evidence, then the differentiating detail, then fit for context.
- Never claim to be excited or passionate. Show the evidence and let it carry.`,
    messages: [{
      role: "user",
      content: `PROFILE:\n${profileFacts(profile)}\n\nJOB POSTING:\n${jd.slice(0, 8000)}\n\nRequirements the profile does NOT evidence (do not claim these; either ignore them or address one honestly): ${gaps || "none"}\n\nWrite the cover letter body for the ${role} role${org ? ` at ${org}` : ""}. Start with "Dear [hiring manager]," and end with the candidate's name. Output the letter only.`,
    }],
  });
  const text = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
  return `# Cover note — ${role}${org ? `, ${org}` : ""}\n\n_Drafted with ${MODEL}. Verify every claim before sending._\n\n${text}\n`;
}

module.exports = { spotlightFor, summaryFor, letterFor, headlineFor, depersonalise, MODEL };
