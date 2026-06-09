export type Sector = "Energy" | "Grid/Infrastructure" | "Telecom";

export type ReportingFramework = "GRI" | "IFRS S2" | "TCFD" | "SASB" | "UN SDGs";

export interface EnvironmentalMetrics {
  scope1Emissions: number;       // tCO2e (thousands)
  scope2Emissions: number;       // tCO2e (thousands)
  scope3Emissions: number | null; // tCO2e (thousands), null if not reported
  energyIntensity: number;       // GJ per S$M revenue
  renewableEnergyPct: number;    // %
  netZeroTargetYear: number;
  carbonReductionVsBaseline: number; // % reduction vs baseline year
  waterConsumption: number;      // million m³
}

export interface SocialMetrics {
  trainingHoursPerEmployee: number;
  femaleBoardPct: number;         // %
  femaleLeadershipPct: number;    // %
  totalHeadcount: number;
  employeeEngagementScore: number; // % or index score
  lostTimeInjuryRate: number;     // per million hours
  communityInvestmentSGDm: number; // SGD millions
}

export interface GovernanceMetrics {
  reportingFrameworks: ReportingFramework[];
  externalAssurance: boolean;
  independentDirectorsPct: number; // %
  esgLinkedExecutiveComp: boolean;
  antiCorruptionTrainingPct: number; // % employees trained
}

export interface YearlyEmissions {
  year: string;
  scope1: number;
  scope2: number;
  scope3: number | null;
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
  strategy: string;
  prioritySDGs: string[];
  environmental: EnvironmentalMetrics;
  social: SocialMetrics;
  governance: GovernanceMetrics;
  historicalEmissions: YearlyEmissions[];
}
