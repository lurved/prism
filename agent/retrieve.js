/**
 * Retrieval over the ingested corpus — dependency-free BM25-style scoring.
 *
 * The corpus is usually larger than a system prompt should be, so each turn we
 * select the chunks most relevant to what the visitor just asked and give the
 * model only those. No matching chunks means the agent has nothing to say, and
 * saying so is the correct answer.
 */

/**
 * The corpus is pulled in with a static `require` rather than `fs.readFile` so
 * Vercel's build tracer bundles the JSON with the serverless function. It is
 * absent until the first ingest, which is a supported state, not an error.
 */
function readCorpusFile() {
  try {
    return require("./knowledge/corpus.json");
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") return null;
    throw err;
  }
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "did", "do",
  "does", "for", "from", "had", "has", "have", "he", "her", "him", "his", "how",
  "i", "in", "is", "it", "its", "me", "of", "on", "or", "she", "so", "that",
  "the", "their", "them", "then", "there", "they", "this", "to", "was", "we",
  "were", "what", "when", "where", "which", "who", "why", "will", "with", "you",
  "your", "about", "tell", "know", "any", "much", "more",
]);

const K1 = 1.5;
const B = 0.75;

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

let cached = null;

/** Loads and indexes the corpus once per process. Returns null if not ingested. */
function loadCorpus() {
  if (cached !== null) return cached;

  const corpus = readCorpusFile();
  if (!corpus) {
    cached = false;
    return null;
  }

  const records = [];

  for (const doc of corpus.documents) {
    for (const chunk of doc.chunks) {
      // The title and path are searchable too — "cv", "sustainability report"
      // are often in the filename rather than the prose.
      const searchable = `${doc.title} ${doc.source} ${chunk.text}`;
      const tokens = tokenize(searchable);
      const frequencies = new Map();
      for (const token of tokens) frequencies.set(token, (frequencies.get(token) || 0) + 1);

      records.push({
        source: doc.source,
        title: doc.title,
        mtime: doc.mtime,
        index: chunk.index,
        text: chunk.text,
        length: tokens.length,
        frequencies,
      });
    }
  }

  const documentFrequency = new Map();
  for (const record of records) {
    for (const token of record.frequencies.keys()) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
  }

  const averageLength =
    records.reduce((sum, r) => sum + r.length, 0) / (records.length || 1);

  cached = { meta: corpus, records, documentFrequency, averageLength };
  return cached;
}

function score(record, queryTokens, index) {
  const { documentFrequency, records, averageLength } = index;
  let total = 0;

  for (const token of queryTokens) {
    const frequency = record.frequencies.get(token);
    if (!frequency) continue;
    const df = documentFrequency.get(token) || 0;
    const idf = Math.log(1 + (records.length - df + 0.5) / (df + 0.5));
    const denominator = frequency + K1 * (1 - B + (B * record.length) / averageLength);
    total += idf * ((frequency * (K1 + 1)) / denominator);
  }

  return total;
}

/**
 * Top-scoring chunks for a query, capped by count and an approximate character
 * budget so the system prompt stays a sane size.
 */
function retrieve(query, { limit = 12, charBudget = 24000 } = {}) {
  const index = loadCorpus();
  if (!index) return null;

  const queryTokens = [...new Set(tokenize(query || ""))];
  const ranked = index.records
    .map((record) => ({ record, value: queryTokens.length ? score(record, queryTokens, index) : 0 }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value || a.record.source.localeCompare(b.record.source));

  const selected = [];
  let used = 0;

  for (const { record } of ranked) {
    if (selected.length >= limit) break;
    if (used + record.text.length > charBudget) continue;
    selected.push(record);
    used += record.text.length;
  }

  return selected;
}

/** Every source file in the corpus — lets the agent say what it can speak to. */
function sourceList() {
  const index = loadCorpus();
  if (!index) return [];
  return index.meta.documents.map((doc) => ({ source: doc.source, title: doc.title }));
}

function hasCorpus() {
  return loadCorpus() !== null;
}

function corpusMeta() {
  const index = loadCorpus();
  if (!index) return null;
  const { generatedAt, sourceDir, documentCount, chunkCount } = index.meta;
  return { generatedAt, sourceDir, documentCount, chunkCount };
}

module.exports = { retrieve, sourceList, hasCorpus, corpusMeta, tokenize };
