/**
 * Fit scoring — matches job-description keywords against the profile.
 *
 * The rule this file exists to enforce: a keyword only counts as covered if
 * something in profile.js actually evidences it. Nothing is inferred, and
 * nothing is written onto the CV that the profile cannot support.
 */

const { clean } = require("./keywords");

/**
 * Flatten the profile into searchable fragments that remember where they
 * came from, so every match can cite its own evidence.
 *
 * @returns {{text: string, source: string}[]}
 */
function corpus(profile) {
  const out = [];
  const push = (text, source) => {
    if (text && String(text).trim()) out.push({ text: String(text), source });
  };

  push(profile.summary, "Summary");
  (profile.keyStrengths || []).forEach((s) => push(s, "Key strengths"));
  (profile.highlights || []).forEach((h) => push(`${h.title}. ${h.detail}`, `Highlight — ${h.title}`));
  (profile.independentWork || []).forEach((w) => push(`${w.title}. ${w.detail}`, `Independent — ${w.title}`));
  (profile.appliedAI || []).forEach((a) => push(`${a.context}. ${a.detail}`, `Applied AI (${a.period})`));
  if (profile.designLeadership) {
    push(profile.designLeadership.summary, "Design leadership");
    (profile.designLeadership.practice || []).forEach((x) => push(x, "Design leadership — practice"));
  }
  // Portfolio entries only count as evidence once the craft field is written.
  (profile.portfolio || [])
    .filter((p) => p.craft && !/^TODO/i.test(p.craft))
    .forEach((p) => push(`${p.title}. ${p.problem} ${p.craft} ${p.outcome}`, `Portfolio — ${p.title}`));
  (profile.experience || []).forEach((e) => {
    push(`${e.role} ${e.company}`, `${e.company} — ${e.role}`);
    (e.highlights || []).forEach((h) => push(h, `${e.company} (${e.period})`));
  });
  (profile.education || []).forEach((e) => push(e, "Education"));
  (profile.awards || []).forEach((a) => push(a, "Awards"));
  (profile.speakingAndThoughtLeadership || []).forEach((s) => push(s, "Speaking"));
  (profile.linkedInPosts || []).forEach((p) => push(`${p.title || ""} ${p.summary} ${p.fullText || ""}`, `LinkedIn post ${p.date}`));

  return out.map((f) => ({ ...f, needle: clean(f.text) }));
}

/**
 * Score a set of extracted keywords against the profile.
 *
 * @param {object} profile
 * @param {{term: string, score: number, inRequirements: boolean}[]} keywords
 */
function score(profile, keywords) {
  const frags = corpus(profile);

  const matched = [];
  const gaps = [];

  for (const kw of keywords) {
    const needle = clean(kw.term);
    let evidence = frags.filter((f) => f.needle.includes(needle));

    // Fall back to an all-words match so "adoption strategy" still finds a
    // fragment that says "strategy for adoption".
    if (!evidence.length) {
      const words = needle.split(" ").filter((w) => w.length > 3);
      if (words.length > 1) {
        evidence = frags.filter((f) => words.every((w) => f.needle.includes(w)));
      }
    }

    if (evidence.length) {
      matched.push({
        ...kw,
        evidence: evidence.slice(0, 3).map((e) => ({ source: e.source, text: e.text })),
      });
    } else {
      gaps.push(kw);
    }
  }

  const weightOf = (list) => list.reduce((n, k) => n + k.score, 0);
  const total = weightOf(keywords) || 1;

  return {
    matched,
    gaps,
    // Weighted coverage: missing a term the posting repeats under
    // "What You Bring" costs far more than missing a passing mention.
    coverage: Math.round((weightOf(matched) / total) * 100),
    requirementCoverage: (() => {
      const req = keywords.filter((k) => k.inRequirements);
      if (!req.length) return null;
      const hit = matched.filter((k) => k.inRequirements);
      return Math.round((weightOf(hit) / (weightOf(req) || 1)) * 100);
    })(),
  };
}

/**
 * Verdict bands.
 *
 * Read this number for what it is: how much of the posting's own vocabulary
 * the profile can evidence. It predicts whether a keyword screen passes you
 * through — not whether you can do the job. A career's worth of the right
 * experience described in the wrong words scores badly here, and that is the
 * finding, not a flaw in the score.
 */
function verdict(result) {
  const c = result.requirementCoverage ?? result.coverage;
  if (c >= 75) return { band: "Strong", note: "The profile speaks this posting's language. Generate and send." };
  if (c >= 55) return { band: "Credible", note: "Passes a keyword screen. Use the letter to carry the terms the CV cannot." };
  if (c >= 35) return { band: "Vocabulary gap", note: "Likely screens out on wording, which is fixable. Check the gap list: if the experience is real but unnamed in profile.js, add it and re-run before deciding anything." };
  return { band: "Weak", note: "Either a genuine mismatch, or the profile is missing most of this domain. Read the gaps before writing it off." };
}

module.exports = { corpus, score, verdict };
