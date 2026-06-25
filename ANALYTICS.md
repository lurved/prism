# Analytics — pris.la

First-party product analytics via **PostHog** (US cloud), unified across every
site so usage can be compared in one place. Vercel Web Analytics is kept too,
but only PostHog is queryable by Claude.

## What's instrumented

Every page sends events tagged with a **`site`** property, which is the key that
makes "usage across all my sites" answerable in a single query:

| `site`           | What it covers                                    |
| ---------------- | ------------------------------------------------- |
| `home`           | `index.html`, `about.html`                        |
| `typeme`         | Type Me app (`/typeme`, `/typeme/u/*`)            |
| `esg`            | ESG Tracker (Next.js, `/sustainability/report_comparison`) |
| `sustainability` | SP Group report (`/sustainability`, `/sustainability/sr2026`) |

Captured automatically: `$pageview` (SPA-aware), `$pageleave`, and autocapture
clicks. Custom **Type Me funnel** events (the viral loop):
`link_created → rate_started → friend_rated → result_viewed`, plus `link_copied`
/ `link_shared`.

### Where it's wired
- `analytics.js` (repo root) — shared snippet loaded by all static pages. Skips
  `localhost`. Defines `window.track(event, props)` for custom events.
- `typeme/app.js` — fires the funnel events via `window.track`.
- `api/typeme/hub.js` — server-rendered friend pages include `analytics.js`.
- `sustainability/report_comparison/src/app/layout.tsx` — the Next.js app inits
  PostHog itself (same project key, `site: "esg"`).

The write key (`phc_…`) is public by design (client-side ingestion).

## How Claude analyses usage

Reading data needs a **Personal API key** (separate from the write key):

1. PostHog → **Settings → Personal API keys** → create one with the
   **`query:read`** scope. Copy the `phx_…` value.
2. Get the numeric **project id** from Settings → Project.
3. `cp .posthog.example.json .posthog.json` and fill both in. (`.posthog.json`
   is gitignored.) Or export `POSTHOG_PERSONAL_API_KEY` / `POSTHOG_PROJECT_ID`.

Then:

```bash
node scripts/posthog-usage.mjs            # 30-day usage across all sites
node scripts/posthog-usage.mjs --days 7   # last 7 days
node scripts/posthog-usage.mjs --funnel   # Type Me funnel breakdown
node scripts/posthog-usage.mjs --sql "SELECT properties.site, count() FROM events WHERE event='$pageview' GROUP BY 1"
```

The `--sql` flag runs arbitrary **HogQL** (PostHog's SQL), so any ad-hoc
question ("which site grew week-over-week?", "where do Type Me raters drop?")
becomes a query. Add `--json` to pipe raw results.

> When asked to "analyse usage across my sites", run `scripts/posthog-usage.mjs`
> (default for an overview, `--sql` for specifics) and summarise the output.
> The PostHog UI (Web Analytics, Funnels, Session Replay) is also there for
> visual self-serve.

## Notes
- **Cookieless option:** currently uses `localStorage+cookie` for full features
  (retention, session replay). To drop the cookie-consent obligation, change
  `persistence` to `"memory"` in `analytics.js` and the ESG snippet.
- **Session replay** is off until enabled in PostHog → Settings → Session
  replay.
