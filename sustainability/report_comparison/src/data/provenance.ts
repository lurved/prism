/**
 * Shared provenance vocabulary — ONE definition of the confidence tiers.
 *
 * Before this file, the utilities model (types.ts) and the healthcare model
 * (healthcareData.ts) each defined their own status enum, and they disagreed:
 * one forbade "estimated", the other shipped it. Same word, different meaning
 * per vertical. That is exactly the contract drift the audit flagged.
 *
 * Now every vertical derives its allowed statuses from this single superset:
 *   - Company / MetricValue (types.ts):  MetricStatus  — no "estimated"
 *   - Healthcare / SourceFlag:           SourceFlag    — no "reported"
 */
export type ProvenanceTier = "confirmed" | "reported" | "estimated" | "unverified";

/** Utilities / banks / infra: estimates are never entered, so no "estimated". */
export type MetricStatus = Exclude<ProvenanceTier, "estimated">;

/** Healthcare: carries a quarantined "estimated" tier; has no "reported". */
export type SourceFlag = Exclude<ProvenanceTier, "reported">;

/** Presentation metadata for every tier (human label + icon). Single source. */
export const TIER_META: Record<ProvenanceTier, { label: string; icon: string }> = {
  confirmed: { label: "Confirmed", icon: "✅" },
  reported: { label: "Reported", icon: "•" },
  estimated: { label: "Estimated", icon: "⚠️" },
  unverified: { label: "Unverified", icon: "❌" },
};
