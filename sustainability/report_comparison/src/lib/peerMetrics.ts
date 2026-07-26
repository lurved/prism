/**
 * Peer / bank metric → MetricValue adapter.
 *
 * Brings the banks + electricity-utility datasets (the flat PeerCompany model)
 * onto the SAME per-figure provenance the main comparison uses, so every figure
 * on those pages carries a status + citation and renders through <CitedValue>,
 * instead of being a bare, unsourced number.
 *
 * Peer datasets record no page-level citations, so a disclosed value is
 * "reported" (document-cited) and a null is "unverified" (N/D) — never
 * "confirmed". That mirrors buildMetricValue() in lib/metrics.ts exactly.
 */
import type { PeerCompany } from "@/data/peerData";
import type { Citation, MetricValue } from "@/data/types";

export function peerCitation(c: PeerCompany): Citation {
  return {
    reportName: c.dataSource.reportTitle,
    reportUrl: c.dataSource.url,
    page: null, // peer datasets record no page-level citations
    publishedDate: null,
    extractedDate: c.dataSource.accessDate, // human month, e.g. "June 2026"
  };
}

export function peerMetricValue(
  c: PeerCompany,
  value: number | null,
  unit: string,
  notes?: string,
): MetricValue {
  if (value === null) {
    return { value: null, unit, fiscalYear: c.reportingPeriod, status: "unverified", citation: null, notes };
  }
  return { value, unit, fiscalYear: c.reportingPeriod, status: "reported", citation: peerCitation(c), notes };
}
