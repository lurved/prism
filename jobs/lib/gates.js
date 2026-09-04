/**
 * Hard gates — the binary requirements a coverage score cannot see.
 *
 * Coverage scoring is fuzzy by design: it asks how much of a posting's
 * vocabulary the profile can evidence, which predicts a keyword screen. It
 * says nothing about the requirements answered yes or no — "at least three
 * years implementing applied AI", "Bachelor's degree required" — and those
 * are usually enforced as application-form questions rather than by reading
 * the CV. No amount of rewriting argues past a checkbox.
 *
 * They are also what a recruiter screens on. A recruiter forwards the
 * candidate they can defend in one sentence; a stated requirement you are
 * marginally short of turns that sentence into a paragraph, which is a risk
 * they need not take. So these are reported separately from the percentage
 * and never folded into it — a posting can score 91% and still be gated.
 *
 * Two failure modes, not one. Short of the bar is the obvious one. Far above
 * it is the other: a role banded at "5+ years" is scoped for someone eight to
 * twelve years in, and fifteen years reads as flight risk and salary
 * mismatch. Both are flagged.
 */

const WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
};

// Words that describe seniority rather than a subject. A bar is "general" —
// answered by total professional experience — only once every one of these is
// removed and nothing substantive is left. "of relevant experience" is
// general; "experience implementing applied AI" is not, and reading it as
// general is the one mistake that would matter, because it turns a bar the
// candidate is short of into a bar she clears twice over.
const SUBJECT_STOP = new Set(
  `a an the and or of in on at to for with from by as is are be been experience
   experiences working work works role roles including such preferably ideally
   within across least over more than combined related relevant proven
   demonstrable hands-on strong solid track record professional professionally
   overall total career industry progressive equivalent similar minimum`
    .split(/\s+/)
    .filter(Boolean)
);

const YEAR_RE = new RegExp(
  // optional qualifier — "at least", "minimum of", "over"
  String.raw`(?:(at least|minimum(?:\s+of)?|min\.?|over|more than|no less than|upwards of)\s+)?` +
    // the number, as digits or a word
    String.raw`(\d{1,2}|${Object.keys(WORDS).join("|")})` +
    // "+", "or more", or a range whose lower bound is the gate that bites
    String.raw`\s*(?:\+|\s*or\s+more|\s*(?:to|through|[-–—])\s*\d{1,2})?\s*` +
    String.raw`years?` +
    // the subject the years are counted in
    String.raw`(?:['’]?\s*(?:of|in|with|as))?\s*([^.;:!?\n()]{0,90})`,
  "gi"
);

// "Master's degree in X" is a gate; "the team that masters supporting the
// platform" is prose. Require the qualification to be named as one — the word
// degree or diploma nearby, or an abbreviation that can only be a degree.
const DEGREE_RE = /\b(bachelor'?s?|master'?s?|mba|ph\.?\s?d\.?|doctorate|degree)\b[^.;\n]{0,90}/gi;
const DEGREE_CONFIRM = /\b(degree|diploma|mba|ph\.?\s?d|doctorate|graduate|qualification)\b/i;

const MUST_RE = /^[^.\n]*\b(must have|must be|is required|are required|is essential|are essential|mandatory|non-negotiable|you must)\b[^.\n]*/gim;

const toNumber = (tok) => (/^\d+$/.test(tok) ? parseInt(tok, 10) : WORDS[tok.toLowerCase()]);

const contentWords = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !SUBJECT_STOP.has(w));

/** Every 4-digit year in a period string, e.g. "2024 – present" or "2017 - 2022". */
function yearsIn(period) {
  return (String(period || "").match(/\b(19|20)\d{2}\b/g) || []).map(Number);
}

/**
 * The span a set of dated profile entries covers, in years.
 * An entry with no end year ("2025 – present") runs to today.
 */
function spanOf(entries, now) {
  const starts = [];
  let end = null;
  for (const e of entries) {
    const ys = yearsIn(e.period);
    if (!ys.length) continue;
    starts.push(Math.min(...ys));
    const openEnded = /present|current|now|ongoing/i.test(e.period);
    end = Math.max(end ?? 0, openEnded ? now : Math.max(...ys));
  }
  if (!starts.length) return null;
  return { from: Math.min(...starts), to: end ?? now, years: (end ?? now) - Math.min(...starts) };
}

/** Total professional experience, from the earliest dated role to today. */
function careerYears(profile, now) {
  const span = spanOf(profile.experience || [], now);
  return span ? span.years : null;
}

/**
 * Pull the binary requirements out of a posting.
 *
 * @param {string} jd
 * @returns {{years: object[], degrees: object[], musts: string[]}}
 */
function detect(jd) {
  const years = [];
  const seen = new Set();
  for (const m of jd.matchAll(YEAR_RE)) {
    const n = toNumber(m[2]);
    if (!n || n > 40) continue;
    const subject = (m[3] || "").trim().replace(/\s+/g, " ");
    const key = `${n}|${subject.toLowerCase().slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    years.push({
      required: n,
      qualifier: (m[1] || "").trim().toLowerCase() || null,
      subject,
      general: contentWords(subject).length === 0,
      raw: m[0].trim().replace(/\s+/g, " "),
    });
  }

  const degrees = [];
  const seenDeg = new Set();
  for (const m of jd.matchAll(DEGREE_RE)) {
    const raw = m[0].trim().replace(/\s+/g, " ");
    if (!DEGREE_CONFIRM.test(raw)) continue;
    const kind = /ph\.?\s?d|doctorate/i.test(m[1]) ? "doctorate"
      : /master|mba/i.test(m[1]) ? "masters"
      : /bachelor/i.test(m[1]) ? "bachelors"
      : "degree";
    if (seenDeg.has(kind)) continue;
    seenDeg.add(kind);
    degrees.push({ kind, raw });
  }

  const musts = [...new Set([...jd.matchAll(MUST_RE)].map((m) => m[0].trim().replace(/\s+/g, " ")))]
    .filter((s) => s.length > 12)
    .slice(0, 6);

  return { years, degrees, musts };
}

/**
 * Judge each gate against the profile.
 *
 * Deliberately conservative. Where a bar is phrased against a speciality
 * rather than a career, the years are counted from dated profile entries that
 * mention the same subject, and the matching entries are reported so the
 * inference can be checked. Where nothing dated matches, the gate is returned
 * as `judgment` rather than guessed at — a wrong "clear" here is the one
 * output that would actually cost an application.
 */
function evaluate(profile, gates, opts = {}) {
  const now = opts.now || new Date().getFullYear();
  const total = careerYears(profile, now);

  const dated = [
    ...(profile.appliedAI || []).map((a) => ({ period: a.period, text: `${a.context} ${a.detail}`, source: `Applied AI (${a.period})` })),
    ...(profile.experience || []).map((e) => ({
      period: e.period,
      text: `${e.role} ${e.company} ${(e.highlights || []).join(" ")}`,
      source: `${e.company} — ${e.role}`,
    })),
  ];

  // One verdict rule, whichever way the years were counted. Being far above a
  // low bar is its own failure: a role scoped at "5+ years" is written for
  // someone eight to twelve years in, and screens out double that as
  // over-qualified — flight risk and salary mismatch, decided in seconds.
  const judge = (required, have) => {
    if (have == null) return "judgment";
    if (have < required) return "short";
    if (required <= 7 && have >= required * 2.2) return "banded-low";
    return "clear";
  };

  const years = gates.years.map((g) => {
    if (g.general) {
      if (total == null) return { ...g, verdict: "judgment", note: "No dated roles in the profile to count against." };
      const verdict = judge(g.required, total);
      return {
        ...g,
        have: total,
        verdict,
        note: verdict === "banded-low"
          ? `${total} years against a ${g.required}-year bar — the role is scoped well below you.`
          : `${total} years of professional experience against a ${g.required}-year bar.`,
      };
    }

    // Speciality bar — deliberately NOT adjudicated.
    //
    // Counting "ten years of programme management" out of a profile means
    // deciding which past roles count, and word overlap cannot do it. Matching
    // loosely let the applied AI entries satisfy a UX design bar; matching
    // tightly scored a fifteen-year career as three years, because the older
    // roles describe the same work in different words. Both readings were
    // confident and wrong, in opposite directions.
    //
    // So: surface the bar, show the dated entries that look related, and let
    // a person decide. A gate this tool cannot judge is worth naming; it is
    // not worth guessing, because a wrong verdict here is acted on.
    const want = contentWords(g.subject);
    if (!want.length) return { ...g, verdict: "judgment", note: "Could not read what the years are counted in." };
    const res = want.map((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:s|es)?\\b`, "i"));
    const related = dated
      .map((d) => ({ ...d, overlap: res.filter((r) => r.test(d.text)).length }))
      .filter((d) => d.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || (yearsIn(a.period)[0] || 0) - (yearsIn(b.period)[0] || 0))
      .slice(0, 4);

    const earliest = related.length ? Math.min(...related.flatMap((r) => yearsIn(r.period))) : null;
    // Banding is measured against the related evidence, not the whole career.
    // Comparing a speciality bar to total years reads "three years of applied
    // AI" against eighteen years of working and calls it over-qualified — the
    // exact inversion of the truth, on the one gate that matters most here.
    const relatedYears = earliest == null ? null : now - earliest;
    const banded = relatedYears != null && g.required <= 7 && relatedYears >= g.required * 2.2;
    return {
      ...g,
      verdict: "judgment",
      banded,
      careerYears: total,
      earliest,
      sources: related.map((r) => `${r.source} (${r.period}, ${r.overlap}/${want.length} terms)`),
      note: related.length
        ? `Not machine-decidable. ${total} years total; the earliest related dated entry starts ${earliest}. Decide yourself which of these count — that decision is usually worth more than any rewording.`
        : `Nothing dated in the profile obviously matches "${g.subject}". Either it is a real gap, or the work is there under different words.`,
    };
  });

  const edu = (profile.education || []).join(" ");
  const held = {
    bachelors: /\bb\.?\s?(a|sc|eng|com)\b|bachelor/i.test(edu),
    masters: /\bm\.?\s?(a|sc|eng|ba)\b|master|mba/i.test(edu),
    doctorate: /ph\.?\s?d|doctorate/i.test(edu),
  };
  const degrees = gates.degrees.map((d) => ({
    ...d,
    verdict: d.kind === "degree" ? (held.bachelors || held.masters ? "clear" : "judgment")
      : held[d.kind] ? "clear"
      : held.masters && d.kind === "bachelors" ? "clear"
      : "short",
    evidence: (profile.education || []).join("; ") || null,
  }));

  const blocking = [...years, ...degrees].filter(
    (g) => g.verdict === "short" || g.verdict === "banded-low" || g.banded
  );

  return { years, degrees, musts: gates.musts, careerYears: total, blocking };
}

/** One-line-per-gate report, for the console and the fit report. */
function lines(evaluated) {
  const MARK = { clear: "ok  ", short: "GATE", "banded-low": "BAND", judgment: "?   " };
  const L = [];
  for (const g of evaluated.years) {
    L.push(`${g.banded ? "BAND" : MARK[g.verdict]} ${g.required}+ years${g.subject ? ` — ${g.subject}` : ""}`);
    L.push(`       ${g.note}`);
    if (g.banded) L.push(`       Bar set at ${g.required} against related work running since ${g.earliest} — scoped below you, expect an over-qualification screen-out.`);
    for (const s of g.sources || []) L.push(`       related: ${s}`);
  }
  for (const d of evaluated.degrees) {
    L.push(`${MARK[d.verdict]} ${d.raw}`);
    if (d.evidence) L.push(`       profile holds: ${d.evidence}`);
  }
  return L;
}

module.exports = { detect, evaluate, lines, careerYears, spanOf };
