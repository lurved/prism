# pris.la Weekly Analytics Digest
**Week of 16 Jun – 23 Jun 2026**  
*Generated: Monday 23 Jun 2026 — data via PostHog (first-party)*

---

## Headline

**Analytics are live but data collection has just begun.** The PostHog project recorded its first 2 events today (23 Jun, ~15:01 UTC) — a single `$pageview` and `$pageleave` on the home site homepage. No events exist from prior to today, and no traffic has reached typeme, esg, or sustainability yet. There is nothing meaningful to compare week-over-week at this stage.

---

## By Site

| Site           | PVs this week | Unique visitors | PVs last week | WoW Δ |
|----------------|:---:|:---:|:---:|:---:|
| home           | 1   | 1   | 0   | —   |
| typeme         | 0   | 0   | 0   | —   |
| esg            | 0   | 0   | 0   | —   |
| sustainability | 0   | 0   | 0   | —   |

> ⚠️ **All figures should be treated as baseline-zero, not as a drop.** The project appears to have been connected to PostHog for the first time today. WoW % change is not meaningful yet.

---

## Type Me Funnel

No funnel events recorded (`link_created`, `rate_started`, `friend_rated`, `result_viewed`) in the last 7 days — the typeme site has not yet sent any events to this PostHog project.

*Cannot compute conversion or identify a drop-off step until the instrumentation is live and traffic arrives.*

---

## Acquisition

| Source  | Pageviews |
|---------|:---------:|
| $direct | 1         |

Single direct visit to `/` (home). No referral traffic yet.

---

## Recommendations

These are setup priorities, not growth actions — the data layer needs to be confirmed before any traffic analysis is possible.

1. **Verify PostHog snippet is deployed on all four sites.** Only `home` has fired any events, and only once. Check that the PostHog `<script>` (or Next.js plugin) is included in the production builds of `typeme`, `esg`, and `sustainability` and that the `site` property is being set correctly on each.

2. **Confirm the `site` property tag is consistent.** The digest depends on filtering by `properties.site`. Run a quick sanity check after deployment: visit each site and confirm events appear in PostHog's Live Events view with the correct site value.

3. **Check for bot/localhost filtering.** The single event today may be a test hit or a localhost visit. Add a filter (`distinct_id != 'test'`, IP exclusion, or `$host` check) so baseline numbers are clean before real traffic arrives.

4. **Re-run this digest next Monday once all sites are live.** Once all four sites are instrumented and have received a week of organic traffic, the funnel, WoW comparison, and acquisition breakdown will have something real to say. The scheduled run will produce meaningful output automatically.

---

*Queried via PostHog HogQL API — project 482805, host us.posthog.com. All figures ✅ Confirmed from first-party data.*
