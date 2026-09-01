/**
 * Groups matched keywords into the themed blocks that become the CV's
 * "Core Competencies" section, and picks the theme the posting leans on
 * hardest so the CV can lead with a matching spotlight section.
 */

const BUCKETS = [
  ["Programme and Portfolio Delivery",
    /programme|program|portfolio|milestone|governance|raid|dependenc|\brisk\b|\bissue|deliver|roadmap|prioriti|escalat|transformation|benefit|value track|operating model|pmo/],
  ["AI and Technology",
    /\bai\b|artificial intelligence|genai|generative|\bllm|agentic|automation|machine learning|responsible ai|platform|technical|engineering|agile|scrum|technology|workflow/],
  ["Adoption, Change and Capability",
    /adoption|\bchange\b|capability|training|enable|playbook|champion|onboard|communicat|readiness|behaviour|behavior|culture|\btrust\b/],
  ["Design, Product and Research",
    /design|\bux\b|user experience|research|interaction|information architecture|usability|prototyp|\bvisual|product manage|discovery|journey/],
  ["Leadership and Stakeholder Management",
    /leader|coach|mentor|\bteam|stakeholder|executive|senior|board|c-level|influence|partner|matrix|succession|hiring|cross-functional|facilitat/],
  ["Measurement and Analytics",
    /metric|\bkpi|analytic|measure|experiment|data|insight|segment|report|productivity|proficien|feedback|outcome/],
];

const ACRONYMS = new Set([
  "ai", "ux", "ui", "kpi", "raid", "okr", "llm", "hr", "it", "esg", "pmo", "b2b",
  "b2c", "b2e", "crm", "erp", "saas", "api", "genai", "cx", "roi", "mvp", "npat",
]);

// Single words that carry no meaning as a listed competency. Multi-word
// phrases containing them are unaffected.
const DISPLAY_STOP = new Set([
  "use", "user", "users", "actions", "decisions", "skills", "knowledge",
  "experience", "initiatives", "plans", "priorities", "practices", "blockers",
  "capacity", "sustained", "sequenced", "technical", "programmes", "work",
  "outcomes", "members", "coach", "lead", "usage",
]);

const SMALL = new Set(["and", "or", "of", "for", "the", "in", "on", "to", "with", "a", "an"]);

const capPart = (w) =>
  ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1);

function titleCase(term) {
  return term
    .split(" ")
    .map((w, i) => {
      if (i > 0 && SMALL.has(w)) return w;
      // Hyphenated compounds cap each side, so "ai-enabled" becomes
      // "AI-Enabled" rather than "Ai-enabled".
      if (w.includes("-")) return w.split("-").map(capPart).join("-");
      return capPart(w);
    })
    .join(" ");
}

/**
 * @param {{term: string, score: number}[]} matched  keywords with profile evidence
 * @returns {{groups: {name: string, terms: string[], weight: number}[], leadTheme: string}}
 */
function group(matched) {
  const buckets = new Map(BUCKETS.map(([name]) => [name, { name, terms: [], weight: 0 }]));
  const extra = { name: "Additional", terms: [], weight: 0 };

  for (const kw of matched) {
    const hit = BUCKETS.find(([, re]) => re.test(kw.term));
    const target = hit ? buckets.get(hit[0]) : extra;
    if (!target.terms.some((t) => t.term === kw.term)) {
      target.terms.push({ term: kw.term, label: titleCase(kw.term), score: kw.score });
      target.weight += kw.score;
    }
  }

  // A competencies list is read by a person as well as scanned by a machine,
  // and unfiltered keyword output reads as stuffing: "Adoption, Change and
  // Capability: Adoption, Change, Capability" repeats its own heading, and
  // "Applied AI" beside "Applied AI Technology" is the same term twice.
  for (const g of [...buckets.values(), extra]) {
    const labelWords = new Set(g.name.toLowerCase().split(/[^a-z]+/).filter(Boolean));
    const kept = g.terms
      // Never repeat the block's own heading back at the reader.
      .filter((t) => !(t.term.split(" ").length === 1 && labelWords.has(t.term)))
      // Bare words that are not the name of a competency.
      .filter((t) => !(t.term.split(" ").length === 1 && DISPLAY_STOP.has(t.term)))
      // Keep the specific term, drop the one it contains: "Executive
      // Communication" says everything "Communication" does.
      .filter((t, _i, arr) => !arr.some((o) => o !== t && o.term.includes(t.term)))
      // Specific before generic. Sorting by frequency alone puts the vaguest
      // term first, which is exactly backwards for a human reading the line.
      .sort((a, b) => b.term.split(" ").length - a.term.split(" ").length || b.score - a.score)
      .slice(0, 8);
    g.terms = kept.map((t) => t.label);
  }

  // "Additional" is by definition the terms that fit no theme — generic words
  // like "experience" or "initiatives". They belong in the report, never in a
  // competencies block, where they read as padding.
  const groups = [...buckets.values()]
    .filter((g) => g.terms.length >= 2)
    .sort((a, b) => b.weight - a.weight);

  return { groups, unclassified: extra.terms, leadTheme: groups.length ? groups[0].name : null };
}

module.exports = { group, titleCase, BUCKETS };
