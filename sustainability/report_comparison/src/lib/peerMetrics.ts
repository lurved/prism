/**
 * Peer / bank metric → MetricValue adapter.
 *
 * Brings the banks + electricity-utility datasets (the flat PeerCompany model)
 * onto the SAME per-figure provenance the main comparison uses, so every figure
 * on those pages carries a status + citation and renders through <CitedValue>,
 * instead of being a bare, unsourced number.
 *
 * Mirrors buildMetricValue() in lib/metrics.ts exactly:
 *   value === null                              → "unverified" (N/D), citation null.
 *   value !== null, page recorded for metricId   → "confirmed" (page-verified).
 *   value !== null, no page recorded             → "reported" (document-cited only).
 * "confirmed" is earned, not assumed — passing a metricId with no matching
 * citationPages entry still yields "reported".
 */
import type { PeerCompany } from "@/data/peerData";
import type { Citation, MetricValue } from "@/data/types";

export function peerCitation(c: PeerCompany, metricId?: string): Citation {
  const page = metricId !== undefined ? c.citationPages?.[metricId] ?? null : null;
  return {
    reportName: c.dataSource.reportTitle,
    reportUrl: c.dataSource.url,
    page,
    publishedDate: null,
    extractedDate: c.dataSource.accessDate, // human month, e.g. "June 2026"
  };
}

export function peerMetricValue(
  c: PeerCompany,
  value: number | null,
  unit: string,
  notes?: string,
  metricId?: string,
): MetricValue {
  if (value === null) {
    return { value: null, unit, fiscalYear: c.reportingPeriod, status: "unverified", citation: null, notes };
  }
  const pageRecorded = metricId !== undefined && typeof c.citationPages?.[metricId] === "number";
  return {
    value,
    unit,
    fiscalYear: c.reportingPeriod,
    status: pageRecorded ? "confirmed" : "reported",
    citation: peerCitation(c, metricId),
    notes,
  };
}
