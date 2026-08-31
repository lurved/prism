# jobs — application pipeline

One posting in; a go/no-go call and a tailored application pack out.

```bash
cd jobs && npm install

# triage only — is this worth an evening?
node apply.js jds/some-role.txt --score-only

# full pack
node apply.js jds/some-role.txt --role "Design Lead" --org "Endowus"
```

Output lands in `jobs/applications/<org-role>/`:

| File | What it is |
|---|---|
| `*.docx` | ATS-safe CV, tailored emphasis. The file you upload. |
| `*.txt` | Same content, plain text. For forms with a paste box. |
| `cover-note.md` | Draft letter. |
| `fit-report.md` | Which requirements the profile evidences, with quoted evidence, and which it does not. |

Every run also appends to `pipeline.json` so you can see what was generated for whom, and mark what you actually sent.

## What it will not do

**It does not submit anything to LinkedIn, and it never will.** That is a deliberate design decision, not a missing feature.

LinkedIn's User Agreement (§8.2) prohibits using bots or automated means to access the service. Enforcement is real and the usual penalty is a permanent account restriction. For a senior candidate the account *is* the professional asset — the network, the recommendations, the recruiter inbound. Trading it for saved clicks on the last and cheapest step of the process is a bad trade at any odds.

It is also the step worth the least. The value in applying is deciding which roles deserve the effort and arriving with a CV that matches the posting. Once you are on an Easy Apply form with the right file to hand, submitting is three clicks. This tool automates the expensive ninety per cent and leaves the cheap, risky ten per cent to you.

The workflow it is built for:

1. Set up LinkedIn job alerts (their own feature, no automation involved).
2. Paste a posting that looks worth it into `jobs/jds/`.
3. `--score-only` to triage. Most postings die here, which is the point.
4. Full run on the survivors, read the fit report, edit the letter.
5. Upload and submit by hand.

## How scoring works

`lib/keywords.js` extracts ranked 1- to 3-gram terms from the posting, weighting anything under a "What You Bring" / "Requirements" heading 2.5×. Phrases never cross punctuation, and multi-word terms must recur — otherwise a sliding window over a run-on requirements sentence invents terms like "enablement or cross-functional" that no CV would contain.

`lib/fit.js` matches those terms against `agent/profile.js` and reports coverage **with the evidence quoted**. A term only counts as covered if something in the profile actually supports it.

### Read the score for what it is

The percentage measures **how much of the posting's own vocabulary the profile can evidence**. It predicts whether a keyword screen passes you through. It does not predict whether you can do the job.

A career's worth of the right experience described in the wrong words scores badly here, and that is a finding about the profile, not a judgment on the candidate. When a score comes back low, read the gap list first: if the experience is real but simply unnamed in `profile.js`, add it there and re-run. Fixing the profile is nearly always the right move, and it compounds across every future application.

## The rule this pipeline enforces

**Emphasis is tunable. Facts are not.**

The summary, the competency blocks, and which achievements get spotlighted all change per posting. Every experience bullet comes verbatim from `profile.js`. When `ANTHROPIC_API_KEY` is set, Claude drafts the summary and letter under a hard grounding instruction — only facts present in the profile, nothing implied that is not evidenced. Without a key everything still runs on templates.

The tool therefore cannot invent a claim to fit a job description. That is the whole point: an application that wins on a fabricated keyword loses at the interview, and it costs more than it saves.

Verify the output anyway. It drafts; you send.

## Files

```
apply.js            CLI
lib/keywords.js     term extraction and coverage
lib/fit.js          evidence matching, coverage, verdict bands
lib/grouping.js     themed competency blocks
lib/cv.js           ATS-safe .docx and .txt from one block model
lib/tailor.js       summary, spotlight, cover note (Claude optional)
jds/                postings, as plain text
applications/       generated packs (gitignored)
pipeline.json       tracker
```

## Config

| Env var | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Enables Claude-drafted summary and cover note. Without it, templates. |
| `JOBS_MODEL` | Override the model. Defaults to `claude-opus-5`. |
