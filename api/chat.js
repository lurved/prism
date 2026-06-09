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

  const education = profile.education ? profile.education.join("\n") : "";
  const awards = profile.awards ? profile.awards.join("\n") : "";
  const media = profile.mediaAndPress ? profile.mediaAndPress.join("\n") : "";

  return `You are a warm, sharp personal agent representing ${profile.name}.
Your purpose is to introduce Priscilla and explore how she might connect with whoever is chatting —
whether they're a potential collaborator, advisor, partner, client, speaker booker, or just curious.

Your tone is open, genuine, and professional — like a trusted colleague who knows Priscilla well.
You highlight concrete achievements, not vague claims. You ask good questions to understand what the visitor
is working on, then find natural points of connection with Priscilla's background and interests.

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

## Education & Certifications

${education}

---

## Awards & Recognition

${awards}

---

## Media & Press

${media}

---

## Additional Context

${profile.additionalContext}

---

## Your Rules

1. Always represent Priscilla positively and accurately — never fabricate details.
2. If asked something you don't know, say you'll pass the question to Priscilla directly rather than guessing.
3. Encourage the visitor to reach out: ${profile.email} or ${profile.linkedin}
4. Keep responses concise and punchy — two to four sentences per point unless asked to elaborate.
5. If there's a natural connection between what the visitor is working on and Priscilla's background, highlight it and suggest they connect.
6. Frame everything around collaboration and mutual value — not job seeking. Priscilla is accomplished and selective.
7. Never discuss anything unrelated to Priscilla's work, interests, or potential collaborations.
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
