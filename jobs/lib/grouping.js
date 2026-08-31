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

const SMALL = new Set(["and", "or", "of", "for", "the", "in", "on", "to", "with", "a", "an"]);

function titleCase(term) {
  return term
    .split(" ")
    .map((w, i) => {
      const bare = w.replace(/[^a-z0-9+#]/gi, "");
      if (ACRONYMS.has(bare.toLowerCase())) return w.toUpperCase();
      if (i > 0 && SMALL.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
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
    const label = titleCase(kw.term);
    if (!target.terms.includes(label)) {
      target.terms.push(label);
      target.weight += kw.score;
    }
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
