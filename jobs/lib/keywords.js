/**
 * Keyword extraction for a job description.
 *
 * Deterministic — no API calls, no network. Produces the term list an
 * applicant tracking system is most likely to weight, ranked by frequency
 * and by whether the term appears in the requirements half of the posting.
 */

const STOP = new Set(`a an the and or but if then than that this these those of in on at to for with
from by as is are was were be been being will would shall should can could may might must do does did
you your yours we our ours they their them it its his her hers he she who whom which what when where
how why all any both each few more most other some such no nor not only own same so too very s t just
don now across into through during before after above below up down out off over under again further
role roles job jobs work working works new also well including include includes
about have has had within while per e g etc via ability able ensure ensuring
strong proven relevant complex timely clear various key core best good high low real
excellent solid deep meaningful significant genuine right whether across broad wide
least years year plus multiple several many every` .split(/\s+/).filter(Boolean));

// Headings that mark the start of the requirements half of a posting.
const REQ_HEADING = /^(what you bring|what we.{0,3}re looking for|who we.{0,3}re looking for|require(d|ments?)|qualifications?|competenc(y|ies)|about you|you (have|will need|.{0,3}ll need)|skills|experience required|minimum|preferred|essential|desired)\b/i;

const clean = (s) =>
  s.toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9+#/\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isStop = (w) => STOP.has(w) || w.length < 2 || /^\d+$/.test(w);

/**
 * Split the posting into lines and mark which fall after a requirements
 * heading, so those terms can be weighted more heavily.
 */
function segment(text) {
  const lines = text.split(/\r?\n/);
  let inReq = false;
  return lines.map((line) => {
    if (REQ_HEADING.test(line.trim().replace(/^[*\-•\s]+/, ""))) inReq = true;
    return { line, inReq };
  });
}

/**
 * Extract ranked keywords (1- to 3-grams) from a job description.
 *
 * @param {string} text  raw posting text
 * @param {{limit?: number}} [opts]
 * @returns {{term: string, count: number, score: number, inRequirements: boolean}[]}
 */
function extract(text, opts = {}) {
  const limit = opts.limit ?? 60;
  const counts = new Map();

  for (const { line, inReq } of segment(text)) {
    // Phrases never cross punctuation. Without this, sliding windows over a
    // run-on requirements sentence invent terms like "enablement or
    // cross-functional" that no CV would ever contain.
    for (const clause of line.split(/[,;:.()\[\]/]|\s[-–—]\s/)) {
      const words = clean(clause).split(" ").filter(Boolean);
      for (let n = 1; n <= 3; n++) {
      for (let i = 0; i + n <= words.length; i++) {
        const gram = words.slice(i, i + n);
        // Drop grams that are entirely stopwords, or hang off one at either end.
        if (isStop(gram[0]) || isStop(gram[gram.length - 1])) continue;
        if (gram.every(isStop)) continue;
        if (gram.some((w) => /\d/.test(w))) continue;
        // A 3-gram hinged on a stopword ("record of taking") is a sentence
        // fragment, not a term anyone indexes.
        if (n === 3 && isStop(gram[1])) continue;
        const term = gram.join(" ");
        const prev = counts.get(term) || { term, n, count: 0, weighted: 0, inRequirements: false };
        prev.count += 1;
        prev.weighted += inReq ? 2.5 : 1;
        prev.inRequirements = prev.inRequirements || inReq;
        counts.set(term, prev);
      }
      }
    }
  }

  const all = [...counts.values()];

  // Longer phrases carry more signal than the single words inside them, but
  // only if they actually recur; a 3-gram seen once is usually noise.
  for (const k of all) {
    const lengthBonus = 1 + (k.term.split(" ").length - 1) * 0.45;
    k.score = k.weighted * lengthBonus * (k.count > 1 ? 1.3 : 1);
  }

  // Drop a shorter gram when a longer one containing it scores at least as
  // well — keeps "programme management" and discards the bare "programme".
  const ranked = all.sort((a, b) => b.score - a.score);
  const kept = [];
  for (const k of ranked) {
    const swallowed = kept.some(
      (s) => s.term !== k.term && s.term.includes(k.term) && s.score >= k.score
    );
    if (!swallowed) kept.push(k);
  }

  return kept
    // Single words earn a place by sitting in the requirements; multi-word
    // phrases have to actually recur, which is what separates a real term
    // from a passing turn of phrase.
    .filter((k) => (k.n === 1 ? k.count > 1 || k.inRequirements : k.count > 1))
    .slice(0, limit)
    .map(({ term, count, score, inRequirements }) => ({
      term,
      count,
      score: Math.round(score * 10) / 10,
      inRequirements,
    }));
}

/** Fraction of `terms` that appear in `text`, plus the ones that don't. */
function coverage(text, terms) {
  const hay = clean(text);
  const hit = [];
  const miss = [];
  for (const t of terms) (hay.includes(clean(t.term || t)) ? hit : miss).push(t);
  return { hit, miss, pct: terms.length ? Math.round((hit.length / terms.length) * 100) : 0 };
}

module.exports = { extract, coverage, clean };
