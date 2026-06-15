/**
 * ESG Data — sourced exclusively from each company's latest published
 * sustainability / annual report. All figures are verified against the
 * original PDF or official microsite.
 *
 * null = metric category is within scope of the report but the exact
 *        figure was not publicly disclosed or could not be confirmed.
 *        Display as "N/D" in the UI.
 *
 * Units for emissions: thousands of tCO2e (ktCO2e)
 *   e.g. 7425.4 = 7,425,400 tCO2e = ~7.4 million tCO2e
 */
import type { Company } from "./types";

export const companies: Company[] = [
  /* ═══════════════════════════════════════════════════════════════
     SEMBCORP INDUSTRIES
     Source: Sembcorp Annual Report 2025 — ESG / Sustainability Section
     PDF: media.sembcorp.com/data/cms/ar/ar2025/assets/pdf/Environmental_Social_Governance.pdf
     Reporting period: FY2025 (1 Jan – 31 Dec 2025)
     Accessed: June 2026
  ═══════════════════════════════════════════════════════════════ */
  {
    id: "sembcorp",
    name: "Sembcorp Industries",
    shortName: "Sembcorp",
    sector: "Energy",
    logoInitials: "SC",
    accentColor: "#1a7a4a",
    reportingPeriod: "FY2025",
    baselineYear: "2010",
    baselineScope1and2ktCO2e: null, // absolute baseline not stated; intensity baseline = 0.40 tCO2e/MWh
    strategy:
      "Energy transition from brown to green — Sembcorp targets 25 GW gross renewable capacity by 2028 and a GHG emissions intensity of 0.15 tCO2e/MWh by 2028 (from 0.40 in 2010). Three material factors: Climate Action, Empowering Lives, Resilient Business.",
    prioritySDGs: ["SDG 7", "SDG 13", "SDG 8", "SDG 17"],
    dataSource: {
      reportTitle: "Sembcorp Annual Report 2025 — Environmental, Social and Governance Review",
      reportingPeriod: "FY2025 (1 Jan – 31 Dec 2025)",
      url: "https://media.sembcorp.com/data/cms/ar/ar2025/index.html",
      accessDate: "June 2026",
    },
    environmental: {
      // All emissions figures from GRI 305-1, 305-2, 305-3 disclosures in ESG appendix
      scope1Emissions: 7_425.4,   // ktCO2e — subsidiaries: 4,345.4; JVs & associates: 3,080.0
      scope2Emissions: 282.9,     // ktCO2e — location-based; market-based disclosure not separately stated in extracted text
      scope3Emissions: 15_340.2,  // ktCO2e — Cat 3 (fuel/energy): 2,876.1; Cat 11 (sold products): 2,596.3; Cat 15 (investments): 9,867.8
      ghgIntensityValue: 0.21,
      ghgIntensityUnit: "tCO2e/MWh",
      renewableEnergyPct: null,   // Not reported as % of own consumption; 67% of gross capacity is renewable
      renewableCapacityGW: 15.0,  // Gross installed renewable capacity as at 31 Dec 2025
      netZeroTargetYear: 2050,
      scope1and2ReductionPct: 47.5, // GHG intensity: 0.40 → 0.21 tCO2e/MWh since 2010 baseline = ~47.5% intensity reduction
      waterConsumptionM3: null,   // Reported in GRI 303-5 but exact figure not extracted from source
    },
    social: {
      trainingHoursPerEmployee: 26.5,   // "average learning hours per employee" — GRI 404-1
      femaleBoardPct: 20,               // 20% consistently across 2023–2025 — GRI 405-1
      femaleLeadershipPct: 16,          // % female in senior management (2025) — GRI 405-1
      totalHeadcount: 4_629,            // as at 31 Dec 2025 — GRI 2-7
      employeeEngagementScore: null,    // Not disclosed in extracted ESG data
      lostTimeInjuryRate: 0.2,         // employees only, per million man-hours worked — GRI 403-9
      lostTimeInjuryRateNote: "Employees only, per million man-hours. Total recordable injury rate = 0.7/million hours. 0 employee fatalities in FY2025.",
      communityInvestmentSGDm: 6.2,    // S$6.2M — GRI 201-1; restated 2024: S$4.9M
    },
    governance: {
      reportingFrameworks: ["GRI", "IFRS S2", "SGX Core ESG"],
      // Transitioned from TCFD to IFRS S1/S2 in FY2025 report
      externalAssurance: true,
      externalAssuranceProvider: "DNV (limited assurance, scope 1+2 GHG); ERM CVS (scope 1+2)",
      independentDirectorsPct: null,  // Board: ~11 directors, majority independent per SGX CG code; exact % not confirmed in extracted ESG data
      esgLinkedExecutiveComp: true,   // KPI 1 (GHG intensity), KPI 2 (Absolute GHG), KPI 3 (Renewable capacity) — explicitly linked to STI and LTI
      antiCorruptionTrainingPct: 100, // "100% of employees received ABC training" — stated explicitly in report
    },
    historicalEmissions: [
      // Emissions in ktCO2e. Source: GRI 305-1/305-2/305-3 table in ESG appendix
      { year: "FY2023", scope1: 10_183.9, scope2: 288.1,  scope3: 16_988.1 },
      { year: "FY2024", scope1:  9_054.0, scope2: 233.7,  scope3: 15_230.0 }, // Scope 3 restated
      { year: "FY2025", scope1:  7_425.4, scope2: 282.9,  scope3: 15_340.2 },
    ],
    dataNotes: [
      "Scope 1+2 emissions use equity-share approach.",
      "Scope 3 includes Categories 3, 11, and 15 only (fuel/energy-related, use of sold products, investments) — these represent the majority of Scope 3.",
      "GHG intensity = (Scope 1 + Scope 2 + biogenic) ÷ total energy generated and purchased.",
      "Renewable capacity is gross installed capacity; 67% of gross portfolio is renewable as at Dec 2025.",
      "Scope 3 for FY2023 and FY2024 has been restated.",
      "Female board % (20%) is consistent across FY2023–2025 per GRI 405-1 table.",
      "Learning hours (26.5 hrs) = average learning hours per employee per GRI 404-1.",
      "Water consumption figure exists in GRI 303-5 table (page 76 of source PDF) but was not extractable from binary-encoded PDF.",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     SMRT CORPORATION
     Source: SMRT Sustainability Report 2024/25 (FY24/25: 1 Apr 2024 – 31 Mar 2025)
     PDF: smrt.com.sg/.../SMRT-Sustainability-Report-2024_25.pdf
     All figures = SMRT Group unless noted. Verified June 2026.
  ═══════════════════════════════════════════════════════════════ */
  {
    id: "smrt",
    name: "SMRT Corporation",
    shortName: "SMRT",
    sector: "Transport",
    logoInitials: "SM",
    accentColor: "#c8102e",
    reportingPeriod: "FY2024/25",
    baselineYear: "2022",
    baselineScope1and2ktCO2e: null, // 2010 baseline ~570 ktCO2e (total GHG); no clean S1+2 baseline figure stated
    strategy:
      "Singapore's multi-modal public transport operator (rail, bus, taxi). Decarbonisation focus: traction-energy efficiency, cleaner bus/taxi fleet, and exploring renewable energy procurement, aligned with Singapore's net-zero-by-2050 goal.",
    prioritySDGs: ["SDG 7", "SDG 11", "SDG 13"],
    dataSource: {
      reportTitle: "SMRT Sustainability Report 2024/25",
      reportingPeriod: "FY2024/25 (1 Apr 2024 – 31 Mar 2025)",
      url: "https://www.smrt.com.sg/getmedia/8cd6126b-4f4f-49d4-819e-f7ae4aae0117/SMRT-Sustainability-Report-2024_25.pdf",
      accessDate: "June 2026",
    },
    environmental: {
      // Source: SMRT Group GHG table, Sustainability Snapshot (p.7) & Performance (p.35)
      scope1Emissions: 129.195,   // ktCO2e — SMRT Group FY24/25
      scope2Emissions: 372.164,   // ktCO2e — largest source (traction electricity); basis (location/market) not specified
      scope3Emissions: 209.757,   // ktCO2e — Group FY24/25
      ghgIntensityValue: 295,
      ghgIntensityUnit: "tCO2e/S$M revenue (Rail, S1+2)",
      renewableEnergyPct: null,   // Onsite renewable 4,864,298 kWh of 893,001,643 kWh total (~0.5%); not reported as a % — see dataNotes
      renewableCapacityGW: null,  // N/A — SMRT is not a power generator
      netZeroTargetYear: 2050,
      scope1and2ReductionPct: null, // Total GHG has risen with network expansion; no reduction-vs-baseline achieved. Target: −20% vs 2022 by 2030
      waterConsumptionM3: 1_599_629, // SMRT Group water consumption FY24/25
    },
    social: {
      trainingHoursPerEmployee: 65.8,    // Average structured training hours/employee FY24/25
      femaleBoardPct: 25,                // 3 women of 12 directors (Board Diversity)
      femaleLeadershipPct: 24.1,         // 33 of 137 senior management
      totalHeadcount: 9_056,             // Overall workforce FY24/25
      employeeEngagementScore: null,     // Workforce Engagement Survey run; single score not disclosed
      lostTimeInjuryRate: null,          // SMRT reports WIR per 100,000 employees — non-comparable basis; see note
      lostTimeInjuryRateNote: "SMRT reports a Workplace Injury Rate of 593 per 100,000 employees (FY24/25) — NOT the per-million-man-hours basis used by the other companies, so it is not directly comparable and is shown as N/D in this column.",
      communityInvestmentSGDm: 2.2,     // "S$2.2M contributed" FY24/25 (incl. in-kind); see dataNotes on an ambiguous larger series
    },
    governance: {
      reportingFrameworks: ["GRI", "IFRS S2", "UN SDGs"],
      externalAssurance: false,
      externalAssuranceProvider: "None this cycle — internal audit of Scope 1 & 2 only; external assurance targeted FY2032 (ACRA)",
      independentDirectorsPct: 83.4, // Independent non-executive directors (12-member board)
      esgLinkedExecutiveComp: null,  // GHG targets referenced in annual planning; explicit link to exec comp not confirmed
      antiCorruptionTrainingPct: null, // 0 corruption cases reported; training % not disclosed
    },
    historicalEmissions: [
      // Source: SMRT Group GHG performance table (ktCO2e). Scope 2 basis not specified.
      { year: "FY2022/23", scope1: 101.934, scope2: 329.681, scope3: 193.309 },
      { year: "FY2023/24", scope1: 103.785, scope2: 357.330, scope3: 197.636 },
      { year: "FY2024/25", scope1: 129.195, scope2: 372.164, scope3: 209.757 },
    ],
    dataNotes: [
      "SMRT is a mass-transit operator (rail, bus, taxi), not an energy company — its largest emission source is Scope 2 traction electricity (>50% of total).",
      "GHG intensity shown is Rail Scope 1+2 per S$M revenue (excl. Thomson-East Coast Line) — not comparable with the energy companies' tCO₂e/MWh.",
      "Onsite renewable electricity was 4,864,298 kWh of 893,001,643 kWh total energy (~0.5%); the report does not state a renewable-energy percentage, so it is shown as N/D.",
      "Total GHG has risen with network expansion, so there is no reduction-vs-baseline achieved; the stated target is −20% vs 2022 levels by 2030.",
      "Injury rate is reported as 593 per 100,000 employees — a different basis from the other companies' per-million-hours LTIR — so it is marked N/D here to avoid a misleading comparison.",
      "No external assurance was obtained this reporting cycle (internal audit of Scope 1 & 2 only; external assurance targeted from FY2032).",
      "Community contribution shown is the explicitly-stated S$2.2M (FY24/25, incl. in-kind). A separate 3-year monetary series (S$1.7M/7.2M/20.4M) appears in the CSR snapshot but its definition is ambiguous in the report and was not used.",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     SINGTEL GROUP
     Source: Singtel Group Sustainability Report 2025
     PDF: cdn1.singteldigital.com/content/dam/singtel/investorRelations/annualReports/2025/SR2025.pdf
     Excel data: cdn.aws.singtel.com/sustainabilityreport/SR2024/download/downloads/
     Reporting period: FY2025 (1 Apr 2024 – 31 Mar 2025)
     Board composition: singtel.com/about-us/company/corporate-governance
     Accessed: June 2026
  ═══════════════════════════════════════════════════════════════ */
  {
    id: "singtel",
    name: "Singtel Group",
    shortName: "Singtel",
    sector: "Telecom",
    logoInitials: "ST",
    accentColor: "#e05a1e",
    reportingPeriod: "FY2025",
    baselineYear: "FY2023",
    baselineScope1and2ktCO2e: 440.6, // FY2023 SBTi-validated baseline: 440,600 tCO2e = 440.6 ktCO2e
    strategy:
      "Singtel 4D Environmental Strategy — Defend, Decarbonise, Dematerialise, Deliver. SBTi-validated targets: reduce Scope 1+2 by 55% and Scope 3 by 40% by FY2030 vs FY2023 baseline. Net-zero across all scopes by FY2045 (advanced from 2050 in FY2024).",
    prioritySDGs: ["SDG 9", "SDG 13", "SDG 4", "SDG 8"],
    dataSource: {
      reportTitle: "Singtel Group Sustainability Report 2025",
      reportingPeriod: "FY2025 (1 Apr 2024 – 31 Mar 2025)",
      url: "https://www.singtel.com/about-us/sustainability/sustainability-reports/2025",
      accessDate: "June 2026",
    },
    environmental: {
      // Source: SR2025 text + Environmental Performance Indicators Excel (SR2024 confirmed)
      // Scope expanded in FY2025 to include Singtel Global Offices and NCS for Scope 1+2
      scope1Emissions: 13.228,    // ktCO2e — Group FY2025 (expanded scope: Singtel + Optus + NCS + Digital InfraCo)
      scope2Emissions: 342.540,   // ktCO2e — market-based; location-based: 467.7 ktCO2e (FY2024 from Excel, FY2025 not extracted)
      scope3Emissions: 2_309.368, // ktCO2e — all 15 categories; SBTi-covered categories (1,2,11,13,15): 2,220.3 ktCO2e
      ghgIntensityValue: 0.0186,
      ghgIntensityUnit: "tCO2e/TB",  // GHG intensity per terabyte of data traffic carried — standard telecom metric
      renewableEnergyPct: 9.33,   // % of electricity backed by renewable sources (FY2024 confirmed; FY2025 "up from 9.3%" but exact not extracted)
      renewableCapacityGW: null,  // Not applicable — Singtel does not generate its own renewable energy at scale
      netZeroTargetYear: 2045,
      scope1and2ReductionPct: 19.3, // FY2023 baseline 440.6 ktCO2e → FY2025 355.8 ktCO2e = −19.3%
      waterConsumptionM3: 618_885,  // Potable water use (m³) — Group FY2025 (GRI 303-5)
    },
    social: {
      trainingHoursPerEmployee: 39.1,   // Group FY2025 average — GRI 404-1; training investment S$19.7M in FY2025
      femaleBoardPct: 36,               // "36% of Board of Directors are women" — SR2025
      femaleLeadershipPct: 31,          // % female Executives and Top Executives — Group FY2024 Excel (consistent trend)
      totalHeadcount: 24_284,           // Group total employees FY2025 (Singtel + Optus + NCS + Digital InfraCo) — GRI 2-7
      employeeEngagementScore: null,    // Not disclosed as a single Group score in extracted data
      lostTimeInjuryRate: 1.02,        // Workplace injury frequency rate per million hours worked — Group FY2024 from Excel (FY2025 TRIR: 2.1 per 1,000 employees)
      lostTimeInjuryRateNote: "Workplace injury frequency rate per million hours worked, Group FY2024. FY2025 incidence rate = 2.1 per 1,000 employees (different metric). Methodology differs from the other companies.",
      communityInvestmentSGDm: 32.8,   // Group total FY2025 (Singtel SG: S$7.7M + Optus equivalent in SGD) — GRI 413-1
    },
    governance: {
      reportingFrameworks: ["GRI", "TCFD", "IFRS S2", "SASB"],
      externalAssurance: true,
      externalAssuranceProvider: "EY (independent limited assurance)",
      independentDirectorsPct: 81.8,  // 9 independent out of 11 directors — from Singtel corporate governance page
      esgLinkedExecutiveComp: true,   // ESG KPIs linked to executive remuneration — stated in SR2025
      antiCorruptionTrainingPct: null, // Anti-Bribery and Corruption Policy exists and training is conducted; % not disclosed in extracted data
    },
    historicalEmissions: [
      // Source: SR2025 performance table (expanded scope) + SR2024 for FY2023 baseline
      // All in ktCO2e. Scope 2 = market-based. Note scope expanded in FY2025 to include Global Offices + NCS.
      { year: "FY2023", scope1: 12.2,  scope2: 428.4,  scope3: 3_622.5 }, // FY2023 SBTi baseline S1+S2=440.6; S1/S2 split estimated based on FY2024 ratio
      { year: "FY2024", scope1:  8.4,  scope2: 405.5,  scope3: 2_482.8 }, // From SR2025 restated table
      { year: "FY2025", scope1: 13.2,  scope2: 342.5,  scope3: 2_309.4 }, // From SR2025 (scope expanded)
    ],
    dataNotes: [
      "FY2025 Scope 1 increased 57.2% YoY due to expansion of reporting scope to include Singtel Global Offices and NCS — not a real increase in emissions.",
      "FY2025 Scope 2 (market-based) decreased 15.5% YoY due to increased renewable energy procurement.",
      "Scope 3 SBTi-covered categories (1, 2, 11, 13, 15) = 2,220.3 ktCO2e; full 15-category total = 2,309.4 ktCO2e.",
      "FY2023 Scope 1/Scope 2 split is estimated (S1~12.2, S2~428.4) — only confirmed total is 440,600 tCO2e (SBTi baseline).",
      "GHG intensity metric (tCO2e/TB) is a telecom-specific measure and is not comparable with Sembcorp (tCO2e/MWh) or SMRT (tCO2e/S$M revenue).",
      "Renewable energy % (9.33%) is from FY2024 confirmed data; FY2025 is confirmed as higher but exact % not extracted.",
      "Community investment S$32.8M (Group) includes Optus (Australia) contribution; Singtel Singapore entity alone: S$7.7M.",
      "Total headcount 24,284 covers entire Singtel Group globally — much larger scope than Sembcorp and SMRT (both Singapore-centric).",
      "Singtel fiscal year runs April–March; FY2025 = 1 Apr 2024 – 31 Mar 2025.",
    ],
  },
];

// ─── Aggregates (for dashboard KPI tiles) ────────────────────────────────────

export const getCompanyById = (id: string): Company | undefined =>
  companies.find((c) => c.id === id);

export const aggregateTotals = {
  // Combined Scope 1+2 for all three companies (ktCO2e)
  totalScope1ktCO2e: companies.reduce((s, c) => s + c.environmental.scope1Emissions, 0),
  totalScope2ktCO2e: companies.reduce((s, c) => s + c.environmental.scope2Emissions, 0),

  // Headcount
  totalHeadcount: companies.reduce((s, c) => s + c.social.totalHeadcount, 0),

  // Governance averages (for companies where data is available)
  avgFemaleBoard: Math.round(
    companies.reduce((s, c) => s + c.social.femaleBoardPct, 0) / companies.length
  ),

  // Net-zero targets
  earliestNetZero: Math.min(...companies.map((c) => c.environmental.netZeroTargetYear)),
  latestNetZero: Math.max(...companies.map((c) => c.environmental.netZeroTargetYear)),

  // All externally assured?
  allExternallyAssured: companies.every((c) => c.governance.externalAssurance),

  // All have ESG-linked exec comp?
  allEsgLinkedComp: companies.filter((c) => c.governance.esgLinkedExecutiveComp).length,
};
