/* pris.la — first-party analytics via PostHog (US cloud).
 *
 * Loaded on every static page (home, about, Type Me, sustainability). The ESG
 * Next.js app inits PostHog separately in its own layout, but with the SAME
 * project key and the same `site` convention, so all of pris.la lands in one
 * place and can be compared site-by-site.
 *
 * Every event carries a `site` super-property — "home" | "typeme" | "esg" |
 * "sustainability" — which is what makes "analyse usage across all my sites"
 * answerable in one query. Custom funnel events go through window.track(...).
 */
!(function (t, e) {
  var o, n, p, r;
  e.__SV ||
    ((window.posthog = e),
    (e._i = []),
    (e.init = function (i, s, a) {
      function g(t, e) {
        var o = e.split(".");
        2 == o.length && ((t = t[o[0]]), (e = o[1])),
          (t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          });
      }
      ((p = t.createElement("script")).type = "text/javascript"),
        (p.crossOrigin = "anonymous"),
        (p.async = !0),
        (p.src =
          s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") +
          "/static/array.js"),
        (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r);
      var u = e;
      for (
        void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
          u.people = u.people || [],
          u.toString = function (t) {
            var e = "posthog";
            return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e;
          },
          u.people.toString = function () {
            return u.toString(1) + ".people (stub)";
          },
          o =
            "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(
              " "
            ),
          n = 0;
        n < o.length;
        n++
      )
        g(u, o[n]);
      e._i.push([i, s, a]);
    }),
    (e.__SV = 1));
})(document, window.posthog || []);

(function () {
  // Don't pollute production analytics with local development traffic. Define a
  // no-op window.track so app code can call it unconditionally either way.
  var isLocal = ["localhost", "127.0.0.1", ""].indexOf(location.hostname) !== -1;
  if (isLocal) {
    window.track = function () {};
    return;
  }

  // Which pris.la site is this page part of? Derived from the URL path so the
  // one shared file works everywhere without per-page config.
  var path = location.pathname;
  var site =
    path.indexOf("/typeme") === 0
      ? "typeme"
      : path.indexOf("/sustainability") === 0
      ? "sustainability"
      : "home";

  window.posthog.init("phc_wF3AaVMjv2FpfSGQDzQpA8PFyyMZxGWygkSBJFuXbWnz", {
    api_host: "https://us.i.posthog.com",
    // 2025 defaults: SPA-aware pageviews (history changes), pageleave, and
    // identified_only person profiles — keeps the free-tier profile count low.
    defaults: "2025-05-24",
    autocapture: true,
    persistence: "localStorage+cookie",
  });

  // Tag every event (autocaptured or custom) with its site.
  window.posthog.register({ site: site });

  // Helper for explicit funnel/product events. Safe even if PostHog is slow to
  // load — the stub queues calls until array.js arrives.
  window.track = function (event, props) {
    try {
      window.posthog.capture(event, Object.assign({ site: site }, props || {}));
    } catch (e) {}
  };
})();
