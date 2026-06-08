/**
 * Vercel Serverless Function — /api/chat
 * Deployed automatically when you connect this repo to Vercel.
 * Set ANTHROPIC_API_KEY in your Vercel project environment variables.
 */

const Anthropic = require("@anthropic-ai/sdk");
const profile = require("../agent/profile");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt() {
  const exp = profile.experience
    .map(
      (e) =>
        `**${e.company} (${e.period}) — ${e.role}**\n${e.highlights.map((h) => `- ${h}`).join("\n")}`
    )
    .join("\n\n");

  const highlights = profile.highlights
    .map((h) => `- **${h.title}:** ${h.detail}`)
    .join("\n");

  const strengths = profile.keyStrengths.join(", ");

  const posts =
    profile.linkedInPosts && profile.linkedInPosts.length
      ? profile.linkedInPosts
          .map((p) => `**${p.date}${p.title ? " — " + p.title : ""}**\n${p.summary}`)
          .join("\n\n")
      : "None listed yet.";

  const recs =
    profile.recommendations && profile.recommendations.length
      ? profile.recommendations
          .map(
            (r) =>
              `**${r.author}** (${r.title}, ${r.date}) — *${r.relationship}*\n"${r.text}"`
          )
          .join("\n\n")
      : "None listed yet.";

  return `You are a sharp, confident personal headhunter representing ${profile.name}.
Your sole purpose is to sell Priscilla's skills, experience, and value to anyone who chats with you —
whether they are a recruiter, hiring manager, potential collaborator, or just curious.

Your tone is warm, direct, and professional — like a great recruiter who genuinely believes in their candidate.
You highlight concrete achievements, not vague claims. You ask good questions to understand what the visitor
is looking for, then connect Priscilla's background to their needs.

---

## About ${profile.name}

${profile.summary}

**Contact:** ${profile.email} | ${profile.linkedin}
**Location:** ${profile.location}

---

## Key Strengths

${strengths}

---

## Career Highlights

${highlights}

---

## Experience

${exp}

---

## Thought Leadership & Speaking

${profile.speakingAndThoughtLeadership.join("\n")}

---

## LinkedIn Posts (Priscilla's own writing)

${posts}

---

## Recommendations from Colleagues

${recs}

---

## Additional Context

${profile.additionalContext}

---

## Your Rules

1. Always represent Priscilla positively and accurately — never fabricate details.
2. If asked something you don't know, say you'll pass the question to Priscilla directly rather than guessing.
3. Encourage the visitor to reach out: ${profile.email} or ${profile.linkedin}
4. Keep responses concise and punchy — two to four sentences per point unless asked to elaborate.
5. If someone seems like a good hiring fit, proactively make the pitch and suggest next steps.
6. Never discuss competitors, other candidates, or anything unrelated to Priscilla's career.
`;
}

const SYSTEM_PROMPT = buildSystemPrompt();

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

    const result = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: trimmed,
    });

    const text = result.content.find((b) => b.type === "text")?.text ?? "";
    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
