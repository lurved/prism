#!/usr/bin/env node
/**
 * Cross-site usage analytics for pris.la, via the PostHog query API.
 *
 * This is the tool Claude / cowork uses to answer "analyse usage across all my
 * sites". Every pris.la page tags its events with a `site` property
 * ("home" | "typeme" | "esg" | "sustainability"), so one query compares them.
 *
 * Usage:
 *   node scripts/posthog-usage.mjs                 # default 30-day site summary
 *   node scripts/posthog-usage.mjs --days 7        # change the window
 *   node scripts/posthog-usage.mjs --funnel        # Type Me funnel breakdown
 *   node scripts/posthog-usage.mjs --sql "SELECT ...HogQL..."   # ad-hoc query
 *   node scripts/posthog-usage.mjs --json          # raw JSON (for piping)
 *
 * Config (read from env, or a gitignored .posthog.json at the repo root):
 *   POSTHOG_PERSONAL_API_KEY   phx_...  (Personal API key, scope: query:read)
 *   POSTHOG_PROJECT_ID         numeric project id
 *   POSTHOG_HOST               default https://us.posthog.com
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadConfig() {
  let fileCfg = {};
  try {
    fileCfg = JSON.parse(readFileSync(join(ROOT, ".posthog.json"), "utf8"));
  } catch {}
  const key = process.env.POSTHOG_PERSONAL_API_KEY || fileCfg.personalApiKey;
  const project = process.env.POSTHOG_PROJECT_ID || fileCfg.projectId;
  const host = process.env.POSTHOG_HOST || fileCfg.host || "https://us.posthog.com";
  if (!key || !project) {
    console.error(
      "Missing config. Set POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID\n" +
        "(or create .posthog.json — see ANALYTICS.md)."
    );
    process.exit(1);
  }
  return { key, project, host: host.replace(/\/$/, "") };
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}

async function runHogQL(cfg, query) {
  const res = await fetch(`${cfg.host}/api/projects/${cfg.project}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (!res.ok) {
    console.error(`PostHog API error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  return res.json();
}

function table(columns, results) {
  const rows = [columns, ...results.map((r) => r.map((c) => String(c ?? "")))];
  const widths = columns.map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  const line = (r) => r.map((c, i) => c.padEnd(widths[i])).join("  ");
  console.log(line(rows[0]));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  rows.slice(1).forEach((r) => console.log(line(r)));
}

const cfg = loadConfig();
const days = Number(arg("--days", 30)) || 30;
const asJson = arg("--json", false);

let query;
if (arg("--sql", false) && typeof arg("--sql", false) === "string") {
  query = arg("--sql");
} else if (arg("--funnel", false)) {
  // Type Me viral loop, step by step.
  query = `
    SELECT event, count() AS events, uniq(person_id) AS people
    FROM events
    WHERE timestamp > now() - INTERVAL ${days} DAY
      AND event IN ('$pageview','link_created','rate_started','friend_rated','result_viewed','link_copied','link_shared')
      AND properties.site = 'typeme'
    GROUP BY event
    ORDER BY events DESC`;
} else {
  // Default: usage across all sites.
  query = `
    SELECT
      coalesce(properties.site, 'unknown') AS site,
      countIf(event = '$pageview') AS pageviews,
      uniq(person_id) AS visitors,
      count() AS total_events
    FROM events
    WHERE timestamp > now() - INTERVAL ${days} DAY
    GROUP BY site
    ORDER BY pageviews DESC`;
}

const data = await runHogQL(cfg, query);
if (asJson) {
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log(`\npris.la usage — last ${days} days\n`);
  table(data.columns || [], data.results || []);
  console.log("");
}
