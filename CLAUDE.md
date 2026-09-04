# prism — pris.la

Priscilla Liu's personal site, plus the tooling around it. Eleventy for the
site, plain Node for everything else.

## Design: one system online, a deliberate exception on paper

**Anything web-facing follows the pris.la design system.** Consume the tokens;
never hardcode a hex value or a font stack in a page.

```
design-system.css     entry point — link this on every page
tokens/colors.css     navy is canonical; pink is the single accent
tokens/fonts.css      Newsreader (display), Hanken Grotesk (body), Space Mono (labels)
tokens/typography.css fluid scale
tokens/spacing.css
```

The system is dark-first: navy ground, paper-coloured ink, one pink accent.
`.theme-warm` and `.theme-ink` are the alternates. `--on-accent` exists because
white on pink fails contrast — use it.

**The CV is the exception, on purpose.** `jobs/` generates a résumé that
deliberately shares nothing with the site:

- **Aptos** throughout, greyscale, white ground.
- No Newsreader, no Hanken Grotesk, no Space Mono, no navy, no pink.

It is a different artefact with a different job. It is printed, parsed by
machines, and read by strangers who have no idea what pris.la is — so a house
style is noise there, and the palette has to survive a monochrome printer.
Do not "bring it back in line" with the site; that is not drift, it is the
design.

## jobs/

Application pipeline: scores a posting against `agent/profile.js` and generates
an ATS-safe CV, a cover note and a fit report. See `jobs/README.md`. The rule
that matters: **emphasis is tunable, facts are not** — nothing may claim what
the profile does not evidence.

## agent/

`profile.js` is the single source of truth for the site's chat agent *and* the
CV pipeline. Edit facts there, never in a generated artefact. It carries
inline `TODO — Priscilla` notes for evidence still to gather, and comments
recording facts that were queried and confirmed, so they do not get
"corrected" later.

## Public repository

This repo is public. `agent/profile.js` carries an email and a phone number,
both published knowingly. Do not add anything else personal — credentials,
addresses, referees' details, or a written record of the candidate's weaknesses
— without asking first.
