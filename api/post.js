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
 *
 * Send { probe: true } instead to get a config health report (which env vars
 * are set, whether GITHUB_TOKEN still works) without publishing anything.
 */

const Anthropic = require("@anthropic-ai/sdk");

const REPO = "lurved/prism";
const BRANCH = "main";
const TAGS = ["AI", "Design", "Product", "Data", "Tools"];

const MODEL = "claude-opus-5";
// The function gets 60s (see `functions` in vercel.json). Cap the editing pass
// well inside that so there is always time left to commit — a note that
// publishes unedited beats a note that does not publish at all.
const EDIT_BUDGET_MS = 32000;

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

// The model is told to answer in JSON, but a stray sentence either side of it
// is cheap to survive — pull out the outermost object rather than trusting the
// whole reply to parse.
function extractJson(text) {
  const stripped = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in reply");
  return JSON.parse(stripped.slice(start, end + 1));
}

const rawMeta = (rawText, tag) => ({
  title: "",
  description: "",
  tag: TAGS.includes(tag) ? tag : "",
  inline: true,
  body: rawText,
});

// One streamed request to Claude. Streaming keeps the connection alive for the
// whole generation, so a long note can't trip an idle gateway timeout the way
// a single blocking POST can.
async function requestEdit(rawText, system, maxTokens, signal, withEffort) {
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: rawText }],
  };
  // Copy-editing does not need deep reasoning, and low effort is markedly
  // faster — which is what keeps this inside the function's time budget.
  if (withEffort) body.output_config = { effort: "low" };

  const stream = anthropic.messages.stream(body, { signal, timeout: EDIT_BUDGET_MS });
  return stream.finalMessage();
}

async function polish(rawText, level, tag) {
  if (!anthropic) {
    return {
      meta: rawMeta(rawText, tag),
      applied: false,
      error: "ANTHROPIC_API_KEY is not set",
    };
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

  // The reply carries the whole body back, so the ceiling has to scale with the
  // note. Too low and the JSON is cut mid-string and nothing survives parsing.
  const maxTokens = Math.min(24000, 4096 + rawText.length);

  const controller = new AbortController();
  const abort = setTimeout(() => controller.abort(), EDIT_BUDGET_MS);

  try {
    let result;
    try {
      result = await requestEdit(rawText, system, maxTokens, controller.signal, true);
    } catch (err) {
      // `output_config` is the only optional parameter here; if the API rejects
      // the request shape, retry once without it rather than losing the edit.
      if (err && err.status === 400) {
        result = await requestEdit(rawText, system, maxTokens, controller.signal, false);
      } else {
        throw err;
      }
    }

    if (result.stop_reason === "max_tokens") throw new Error("reply hit the token ceiling");
    if (result.stop_reason === "refusal") throw new Error("model declined the request");

    const text = result.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = extractJson(text);
    return {
      meta: {
        title: typeof parsed.title === "string" ? parsed.title : "",
        description: typeof parsed.description === "string" ? parsed.description : "",
        tag: TAGS.includes(parsed.tag) ? parsed.tag : "",
        inline: parsed.inline !== false && !parsed.title,
        body: typeof parsed.body === "string" && parsed.body.trim() ? parsed.body : rawText,
      },
      applied: true,
      error: "",
    };
  } catch (err) {
    // Never fail the publish over the edit: the words are already written.
    const reason = controller.signal.aborted
      ? `editing took longer than ${Math.round(EDIT_BUDGET_MS / 1000)}s`
      : String((err && err.message) || err);
    console.error("Claude cleanup failed, using raw text:", err);
    return { meta: rawMeta(rawText, tag), applied: false, error: reason };
  } finally {
    clearTimeout(abort);
  }
}

// Serialise a value as a double-quoted YAML scalar (JSON strings are valid YAML).
function yaml(value) {
  return JSON.stringify(value == null ? "" : String(value));
}

function buildMarkdown({ title, description, tag, date, inline, body, media }) {
  const lines = ["---"];
  lines.push(`title: ${yaml(title)}`);
  lines.push(`description: ${yaml(description)}`);
  lines.push(`date: ${date}`);
  if (tag) lines.push(`tag: ${yaml(tag)}`);
  if (inline) lines.push("inline: true");
  if (Array.isArray(media) && media.length) {
    lines.push("media:");
    for (const m of media) {
      lines.push(`  - url: ${yaml(m.url)}`);
      lines.push(`    type: ${yaml(m.type)}`);
    }
  }
  lines.push("---");
  lines.push("");
  lines.push(body.trim());
  lines.push("");
  return lines.join("\n");
}

// Keep only well-formed { url, type } entries with http(s) URLs.
function sanitizeMedia(media) {
  if (!Array.isArray(media)) return [];
  return media
    .filter((m) => m && typeof m.url === "string" && /^https:\/\//.test(m.url))
    .map((m) => ({ url: m.url, type: m.type === "video" ? "video" : "image" }))
    .slice(0, 20);
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "prism-blog-poster",
    "Content-Type": "application/json",
  };
}

// GitHub failures are almost always credentials, and "Publish failed" tells you
// nothing about that. Name the actual cause so the fix is obvious.
function githubHint(status) {
  if (status === 401) {
    return "GITHUB_TOKEN is invalid or expired. Generate a new fine-grained token with Contents: Read and write on " +
      REPO + ", then update it in the Vercel project settings and redeploy.";
  }
  if (status === 403) {
    return "GITHUB_TOKEN was rejected. It most likely lacks Contents: Read and write on " + REPO +
      " (or the token's expiry or IP allow-list has caught up with it).";
  }
  if (status === 404) {
    return "GitHub cannot see " + REPO + " with this token — a fine-grained token has to list this repository explicitly.";
  }
  if (status === 422 || status === 409) {
    return "GitHub refused the commit — a file with that name already exists on " + BRANCH + ".";
  }
  return "";
}

class GitHubError extends Error {
  constructor(status, detail) {
    super(`GitHub API ${status}: ${detail}`);
    this.status = status;
    this.hint = githubHint(status);
  }
}

async function putFile(filename, contents, message) {
  const url = `https://api.github.com/repos/${REPO}/contents/notes/${filename}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: githubHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(contents, "utf8").toString("base64"),
      branch: BRANCH,
    }),
  });
  if (!res.ok) throw new GitHubError(res.status, await res.text());
  return res.json();
}

// Two notes with the same title on the same day collide, and an unconditional
// PUT over an existing path is rejected rather than merged. Retry once under a
// unique name instead of losing the note.
async function commitToGitHub(filename, contents, message) {
  try {
    return await putFile(filename, contents, message);
  } catch (err) {
    if (err instanceof GitHubError && (err.status === 409 || err.status === 422)) {
      const unique = filename.replace(/\.md$/, `-${Date.now().toString(36)}.md`);
      return putFile(unique, contents, message);
    }
    throw err;
  }
}

// Health report for the settings screen: which pieces are configured, and does
// the GitHub token still work. Never returns a secret, only whether it is set.
async function probeConfig() {
  const checks = {
    publishing: {
      ok: !!process.env.GITHUB_TOKEN,
      label: "Publishing to GitHub",
      detail: process.env.GITHUB_TOKEN ? "" : "GITHUB_TOKEN is not set in the Vercel project.",
    },
    editing: {
      ok: !!anthropic,
      label: "Claude editing",
      detail: anthropic ? "" : "ANTHROPIC_API_KEY is not set — notes publish exactly as written.",
    },
    transcription: {
      ok: !!process.env.GROQ_API_KEY,
      label: "Voice transcription",
      detail: process.env.GROQ_API_KEY ? "" : "GROQ_API_KEY is not set — recording will fail.",
    },
    media: {
      ok: !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN),
      label: "Photo / video uploads",
      detail: process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN
        ? ""
        : "No Vercel Blob store is configured — uploads will fail.",
    },
  };

  if (checks.publishing.ok) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/contents/notes?ref=${BRANCH}`,
        { headers: githubHeaders() },
      );
      checks.publishing.ok = res.ok;
      if (!res.ok) checks.publishing.detail = githubHint(res.status) || `GitHub API ${res.status}.`;
    } catch (err) {
      checks.publishing.ok = false;
      checks.publishing.detail = `Could not reach GitHub: ${String((err && err.message) || err)}`;
    }
  }

  return { ok: true, probe: true, repo: REPO, branch: BRANCH, checks };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = (() => {
    try {
      return typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    } catch (_) {
      return {};
    }
  })();

  // --- Auth ---
  const secret = req.headers["x-blog-secret"] || body.secret;
  const expected = process.env.BLOG_POST_SECRET;
  if (!expected || !secret || secret !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (body.probe === true) {
    return res.status(200).json(await probeConfig());
  }

  try {
    const rawText = (body.text || "").trim();
    const media = sanitizeMedia(body.media);
    if (!rawText && media.length === 0) {
      return res.status(400).json({ error: "text or media is required" });
    }

    // Editing level: off | format | correct | polish.
    // Back-compat: old clients sent `cleanup` (true => format, false => off).
    let level = body.edit;
    if (!level) level = body.cleanup === false ? "off" : "format";
    if (!["off", "format", "correct", "polish"].includes(level)) level = "format";

    let meta;
    let editApplied = true;
    let editError = "";
    if (!rawText) {
      // Media-only post — nothing to clean, keep it an inline note.
      meta = { title: "", description: "", tag: body.tag || "", inline: true, body: "" };
    } else if (level === "off") {
      meta = { title: body.title || "", description: "", tag: body.tag || "", inline: body.inline !== false, body: rawText };
    } else {
      const edited = await polish(rawText, level, body.tag);
      meta = edited.meta;
      editApplied = edited.applied;
      editError = edited.error;
    }

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

    const markdown = buildMarkdown({ ...meta, date, media });
    const commitMsg = `blog: ${meta.title || rawText.slice(0, 50) || (media.length + " media")}`.trim();

    const result = await commitToGitHub(filename, markdown, commitMsg);

    return res.status(200).json({
      ok: true,
      path: `notes/${filename}`,
      edit: level,
      editApplied,
      editError,
      title: meta.title,
      tag: meta.tag,
      inline: meta.inline,
      media: media.length,
      preview: markdown,
      commit: result.commit && result.commit.html_url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Publish failed",
      detail: String((err && err.message) || err),
      hint: (err && err.hint) || "",
    });
  }
};
