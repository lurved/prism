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
| `Priscilla-Liu-CV.docx` | ATS-safe CV, tailored emphasis. **The file you upload.** |
| `Priscilla-Liu-CV.pdf` | Typeset for print. The file you send to a person. |
| `Priscilla-Liu-CV.txt` | Same content, plain text. For forms with a paste box. |
| `Priscilla-Liu-CV.html` | Source for the PDF; ignore unless you want to tweak the print CSS. |
| `cover-note.md` | Draft letter. |
| `fit-report.md` | Which requirements the profile evidences, with quoted evidence, and which it does not. |

The CV is named for the candidate, never the posting. The directory carries the
role, which is what you need locally; the file is what reaches a recruiter, who
sorts by candidate and already knows the role. A neutral name also fails quietly
if it ever goes to the wrong employer, where one naming the posting would
announce it. Rename on send in the rare case a portal demands unique filenames.

Once an application is marked `submitted` in `pipeline.json`, re-running it
does nothing: the files on disk are the record of what was actually sent, and
the profile has usually moved on since. `--force` overwrites them anyway.

Every run also appends to `pipeline.json` so you can see what was generated for whom, and mark what you actually sent. Fields added by hand survive regeneration.

`active` marks what is actually being worked on. It is separate from `status`
on purpose: a submitted application stays live with the employer whether or
not you are still working it, so closing one out sets `active: false` and
leaves `status: "submitted"` alone. Nothing here withdraws an application.

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

## Design versus parsing

The two pull against each other, and the resolution is that they are the same
document rendered from one block model, so the formats can never disagree.

What actually breaks an applicant tracking system is *layout*: multiple
columns, tables used for positioning, text boxes, contact details stranded in
a header, text baked into an image. None of that appears here. What parsers
ignore harmlessly is *type and colour* — so that is where the design lives,
over a strictly single-column document.

The experience entries use a left date rail. It is a tab stop with a hanging
indent, never a table: extraction reads `Sep 2025 - Present<tab>DIRECTOR,
SUSTAINABILITY AND DIGITAL` as one continuous line.

**This is deliberately not the pris.la design system.** The site is navy with
a pink accent in Newsreader and Hanken Grotesk; the CV is Aptos, greyscale, on
white. A CV is printed, parsed by machines, and read by people who have never
seen the site — a house style is noise there. See `CLAUDE.md`.

- **`.docx`** asks for Aptos alone. It has been Microsoft Office's default
  since 2023, so any current install has it and older ones substitute
  gracefully — a far smaller risk than a webfont with no local presence.
  Font choice does not affect parsing at all; parsers read text and discard
  typeface.
- **`.pdf`** embeds Inter, the closest widely available stand-in, since Aptos
  is not on Google Fonts and cannot be embedded here. Aptos is listed first in
  the stack, so anyone who has it sees it. Chrome prints real text rather than
  outlines, so the PDF parses too — but the `.docx` remains the safer upload.

## Writing it yourself

Three things override anything the tool drafts, all keyed on the application
directory name:

| File | Overrides |
|---|---|
| `summaries/<slug>.txt` | The professional summary |
| `headlines/<slug>.txt` | The one-line title under the name |
| `letters/<slug>.md` | The cover note |

These are the parts that carry positioning rather than fact, and generation is
the fallback for them, not the ceiling. Anything hand-written survives
regeneration; without an override the tool derives one and prints what it
chose, so a wrong guess is visible rather than silent.

## How scoring works

`lib/keywords.js` extracts ranked 1- to 3-gram terms from the posting, weighting anything under a "What You Bring" / "Requirements" heading 2.5×. Phrases never cross punctuation, and multi-word terms must recur — otherwise a sliding window over a run-on requirements sentence invents terms like "enablement or cross-functional" that no CV would contain.

`lib/fit.js` matches those terms against `agent/profile.js` and reports coverage **with the evidence quoted**. A term only counts as covered if something in the profile actually supports it.

### When the requirements section is boilerplate

Plenty of postings put soft-skill filler under "Requirements" — *able to work
independently, thinks out of the box, strong team player* — and hide the real
demands in the responsibilities above it. Weighting that block 2.5x then scores
the filler and flatters badly.

When the requirements block yields fewer than 20 distinct terms, the tool says
so, scores on the whole posting instead, and prints what the requirement-only
figure would have claimed. OCBC's Platform Lead posting is the case that
prompted this: 92% on requirements alone, 71% across the posting, and the gap
list full of production-operations terms the requirements block never mentions.

### Hard gates — what the percentage cannot see

`lib/gates.js` reports separately on the requirements that are answered yes or
no: "at least three years implementing applied AI", "Bachelor's degree
required". These are usually enforced as **application-form questions** rather
than by reading the CV, so no amount of rewording argues past one. A posting
can score 91% and still be gated.

They are also what the recruiter screen turns on. A recruiter forwards the
candidate they can defend in one sentence; a stated requirement you are
marginally short of turns that sentence into a paragraph, and a paragraph is a
risk they need not take. So the gates are printed apart from the coverage
figure and never folded into it.

Two failure modes, not one:

- **Short of the bar.** The obvious one.
- **Far above it.** A role banded at "5+ years" is written for someone eight
  to twelve years in; fifteen years reads as flight risk and salary mismatch
  and screens out just as fast. Flagged as `BAND`.

**Year bars against a speciality are deliberately not adjudicated.** Deciding
whether a past role counts towards "ten years of programme management" is a
judgment about the career, and word overlap cannot make it. Matching loosely
let the applied-AI entries satisfy a UX design bar; matching tightly scored an
eighteen-year career as three years, because older roles describe the same work
in different words. Both readings were confident and wrong, in opposite
directions. So the tool names the bar, lists the dated entries that look
related with their term overlap, and leaves the call to you — a gate it cannot
judge is worth surfacing, not worth guessing.

What it does decide: total career length, degree requirements, and banding.

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
lib/gates.js        hard gates — year bars, degrees, stated must-haves
lib/grouping.js     themed competency blocks
lib/cv.js           ATS-safe .docx and .txt from one block model
lib/tailor.js       summary, spotlight, cover note (Claude optional)
jds/                postings, as plain text
applications/       generated packs (gitignored)
pipeline.json       tracker
```

## What does not go in this repo

`lurved/prism` is public. `applications/` is gitignored and should stay that
way: `fit-report.md` is a list of what the profile cannot evidence, which is a
written record of the candidate's weaknesses. The same goes for application
framing and interview preparation — the honest read on where an application is
short is the most useful document in the process and the one least suited to a
public repository.

Keep those private, and record a **pointer** in `pipeline.json` instead, so a
later session knows the document exists without the content being published.
The A\*STAR entry's `framingDoc` is the pattern.

The consequence is that `applications/` dies with the container it was
generated in. That is the right trade, but it means downloading a pack you
actually sent, if you want to keep it.

## Contact details

The phone number lives in `agent/profile.js` alongside the email, published
deliberately: `lurved/prism` is a **public** repository, so it is indexed,
scraped, and permanent in git history. The trade is that the site agent can
give it to a recruiter who asks, and the CV picks it up with no extra setup.

`CV_PHONE` overrides it per machine or per environment without editing the
profile. With neither, the CV prints a visible `[Phone number]` placeholder
rather than silently shipping without one.

## Config

| Env var | Effect |
|---|---|
| `CV_PHONE` | Overrides the phone number in `agent/profile.js`. |
| `ANTHROPIC_API_KEY` | Enables Claude-drafted summary and cover note. Without it, templates. |
| `JOBS_MODEL` | Override the model. Defaults to `claude-opus-5`. |
