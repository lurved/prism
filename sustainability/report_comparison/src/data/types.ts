export type Sector = "Energy" | "Grid/Infrastructure" | "Telecom";

export type ReportingFramework = "GRI" | "IFRS S2" | "TCFD" | "SASB" | "UN SDGs" | "SGX Core ESG";

/**
 * null = metric exists in report category but exact figure not publicly disclosed
 *        or was not successfully extracted from source document.
 * Consumers should display "N/D" (Not Disclosed) for null values.
 */
export interface EnvironmentalMetrics {
  scope1Emissions: number;          // tCO2e (thousands = ktCO2e)
  scope2Emissions: number;          // tCO2e (thousands), market-based where available
  scope3Emissions: number | null;   // tCO2e (thousands), null if not disclosed
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
  lostTimeInjuryRate: number;        // per million man-hours worked (employees)
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
  accessDate: string;
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
}
