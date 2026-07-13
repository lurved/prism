/**
 * Vercel Serverless Function — /api/post
 *
 * Publishes a blog note from voice/text by committing a markdown file to
 * notes/<slug>.md on the `main` branch. Vercel then auto-redeploys.
 *
 * Auth: send the shared secret in the `x-blog-secret` header (or `secret` in
 * the JSON body). It must match the BLOG_POST_SECRET env var.
 *
 * Required env vars (set in the Vercel project):
 *   BLOG_POST_SECRET  — a long random string you keep on your phone
 *   GITHUB_TOKEN      — fine-grained PAT, "Contents: Read and write" on lurved/prism
 *   ANTHROPIC_API_KEY — (optional) enables Claude cleanup of the transcript
 *
 * Body: { text, cleanup?, inline?, title?, tag?, secret? }
 */

const Anthropic = require("@anthropic-ai/sdk");

const REPO = "lurved/prism";
const BRANCH = "main";
const TAGS = ["AI", "Design", "Product", "Data", "Tools"];

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Turn a title into a filename-safe slug.
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Clean up a raw dictation transcript with Claude and infer metadata.
// Returns { title, description, tag, inline, body }. Falls back gracefully.
// How hard Claude edits the body. Formatting + metadata are always applied;
// only the editing instruction changes.
const EDIT_INSTRUCTIONS = {
  format:
    'Fix punctuation, capitalisation and paragraph breaks only. Do NOT rewrite, correct grammar, or change any wording, tone or meaning. Keep it raw and personal, exactly as spoken.',
  correct:
    "Fix punctuation, capitalisation, paragraph breaks, spelling, typos, and clear grammatical mistakes, and lightly smooth awkward sentence structure. Keep the author's own wording, phrasing, tone and meaning — do NOT rewrite for style or swap in fancier words. Minimal, corrective edits only.",
  polish:
    "Rewrite into clear, natural, well-structured English: fix all grammar, spelling and punctuation, improve flow, word choice and sentence structure. Preserve the author's meaning, every point they make, and their casual personal voice — do NOT add new ideas, facts, or opinions, and do NOT make it formal or corporate.",
};

async function polish(rawText, level) {
  if (!anthropic) {
    return { title: "", description: "", tag: "", inline: true, body: rawText };
  }

  const editRule = EDIT_INSTRUCTIONS[level] || EDIT_INSTRUCTIONS.format;

  const system = `You prepare voice-dictated blog notes for a personal blog written in a candid, stream-of-consciousness voice. The text you receive is a raw speech-to-text transcript.

Rules:
- Interpret spoken cues like "new paragraph", "full stop", "comma" as formatting, not literal words.
- ${editRule}
- Decide if this is a short "inline" note (a quick thought, a sentence or two — no title needed) or a longer post that deserves a title.
- Pick exactly one tag from this list: ${TAGS.join(", ")}.
- Write a one-sentence description only for longer (non-inline) posts; leave it empty for inline notes.

Return ONLY minified JSON, no markdown fences, with this exact shape:
{"title": string, "description": string, "tag": string, "inline": boolean, "body": string}
For inline notes set "title" to "".`;

  try {
    const result = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: rawText }],
    });
    const text = result.content.find((b) => b.type === "text")?.text ?? "";
    const json = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(json);
    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      description: typeof parsed.description === "string" ? parsed.description : "",
      tag: TAGS.includes(parsed.tag) ? parsed.tag : "",
      inline: parsed.inline !== false && !parsed.title,
      body: typeof parsed.body === "string" && parsed.body.trim() ? parsed.body : rawText,
    };
  } catch (err) {
    console.error("Claude cleanup failed, using raw text:", err);
    return { title: "", description: "", tag: "", inline: true, body: rawText };
  }
}

// Serialise a value as a double-quoted YAML scalar (JSON strings are valid YAML).
function yaml(value) {
  return JSON.stringify(value == null ? "" : String(value));
}

function buildMarkdown({ title, description, tag, date, inline, body }) {
  const lines = ["---"];
  lines.push(`title: ${yaml(title)}`);
  lines.push(`description: ${yaml(description)}`);
  lines.push(`date: ${date}`);
  if (tag) lines.push(`tag: ${yaml(tag)}`);
  if (inline) lines.push("inline: true");
  lines.push("---");
  lines.push("");
  lines.push(body.trim());
  lines.push("");
  return lines.join("\n");
}

async function commitToGitHub(filename, contents, message) {
  const url = `https://api.github.com/repos/${REPO}/contents/notes/${filename}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "prism-blog-poster",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(contents, "utf8").toString("base64"),
      branch: BRANCH,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub API ${res.status}: ${detail}`);
  }
  return res.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Auth ---
  const secret = req.headers["x-blog-secret"] || (req.body && req.body.secret);
  const expected = process.env.BLOG_POST_SECRET;
  if (!expected || !secret || secret !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const rawText = (body.text || "").trim();
    if (!rawText) {
      return res.status(400).json({ error: "text is required" });
    }

    // Editing level: off | format | correct | polish.
    // Back-compat: old clients sent `cleanup` (true => format, false => off).
    let level = body.edit;
    if (!level) level = body.cleanup === false ? "off" : "format";
    if (!["off", "format", "correct", "polish"].includes(level)) level = "format";

    const meta = level === "off"
      ? { title: body.title || "", description: "", tag: body.tag || "", inline: body.inline !== false, body: rawText }
      : await polish(rawText, level);

    // Explicit overrides from the client win over inferred values.
    if (typeof body.title === "string" && body.title.trim()) {
      meta.title = body.title.trim();
      meta.inline = false;
    }
    if (typeof body.inline === "boolean") meta.inline = body.inline;
    if (typeof body.tag === "string" && TAGS.includes(body.tag)) meta.tag = body.tag;

    const date = new Date().toISOString();
    const stamp = date.slice(0, 10).replace(/-/g, "");
    const slug = meta.title ? slugify(meta.title) : "";
    const filename = `${stamp}${slug ? "-" + slug : "-" + Date.now().toString(36)}.md`;

    const markdown = buildMarkdown({ ...meta, date });
    const commitMsg = `blog: ${meta.title || rawText.slice(0, 50)}`.trim();

    const result = await commitToGitHub(filename, markdown, commitMsg);

    return res.status(200).json({
      ok: true,
      path: `notes/${filename}`,
      edit: level,
      title: meta.title,
      tag: meta.tag,
      inline: meta.inline,
      preview: markdown,
      commit: result.commit && result.commit.html_url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Publish failed", detail: String(err.message || err) });
  }
};
