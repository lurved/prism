"use client";

/**
 * CSV / JSON export (§6). Generated entirely client-side (Blob + download).
 *
 * - JSON: the full MetricSeries[] structure incl. citations and status flags.
 * - CSV: one row per company × metric × fiscal year. `N/D` (value === null)
 *   exports as an EMPTY cell, never 0. No derived/aggregated rows — every
 *   number round-trips to a MetricValue in the data file.
 */
import { useState } from "react";
import type { Company } from "@/data/types";
import { buildMetricSeries } from "@/lib/metrics";

const DISCLAIMER = "Values are as reported by companies; no estimation or interpolation applied. N/D = not disclosed (empty cell).";

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function toCSV(companies: Company[]): string {
  const series = buildMetricSeries(companies);
  const header = [
    "company", "metric", "fiscal_year", "value", "unit", "status",
    "report_name", "report_page", "published_date", "extracted_date", "notes",
  ];
  const lines: string[] = [];
  lines.push(`# ${DISCLAIMER}`);
  lines.push(header.join(","));
  for (const s of series) {
    for (const mv of s.values) {
      const row = [
        s.companyName,
        s.metricLabel,
        mv.fiscalYear,
        mv.value === null ? "" : String(mv.value), // N/D → empty, never 0
        mv.unit,
        mv.status,
        mv.citation?.reportName ?? "",
        mv.citation?.page != null ? String(mv.citation.page) : "",
        mv.citation?.publishedDate ?? "",
        mv.citation?.extractedDate ?? "",
        mv.notes ?? "",
      ];
      lines.push(row.map((c) => csvEscape(c)).join(","));
    }
  }
  return lines.join("\n");
}

function toJSON(companies: Company[]): string {
  return JSON.stringify(
    {
      _README: DISCLAIMER,
      generatedAt: new Date().toISOString(),
      series: buildMetricSeries(companies),
    },
    null,
    2,
  );
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ companies }: { companies: Company[] }) {
  const [done, setDone] = useState<"csv" | "json" | null>(null);

  const flash = (kind: "csv" | "json") => {
    setDone(kind);
    setTimeout(() => setDone(null), 1600);
  };

  const btn =
    "inline-flex items-center gap-2 font-mono font-semibold text-[11px] tracking-[0.06em] uppercase px-[14px] py-[9px] rounded-full border border-hairline bg-card text-ink2 hover:bg-[#F4F0E6] transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        className={btn}
        onClick={() => { download("esg-comparison.csv", toCSV(companies), "text/csv;charset=utf-8"); flash("csv"); }}
      >
        {done === "csv" ? "✓ Downloaded" : "↓ Download CSV"}
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => { download("esg-comparison.json", toJSON(companies), "application/json"); flash("json"); }}
      >
        {done === "json" ? "✓ Downloaded" : "↓ Download JSON"}
      </button>
      <span className="font-sans text-[11px] text-muted2 max-w-[42ch]">
        As reported — no estimation or interpolation. N/D exports as an empty cell.
      </span>
    </div>
  );
}
