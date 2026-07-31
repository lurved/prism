/**
 * Headhunter Agent — backend server
 * Run: node server.js  (from the /agent directory)
 * Requires: ANTHROPIC_API_KEY in your environment
 */

const http = require("http");
const Anthropic = require("@anthropic-ai/sdk");
const profile = require("./profile");
const { buildSystemPrompt, DEFAULT_MODEL } = require("./systemPrompt");

const client = new Anthropic();
const PORT = process.env.PORT || 3001;

const SYSTEM_PROMPT = buildSystemPrompt(profile);

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
          model: process.env.ANTHROPIC_CHAT_MODEL || DEFAULT_MODEL,
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
