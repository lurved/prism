/**
 * Canonical metric model (v2).
 *
 * ONE source of truth for every quantitative metric shown on the comparison
 * page. The matrix, the CSV/JSON export, and the citation popovers all read
 * from here, so a figure can never diverge between what is displayed and what
 * is exported.
 *
 * Guiding principle: no value is interpolated, estimated, or inferred.
 *   value === null  →  "N/D", status "unverified", citation null.
 *   value !== null  →  status "confirmed", citation derived from the report.
 */
import type { Company, Citation, MetricValue, MetricSeries } from "@/data/types";
import { formatNumber } from "./utils";

export type MetricCategory = "Environmental" | "Social" | "Governance";

export interface MetricDef {
  metricId: string;
  label: string;
  sublabel?: string;
  category: MetricCategory;
  getRaw: (c: Company) => number | null;
  /** Unit label; may depend on the company (e.g. GHG-intensity units differ). */
  unit: string | ((c: Company) => string);
  /** Human display, only called for non-null values. */
  format: (v: number, c: Company) => string;
  lowerIsBetter: boolean;
  /**
   * Whether a "best performer" badge is eligible for this metric.
   * Per methodology, badges appear ONLY for metrics that are comparable
   * across sectors (§4). Everything else is `false`.
   */
  comparable: boolean;
  /** Optional per-company caveat surfaced in the popover / export notes. */
  notes?: (c: Company) => string | undefined;
}

/* ── Formatters ──────────────────────────────────────────────────── */
export function fmtEmissions(ktCO2e: number): string {
  if (ktCO2e >= 1_000) return `${(ktCO2e / 1_000).toFixed(1)}M tCO₂e`;
  if (ktCO2e >= 1) return `${ktCO2e.toFixed(1)}k tCO₂e`;
  return `${(ktCO2e * 1000).toFixed(0)} tCO₂e`;
}

/* ── Metric definitions (quantitative rows, in matrix order) ──────── */
export const METRIC_DEFS: MetricDef[] = [
  // ── Environmental ──────────────────────────────────────────────
  {
    metricId: "scope1",
    label: "Scope 1 Emissions",
    sublabel: "Direct GHG",
    category: "Environmental",
    getRaw: (c) => c.environmental.scope1Emissions,
    unit: "ktCO₂e",
    format: fmtEmissions,
    lowerIsBetter: true,
    comparable: false, // absolute emissions not comparable across sectors
  },
  {
    metricId: "scope2",
    label: "Scope 2 Emissions",
    sublabel: "Market-based",
    category: "Environmental",
    getRaw: (c) => c.environmental.scope2Emissions,
    unit: "ktCO₂e",
    format: fmtEmissions,
    lowerIsBetter: true,
    comparable: false,
  },
  {
    metricId: "scope3",
    label: "Scope 3 Emissions",
    sublabel: "Indirect GHG",
    category: "Environmental",
    getRaw: (c) => c.environmental.scope3Emissions,
    unit: "ktCO₂e",
    format: fmtEmissions,
    lowerIsBetter: true,
    comparable: false,
    notes: (c) =>
      c.environmental.scope3Cat15Emissions !== null
        ? "Includes Category 15 (investments)"
        : undefined,
  },
  {
    metricId: "scope3Cat15",
    label: "Scope 3 — Cat 15",
    sublabel: "Investments (of which)",
    category: "Environmental",
    getRaw: (c) => c.environmental.scope3Cat15Emissions,
    unit: "ktCO₂e",
    format: fmtEmissions,
    lowerIsBetter: true,
    comparable: false,
    notes: () => "Subset of Scope 3; disclosed only where the report breaks it out",
  },
  {
    metricId: "ghgIntensity",
    label: "GHG Intensity",
    sublabel: "different units — not comparable",
    category: "Environmental",
    getRaw: (c) => c.environmental.ghgIntensityValue,
    unit: (c) => c.environmental.ghgIntensityUnit,
    format: (v, c) => `${v} ${c.environmental.ghgIntensityUnit}`,
    lowerIsBetter: true,
    comparable: false, // denominators differ (per-MWh / per-revenue / per-TB)
  },
  {
    metricId: "renewableCapacity",
    label: "Renewable Capacity",
    sublabel: "GW installed",
    category: "Environmental",
    getRaw: (c) => c.environmental.renewableCapacityGW,
    unit: "GW",
    format: (v) => `${v} GW`,
    lowerIsBetter: false,
    comparable: false, // only meaningful for a power generator
  },
  {
    metricId: "renewableEnergyPct",
    label: "Renewable Energy %",
    sublabel: "% of electricity",
    category: "Environmental",
    getRaw: (c) => c.environmental.renewableEnergyPct,
    unit: "%",
    format: (v) => `${v}%`,
    lowerIsBetter: false,
    comparable: true, // comparable share metric (flag if definitions differ)
  },
  {
    metricId: "netZeroTarget",
    label: "Net-Zero Target",
    sublabel: "Year (Scope 1+2)",
    category: "Environmental",
    getRaw: (c) => c.environmental.netZeroTargetYear,
    unit: "year",
    format: (v) => String(v),
    lowerIsBetter: true,
    comparable: false,
  },
  {
    metricId: "s1s2Reduction",
    label: "S1+S2 Reduction",
    sublabel: "vs. baseline year",
    category: "Environmental",
    getRaw: (c) => c.environmental.scope1and2ReductionPct,
    unit: "%",
    format: (v) => `${v.toFixed(1)}%`,
    lowerIsBetter: false,
    comparable: false, // different baseline years & scopes
  },
  {
    metricId: "waterConsumption",
    label: "Water Consumption",
    sublabel: "Potable (m³)",
    category: "Environmental",
    getRaw: (c) => c.environmental.waterConsumptionM3,
    unit: "m³",
    format: (v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M m³` : `${formatNumber(v)} m³`),
    lowerIsBetter: true,
    comparable: false,
  },
  // ── Social ────────────────────────────────────────────────────
  {
    metricId: "trainingHours",
    label: "Training Hrs/Employee",
    sublabel: "Per year",
    category: "Social",
    getRaw: (c) => c.social.trainingHoursPerEmployee,
    unit: "hrs",
    format: (v) => `${v} hrs`,
    lowerIsBetter: false,
    comparable: true, // GRI 404-1 average learning hours — broadly comparable
  },
  {
    metricId: "femaleBoard",
    label: "Female Board %",
    sublabel: "Board diversity",
    category: "Social",
    getRaw: (c) => c.social.femaleBoardPct,
    unit: "%",
    format: (v) => `${v}%`,
    lowerIsBetter: false,
    comparable: true, // board gender diversity — comparable across sectors
  },
  {
    metricId: "femaleLeadership",
    label: "Female Leadership %",
    sublabel: "Senior mgmt",
    category: "Social",
    getRaw: (c) => c.social.femaleLeadershipPct,
    unit: "%",
    format: (v) => `${v}%`,
    lowerIsBetter: false,
    comparable: false, // "senior management" definitions vary by company
  },
  {
    metricId: "headcount",
    label: "Total Headcount",
    sublabel: "Employees",
    category: "Social",
    getRaw: (c) => c.social.totalHeadcount,
    unit: "employees",
    format: (v) => formatNumber(v),
    lowerIsBetter: false,
    comparable: false, // scale/geography differ greatly
  },
  {
    metricId: "employeeEngagement",
    label: "Employee Engagement",
    sublabel: "Score / %",
    category: "Social",
    getRaw: (c) => c.social.employeeEngagementScore,
    unit: "%",
    format: (v) => `${v}%`,
    lowerIsBetter: false,
    comparable: false,
  },
  {
    metricId: "injuryRate",
    label: "Injury Rate (LTIR)",
    sublabel: "Per million hrs",
    category: "Social",
    getRaw: (c) => c.social.lostTimeInjuryRate,
    unit: "per million hrs",
    format: (v) => v.toFixed(2),
    lowerIsBetter: true,
    comparable: false, // reporting bases differ (sector-specific safety metric)
    notes: (c) => c.social.lostTimeInjuryRateNote || undefined,
  },
  {
    metricId: "communityInvestment",
    label: "Community Investment",
    sublabel: "SGD millions",
    category: "Social",
    getRaw: (c) => c.social.communityInvestmentSGDm,
    unit: "SGD m",
    format: (v) => `S$${v.toFixed(1)}M`,
    lowerIsBetter: false,
    comparable: false, // different group boundaries & currencies
  },
  // ── Governance ───────────────────────────────────────────────
  {
    metricId: "independentDirectors",
    label: "Independent Directors",
    sublabel: "% of board",
    category: "Governance",
    getRaw: (c) => c.governance.independentDirectorsPct,
    unit: "%",
    format: (v) => `${v.toFixed(0)}%`,
    lowerIsBetter: false,
    comparable: false, // basis of "independent" varies by jurisdiction
  },
  {
    metricId: "antiCorruptionTraining",
    label: "Anti-Corruption Training",
    sublabel: "% employees trained",
    category: "Governance",
    getRaw: (c) => c.governance.antiCorruptionTrainingPct,
    unit: "%",
    format: (v) => `${v}%`,
    lowerIsBetter: false,
    comparable: false,
  },
];

/* ── Citation + MetricValue builders ──────────────────────────────── */

export function reportCitation(c: Company, metricId: string): Citation {
  return {
    reportName: c.dataSource.reportTitle,
    reportUrl: c.dataSource.url,
    page: c.citationPages?.[metricId] ?? null,
    publishedDate: c.dataSource.publishedDate ?? null,
    extractedDate: c.dataSource.extractedDateISO,
  };
}

export function buildMetricValue(c: Company, def: MetricDef): MetricValue {
  const value = def.getRaw(c);
  const unit = typeof def.unit === "function" ? def.unit(c) : def.unit;
  const notes = def.notes?.(c);
  if (value === null) {
    // Nothing to cite — never a substituted number, never a guessed citation.
    return { value: null, unit, fiscalYear: c.reportingPeriod, status: "unverified", citation: null, notes };
  }
  return {
    value,
    unit,
    fiscalYear: c.reportingPeriod,
    status: "confirmed",
    citation: reportCitation(c, def.metricId),
    notes,
  };
}

/** Full MetricSeries[] for export (§6) — one entry per company × metric. */
export function buildMetricSeries(companies: Company[]): MetricSeries[] {
  const out: MetricSeries[] = [];
  for (const def of METRIC_DEFS) {
    for (const c of companies) {
      out.push({
        metricId: def.metricId,
        metricLabel: def.label,
        category: def.category,
        companyId: c.id,
        companyName: c.name,
        comparable: def.comparable,
        values: [buildMetricValue(c, def)],
      });
    }
  }
  return out;
}
