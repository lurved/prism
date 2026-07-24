import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Analytics } from "@vercel/analytics/react";

// First-party analytics — load the SAME shared snippet as the rest of pris.la
// (/analytics.js at the repo root, served from the domain root) rather than a
// second, hand-inlined copy that drifts out of sync. analytics.js derives
// `site` from the URL path, so pages under /sustainability/report_comparison
// register site="esg" automatically.
//
// NOTE: this must be loaded in a way that survives `output: "export"`. An inline
// `next/script` with strategy="afterInteractive" is NOT emitted into the static
// HTML export (it only appeared in .next/server output), which is why the ESG
// tracker was effectively uninstrumented in production. A "beforeInteractive"
// external script IS injected into the exported HTML.

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
        {/* Domain-root path (unaffected by basePath); served at pris.la/analytics.js. */}
        <Script src="/analytics.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
