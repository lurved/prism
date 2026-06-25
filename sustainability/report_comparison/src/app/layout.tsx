import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Analytics } from "@vercel/analytics/react";

// First-party analytics — same PostHog project + `site` convention as the rest
// of pris.la (see /analytics.js at the repo root), so this tracker shows up as
// site="esg" alongside home / typeme in one place.
const POSTHOG_SNIPPET = `
!(function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)})(document,window.posthog||[]);
if(["localhost","127.0.0.1"].indexOf(location.hostname)===-1){posthog.init("phc_wF3AaVMjv2FpfSGQDzQpA8PFyyMZxGWygkSBJFuXbWnz",{api_host:"https://us.i.posthog.com",defaults:"2025-05-24",autocapture:true,persistence:"localStorage+cookie"});posthog.register({site:"esg"});}
`;

export const metadata: Metadata = {
  title: "ESG Tracker",
  description: "Compare sustainability metrics across Temasek portfolio companies: Sembcorp, SMRT, and Singtel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink min-h-screen">
        <Header />
        <main>{children}</main>
        <Analytics />
        <Script id="posthog" strategy="afterInteractive">
          {POSTHOG_SNIPPET}
        </Script>
      </body>
    </html>
  );
}
