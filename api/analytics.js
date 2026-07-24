/**
 * GET /api/analytics — cross-site usage for pris.la, from PostHog.
 *
 * Exists so scheduled/automated runs (digest routines, cloud agents, another
 * machine, a phone) can read analytics WITHOUT a copy of the PostHog personal
 * API key. That key stays server-side in Vercel env; callers present a single
 * low-privilege bearer token instead.
 *
 * Auth:   Authorization: Bearer <ANALYTICS_TOKEN>
 *         (header, not a query string — tokens in URLs leak into access logs)
 *
 * Query:  ?days=30           window (default 30, max 365)
 *         ?funnel=1          Type Me funnel breakdown
 *         ?sql=<HogQL>       arbitrary read-only HogQL
 *
 * Env:    ANALYTICS_TOKEN, POSTHOG_PERSONAL_API_KEY, POSTHOG_HOST (optional)
 */
const crypto = require("crypto");

const HOST = (process.env.POSTHOG_HOST || "https://us.posthog.com").replace(/\/$/, "");

function authorized(req) {
  const expected = process.env.ANALYTICS_TOKEN;
  if (!expected) return false;
  const header = req.headers.authorization || "";
  const got = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  // Length check first: timingSafeEqual throws on mismatched lengths.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function buildQuery({ days, funnel, sql }) {
  if (sql) return sql;
  if (funnel) {
    return `
      SELECT event, count() AS events, uniq(person_id) AS people
      FROM events
      WHERE timestamp > now() - INTERVAL ${days} DAY
        AND properties.site = 'typeme'
        AND event IN ('$pageview','link_created','rate_started','friend_rated',
                      'result_viewed','link_copied','link_shared')
      GROUP BY event ORDER BY events DESC`;
  }
  return `
    SELECT
      coalesce(nullif(properties.site, ''), 'unknown') AS site,
      countIf(event = '$pageview') AS pageviews,
      uniq(person_id) AS visitors,
      count() AS total_events
    FROM events
    WHERE timestamp > now() - INTERVAL ${days} DAY
    GROUP BY site ORDER BY pageviews DESC`;
}

module.exports = async function handler(req, res) {
  if (!authorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "POSTHOG_PERSONAL_API_KEY not configured" });
  }

  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const sql = typeof req.query.sql === "string" ? req.query.sql : null;
  const query = buildQuery({ days, funnel: !!req.query.funnel, sql });

  try {
    // "@current" resolves to the key's own project, so no project id is needed
    // and the key can stay scoped to just query:read.
    const r = await fetch(`${HOST}/api/projects/@current/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: "PostHog query failed", detail: data });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      days,
      columns: data.columns || [],
      results: data.results || [],
    });
  } catch (err) {
    console.error("analytics:", err);
    return res.status(500).json({ error: "Query failed" });
  }
};
