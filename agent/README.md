# The pris.la agent

The chat agent behind the widget on pris.la. It runs as a Vercel function
(`/api/chat`) with `server.js` as a local equivalent for development.

## Where its knowledge comes from

The agent has two modes, chosen automatically:

| Mode | When | Source of facts |
| --- | --- | --- |
| **grounded** | `agent/knowledge/corpus.json` exists | Documents ingested from a folder on Priscilla's machine — nothing else |
| **profile** | no corpus yet | The hand-written `profile.js` (the original behaviour) |

Grounded mode is the goal. `profile.js` stays as a fallback so the live site
never answers with an empty brain between ingests.

## Training it on a folder

The deployed function runs on Vercel and cannot read a local disk, so ingest is
a **local build step**: it runs on the machine that has the folder, and its
output is committed.

```bash
cd agent
npm install                 # once — pulls pdf-parse and mammoth for PDF/Word
npm run ingest:preview      # report what would be ingested; writes nothing
npm run ingest              # write knowledge/corpus.json + knowledge/MANIFEST.md
git add knowledge && git commit -m "Re-ingest agent knowledge" && git push
```

Vercel redeploys on push, and the agent is answering from the new corpus.

### Scope

`ingest.config.json` controls what gets read:

```jsonc
{
  "sourceDir": "/Users/priscilla",   // override with --src or AGENT_SOURCE_DIR
  "include":   ["Documents/**", "Desktop/**", "agent-knowledge/**"],
  "exclude":   ["**/node_modules/**", ...],
  "extensions": [".md", ".txt", ".pdf", ".docx", ...]
}
```

`include` is deliberately **not** the whole of `/Users/priscilla`. A home folder
holds tax records, client material and half-finished drafts, and everything
ingested becomes answerable by a public chat widget. Widen `include` only to
folders whose contents could sit on the public site.

The cleanest setup is a dedicated folder — `/Users/priscilla/agent-knowledge` —
holding only what the agent should know: CV, bio, talk abstracts, project
write-ups, FAQ answers. Drop a file in, re-ingest, done. It is already in the
default `include` list.

### What is refused regardless of config

A built-in denylist in `ingest.js` cannot be overridden: `.ssh`, `.aws`,
`.gnupg`, `Library`, `.config`, `.env*`, `*.pem`, `*.key`, keychains, anything
matching `*secret*` or `*password*`. Files whose **contents** look like a live
credential (private-key headers, AWS/Anthropic/GitHub/Slack token shapes) are
dropped and listed in the manifest.

This reduces accidents; it does not replace reading `MANIFEST.md`. Every run
writes it, listing exactly which files became public knowledge. **Read it before
committing.**

## How grounding works at runtime

The corpus is usually larger than a system prompt should be, so `retrieve.js`
scores chunks (BM25, no dependencies) against the visitor's latest message and
`prompt.js` injects only the top matches — roughly 12 chunks, capped at ~24k
characters.

The prompt then instructs the agent that those excerpts are the whole of its
knowledge: attribute substantive claims to the document they came from, and when
the excerpts don't cover a question, say so and point to Priscilla's email
rather than guessing. Nothing matched at all means the excerpt section says so
explicitly, so the model has nothing to work from and answers honestly.

Contact details are the one exception — they come from `profile.js`, because the
agent needs them to hand off a conversation.

Each logged exchange records `mode` and the `sources` that grounded it, so a
wrong answer can be traced back to the file that caused it.

## Files

| File | Role |
| --- | --- |
| `ingest.js` | Scans the source folder, extracts text, chunks it, writes the corpus |
| `ingest.config.json` | Scope: source folder, include/exclude, extensions, limits |
| `retrieve.js` | BM25 retrieval over the corpus |
| `prompt.js` | Builds the system prompt (grounded or profile mode) |
| `server.js` | Local dev server on `:3001` |
| `profile.js` | Fallback knowledge and contact details |
| `knowledge/corpus.json` | Generated. Committed — it is what the deployed agent reads |
| `knowledge/MANIFEST.md` | Generated. The human-readable record of what is public |

`/agent/*` is 404'd by `middleware.js`: the site's static output directory is the
repo root, so without that guard the corpus would be downloadable straight off
pris.la.
