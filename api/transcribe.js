/**
 * Vercel Serverless Function — /api/transcribe
 *
 * Takes a recorded audio clip (raw binary POST body) and returns an accurate
 * transcript using Groq's Whisper (whisper-large-v3-turbo). Far more accurate
 * than the browser's live Web Speech API for natural, connected speech.
 *
 * Auth: `x-blog-secret` header must match BLOG_POST_SECRET.
 * Required env var: GROQ_API_KEY  (free key from https://console.groq.com)
 *
 * Request:  POST with Content-Type: audio/webm (or audio/mp4), body = audio bytes.
 * Response: { text }
 */

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = "whisper-large-v3-turbo";

// Biases the recogniser toward names/terms that show up on this blog so they
// aren't mangled. Whisper uses this as a soft hint, not a hard constraint.
const PROMPT =
  "pris.la, Priscilla, Claude, Anthropic, TinaCMS, Vercel, Eleventy, ESG, AI, blog.";

// Disable Vercel's automatic body parsing so we get the raw audio stream.
module.exports.config = { api: { bodyParser: false } };

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = req.headers["x-blog-secret"];
  if (!process.env.BLOG_POST_SECRET || secret !== process.env.BLOG_POST_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set" });
  }

  try {
    const audio = await readRawBody(req);
    if (!audio || audio.length === 0) {
      return res.status(400).json({ error: "No audio received" });
    }

    const contentType = req.headers["content-type"] || "audio/webm";
    const ext = contentType.includes("mp4") ? "mp4" : contentType.includes("ogg") ? "ogg" : "webm";

    const form = new FormData();
    form.append("file", new Blob([audio], { type: contentType }), `note.${ext}`);
    form.append("model", MODEL);
    form.append("response_format", "json");
    form.append("prompt", PROMPT);
    // language is auto-detected by Whisper; omit to support any language.

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: form,
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      throw new Error(`Groq ${groqRes.status}: ${detail}`);
    }

    const data = await groqRes.json();
    return res.status(200).json({ text: (data.text || "").trim() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Transcription failed", detail: String(err.message || err) });
  }
};
