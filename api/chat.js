/**
 * Vercel Serverless Function — /api/chat
 * Deployed automatically when you connect this repo to Vercel.
 * Set ANTHROPIC_API_KEY in your Vercel project environment variables.
 */

const Anthropic = require("@anthropic-ai/sdk");
const { Redis } = require("@upstash/redis");
const profile = require("../agent/profile");
const { buildSystemPrompt, DEFAULT_MODEL } = require("../agent/systemPrompt");

// Redis client — env vars set automatically by Vercel Upstash integration.
// Reused below for rate limiting (same client as the chat-log write), so
// this endpoint doesn't need a second Redis library alongside the ioredis
// client already used by api/typeme/_lib.js.
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = buildSystemPrompt(profile);

// This endpoint is unauthenticated and CORS-open by design (the widget is
// public), but it's backed by a metered API key — rate limit per IP so it
// can't be used to run up the Anthropic bill. Mirrors the rateLimit()
// convention already used in api/typeme/_lib.js.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SEC = 600; // 10 minutes

async function isRateLimited(ip) {
  if (!redis) return false; // no store configured → don't block (dev)
  const key = `chat:rl:${ip}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, RATE_LIMIT_WINDOW_SEC);
  return n > RATE_LIMIT_MAX;
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

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
    if (await isRateLimited(clientIp(req))) {
      return res.status(429).json({ error: "Too many messages — please wait a bit and try again." });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    const trimmed = messages.slice(-20);

    const result = await client.messages.create({
      model: process.env.ANTHROPIC_CHAT_MODEL || DEFAULT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: trimmed,
    });

    const text = result.content.find((b) => b.type === "text")?.text ?? "";

    // Log exchange to Upstash Redis (fire-and-forget, won't block response)
    if (redis) {
      const entry = JSON.stringify({
        ts: new Date().toISOString(),
        user: messages[messages.length - 1]?.content ?? "",
        agent: text,
      });
      redis.lpush("chat_logs", entry).catch((e) => console.error("Redis log error:", e));
    }

    return res.status(200).json({ reply: text });
  } catch (err) {
    // Log the real cause server-side (e.g. an invalid model id would surface
    // here as a 4xx from the Anthropic API) — the user-facing message stays
    // generic on purpose, but this is what to check first when debugging.
    console.error("chat handler error:", err?.status ?? "", err?.message ?? err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
