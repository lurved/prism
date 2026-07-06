export type Sector = "Energy" | "Grid/Infrastructure" | "Telecom" | "Transport";

export type ReportingFramework = "GRI" | "IFRS S2" | "TCFD" | "SASB" | "UN SDGs" | "SGX Core ESG";

/* ═══════════════════════════════════════════════════════════════════════
   CITED-VALUE MODEL (v2)
   Guiding principle: no value is ever interpolated, estimated, or inferred.
   Missing data is `value: null` and renders as "N/D" — never 0, never a fill.
   Every displayed figure carries a Citation, or is flagged "unverified".
═══════════════════════════════════════════════════════════════════════ */

export interface Citation {
  reportName: string;             // e.g. "Singtel Group Sustainability Report 2025"
  reportUrl?: string;             // link to the source report if public
  page: number | null;            // null = page reference not recorded (never guessed)
  /**
   * ISO date the report was published, or null when the exact publication
   * date is not stated in the source. Deliberately nullable: per the guiding
   * principle we do not invent a date to satisfy a non-null type.
   */
  publishedDate: string | null;
  extractedDate: string;          // when the extraction pipeline last verified this figure
}

export interface MetricValue {
  value: number | null;           // null = N/D (render "N/D", never 0)
  unit: string;
  fiscalYear: string;             // e.g. "FY2024/25"
  status: "confirmed" | "unverified"; // no "estimated" — estimates are not allowed
  citation: Citation | null;      // null when there is nothing to cite (N/D)
  notes?: string;                 // caveats, e.g. "includes Category 15"
}

export interface MetricSeries {
  metricId: string;
  metricLabel: string;
  category: "Environmental" | "Social" | "Governance";
  companyId: string;
  companyName: string;
  comparable: boolean;            // drives best-performer badge eligibility
  values: MetricValue[];          // one per fiscal year, newest last
}

/**
 * null = metric exists in report category but exact figure not publicly disclosed
 *        or was not successfully extracted from source document.
 * Consumers should display "N/D" (Not Disclosed) for null values.
 */
export interface EnvironmentalMetrics {
  scope1Emissions: number;          // tCO2e (thousands = ktCO2e)
  scope2Emissions: number;          // tCO2e (thousands), market-based where available
  scope3Emissions: number | null;   // tCO2e (thousands), null if not disclosed
  scope3Cat15Emissions: number | null; // tCO2e (thousands) — Category 15 (investments),
                                       // null unless the report breaks it out with a citable figure.
                                       // Enables the "Excl. Category 15" Scope 3 view.
  ghgIntensityValue: number;        // numeric value of GHG/energy intensity
  ghgIntensityUnit: string;         // unit label, e.g. "tCO2e/MWh", "tCO2e/TB"
  renewableEnergyPct: number | null; // % of electricity from renewables; null if not applicable/disclosed
  renewableCapacityGW: number | null; // gross installed renewable capacity in GW; null if not applicable
  netZeroTargetYear: number;
  scope1and2ReductionPct: number | null; // % reduction Scope 1+2 vs stated baseline year; null if not extracted
  waterConsumptionM3: number | null;  // total potable water use in m³; null if not disclosed
}

export interface SocialMetrics {
  trainingHoursPerEmployee: number;
  femaleBoardPct: number;            // % female directors on board
  femaleLeadershipPct: number | null; // % female in senior management/executive roles; null if not disclosed
  totalHeadcount: number;
  employeeEngagementScore: number | null; // % or index; null if not disclosed
  lostTimeInjuryRate: number | null; // per million man-hours worked (employees); null if reported on a non-comparable basis
  lostTimeInjuryRateNote: string;    // clarification of metric used
  communityInvestmentSGDm: number;   // SGD millions
}

export interface GovernanceMetrics {
  reportingFrameworks: ReportingFramework[];
  externalAssurance: boolean;
  externalAssuranceProvider: string | null;
  independentDirectorsPct: number | null; // %; null if not confirmed
  esgLinkedExecutiveComp: boolean | null; // null = not confirmed in extracted data
  antiCorruptionTrainingPct: number | null; // % employees trained; null if not disclosed
}

export interface YearlyEmissions {
  year: string;
  scope1: number;   // ktCO2e
  scope2: number;   // ktCO2e, market-based where available
  scope3: number | null; // ktCO2e
}

export interface DataSource {
  reportTitle: string;
  reportingPeriod: string;
  url: string;
  accessDate: string;         // human-readable extraction date, e.g. "June 2026"
  extractedDateISO: string;   // ISO form of accessDate for stamps/export, e.g. "2026-06"
  publishedDate?: string | null; // ISO date the report was published, null if not stated
}

export interface Company {
  id: string;
  name: string;
  shortName: string;
  sector: Sector;
  logoInitials: string;
  accentColor: string;
  reportingPeriod: string;
  baselineYear: string;
  baselineScope1and2ktCO2e: number | null; // confirmed baseline for reduction calculations
  strategy: string;
  prioritySDGs: string[];
  dataSource: DataSource;
  environmental: EnvironmentalMetrics;
  social: SocialMetrics;
  governance: GovernanceMetrics;
  historicalEmissions: YearlyEmissions[];
  dataNotes: string[]; // important caveats about data quality or scope changes
  /**
   * Known page references in the source report, keyed by metricId (see lib/metrics.ts).
   * Only populated where a page was actually recorded during extraction — never guessed.
   */
  citationPages?: Record<string, number>;
}
