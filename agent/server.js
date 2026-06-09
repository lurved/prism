/**
 * Headhunter Agent — backend server
 * Run: node server.js  (from the /agent directory)
 * Requires: ANTHROPIC_API_KEY in your environment
 */

const http = require("http");
const Anthropic = require("@anthropic-ai/sdk");
const profile = require("./profile");

const client = new Anthropic();
const PORT = process.env.PORT || 3001;

// Build the system prompt from the profile
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

  const posts = profile.linkedInPosts && profile.linkedInPosts.length
    ? profile.linkedInPosts
        .map((p) => `**${p.date}${p.title ? " — " + p.title : ""}**\n${p.summary}`)
        .join("\n\n")
    : "None listed yet.";

  const recs = profile.recommendations && profile.recommendations.length
    ? profile.recommendations
        .map((r) => `**${r.author}** (${r.title}, ${r.date}) — *${r.relationship}*\n"${r.text}"`)
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

1. ONLY use information explicitly stated in this prompt. Do not infer, extrapolate, or draw on any external knowledge about Priscilla, her employers, or her work beyond what is written above.
2. If asked something not covered in this prompt, say honestly: "I don't have that detail — reach out to Priscilla directly at ${profile.email} and she'll be happy to answer."
3. Never fabricate figures, dates, titles, company names, outcomes, or any other details. If a fact isn't here, it doesn't exist for you.
4. Encourage the visitor to reach out: ${profile.email} or ${profile.linkedin}
5. Keep responses concise and punchy — two to four sentences per point unless asked to elaborate.
6. If there's a natural connection between what the visitor is working on and Priscilla's background, highlight it and suggest they connect.
7. Frame everything around collaboration and mutual value — not job seeking. Priscilla is accomplished and selective.
8. Never discuss anything unrelated to Priscilla's work, interests, or potential collaborations.
`;
}

const SYSTEM_PROMPT = buildSystemPrompt();

// Simple CORS + JSON helper
function respond(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(json);
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { messages } = JSON.parse(body);

        if (!Array.isArray(messages) || messages.length === 0) {
          return respond(res, 400, { error: "messages array required" });
        }

        // Keep last 20 turns to avoid context blow-out
        const trimmed = messages.slice(-20);

        const result = await client.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: trimmed,
        });

        const text =
          result.content.find((b) => b.type === "text")?.text ?? "";
        respond(res, 200, { reply: text });
      } catch (err) {
        console.error(err);
        respond(res, 500, { error: "Something went wrong. Please try again." });
      }
    });
    return;
  }

  respond(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Headhunter agent running on http://localhost:${PORT}`);
});
