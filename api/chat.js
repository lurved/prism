/**
 * Vercel Serverless Function — /api/chat
 * Deployed automatically when you connect this repo to Vercel.
 * Set ANTHROPIC_API_KEY in your Vercel project environment variables.
 *
 * The system prompt is built per request in agent/prompt.js: when an ingested
 * corpus is present it is grounded in documents from Priscilla's own folder and
 * nothing else, with the excerpts relevant to each question selected per turn.
 */

const Anthropic = require("@anthropic-ai/sdk");
const { Redis } = require("@upstash/redis");
const { buildSystemPrompt } = require("../agent/prompt");

// Redis client — env vars set automatically by Vercel Upstash integration
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
  // CORS — allow requests from any origin (your GitHub Pages site)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    const trimmed = messages.slice(-20);
    const lastUserMessage =
      [...trimmed].reverse().find((m) => m.role === "user")?.content ?? "";

    const { mode, prompt, sources } = buildSystemPrompt(lastUserMessage);

    const result = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: prompt,
      messages: trimmed,
    });

    const text = result.content.find((b) => b.type === "text")?.text ?? "";

    // Log exchange to Upstash Redis (fire-and-forget, won't block response).
    // `sources` records which documents grounded the answer, so a wrong answer
    // can be traced back to the file it came from.
    if (redis) {
      const entry = JSON.stringify({
        ts: new Date().toISOString(),
        user: messages[messages.length - 1]?.content ?? "",
        agent: text,
        mode,
        sources,
      });
      redis.lpush("chat_logs", entry).catch((e) => console.error("Redis log error:", e));
    }

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
