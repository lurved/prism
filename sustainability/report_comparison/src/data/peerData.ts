/**
 * DENSE-CITY OPERATOR COMPARISON — verified data layer.
 *
 * ACCURACY RULES (non-negotiable):
 *  - Every figure is taken from the company's OWN latest official report.
 *  - null  = "N/D" (not disclosed in / not extractable from the official report)
 *  - A metric listed in `naMetrics` = "N/A" (does not apply to this business model)
 *  - No figure is inferred, estimated, or taken from third-party aggregators.
 *  - Currency conversions are labelled approximate with the rate + date stated.
 *
 * NOTE ON COMPARABILITY: these operators have fundamentally different business
 * models (mass-transit vs. integrated electric utility). Absolute emissions and
 * carbon-intensity denominators are therefore NOT directly comparable. The UI
 * states this prominently. Social/governance metrics are broadly comparable.
 */

export type PeerBusinessModel =
  | "Mass transit operator"
  | "Integrated electric utility (distribution + generation)"
  | "Vertically integrated electric utility"
  | "Transmission & distribution only";

export interface PeerDataSource {
  reportTitle: string;
  reportingPeriod: string;
  url: string;
  accessDate: string;
}

export interface PeerCompany {
  id: string;
  name: string;
  shortName: string;
  logoInitials: string;
  accentColor: string;
  country: string;
  city: string;
  climateContext: string;       // dense-city + climate descriptor
  businessModel: PeerBusinessModel;
  reportingPeriod: string;
  dataSource: PeerDataSource;

  // ── Carbon (absolute, tCO2e) — as reported ──
  scope1: number | null;
  scope2: number | null;
  scope3: number | null;
  totalGHG: number | null;
  scope2Basis: string;          // "Location-based" | "Market-based" | "N/D"

  // ── Carbon intensity (each company's OWN denominator) ──
  intensityValue: number | null;
  intensityUnit: string;        // e.g. "tCO2e/GWh", "tCO2e/S$M revenue", "kg CO2e/kWh"

  // ── Grid-specific (N/A for non-grid) ──
  sf6tCO2e: number | null;
  systemLossPct: number | null;

  // ── Energy / renewables ──
  renewableNote: string;        // free text — what the report actually states
  netZeroYear: number | null;
  reductionTarget: string;      // verbatim-ish summary of stated target

  // ── Social / Governance (broadly comparable) ──
  headcount: number | null;
  femaleBoardPct: number | null;
  femaleWorkforcePct: number | null;
  trainingHoursPerEmployee: number | null;
  injuryMetricValue: number | null;
  injuryMetricUnit: string;     // unit differs by company — stated explicitly
  communityInvestmentNative: string;   // native currency, as reported
  communityInvestmentNote: string;
  independentDirectorsPct: number | null;
  antiCorruptionTrainingPct: number | null;
  externalAssurance: boolean | null;
  externalAssuranceProvider: string | null;
  frameworks: string[];

  naMetrics: string[];          // metric keys that are N/A for this business model
  dataNotes: string[];
}

export const peerCompanies: PeerCompany[] = [
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
    logoInitials: "SM",
    accentColor: "#c8102e",
    country: "Singapore",
    city: "Singapore",
    climateContext: "Dense city-state, tropical rainforest climate",
    businessModel: "Mass transit operator",
    reportingPeriod: "FY2024/25",
    dataSource: {
      reportTitle: "SMRT Sustainability Report 2024/25",
      reportingPeriod: "FY2024/25 (1 Apr 2024 – 31 Mar 2025)",
      url: "https://www.smrt.com.sg/getmedia/8cd6126b-4f4f-49d4-819e-f7ae4aae0117/SMRT-Sustainability-Report-2024_25.pdf",
      accessDate: "June 2026",
    },
    scope1: 129_195,
    scope2: 372_164,
    scope3: 209_757,
    totalGHG: 711_116,
    scope2Basis: "N/D",          // report does not specify location- vs market-based in the snapshot
    intensityValue: 295,         // Rail GHG intensity (Scope 1+2), excl. Thomson-East Coast Line
    intensityUnit: "tCO2e/S$M revenue (Rail, S1+2)",
    sf6tCO2e: null,
    systemLossPct: null,
    renewableNote:
      "Onsite renewable electricity 4,864,298 kWh of 893,001,643 kWh total energy (≈0.5%). Exploring renewable energy procurement.",
    netZeroYear: 2050,
    reductionTarget: "Reduce GHG emissions 20% from 2022 levels by 2030 (aligned with Singapore's 2030 target).",
    headcount: 9_056,
    femaleBoardPct: 25,          // 3 women of 12 directors (Board Diversity)
    femaleWorkforcePct: 15.6,
    trainingHoursPerEmployee: 65.8,
    injuryMetricValue: 593,
    injuryMetricUnit: "Workplace Injury Rate per 100,000 employees",
    communityInvestmentNative: "S$2.2M",
    communityInvestmentNote:
      "S$2.2M contributed (FY24/25, incl. in-kind e.g. 46,000 EZ-Link cards to nurses), as explicitly stated. A separate 3-year monetary series (S$1.7M/7.2M/20.4M) appears in the CSR snapshot but its definition is ambiguous in the extracted report and was not used.",
    independentDirectorsPct: 83.4,
    antiCorruptionTrainingPct: null,  // 0 corruption cases reported; training % not disclosed
    externalAssurance: false,
    externalAssuranceProvider:
      "None this cycle — internal audit of Scope 1 & 2 only; external assurance targeted from FY2032 (ACRA requirement).",
    frameworks: ["GRI 2021", "ISSB S1 & S2", "UN SDGs"],
    naMetrics: ["sf6tCO2e", "systemLossPct"],
    dataNotes: [
      "SMRT is a mass-transit operator (rail, bus, taxi), NOT a grid operator — grid metrics (SF₆, system/T&D loss) are N/A.",
      "Scope 2 (372,164 tCO₂e) is the largest source (>50% of total) — traction electricity to run trains. Scope 2 accounting basis (location vs market) not specified in the snapshot.",
      "Carbon-intensity figure is Rail Scope 1+2 per S$M revenue, excluding the Thomson-East Coast Line — it is NOT comparable with a utility's tCO₂e/GWh.",
      "Female senior management: 33 of 137 (≈24.1%). Independent non-executive directors: 83.4% of a 12-member board.",
      "Injury metric is per 100,000 employees — NOT the per-million-hours basis used by utilities, so it is not directly comparable.",
      "No external assurance obtained for this reporting cycle (internal audit of Scope 1 & 2 only).",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     MERALCO (Manila Electric Company) — "One Meralco" group
     Source: One Meralco 2024 Integrated Report (FY2024, calendar year)
     PDF: meralcomain.s3.../one_meralco_2024_integrated_report_0.pdf
     Figures = equity-adjusted, One Meralco group. Verified June 2026.
  ═══════════════════════════════════════════════════════════════ */
  {
    id: "meralco",
    name: "Manila Electric Company (Meralco)",
    shortName: "Meralco",
    logoInitials: "ME",
    accentColor: "#f57f17",
    country: "Philippines",
    city: "Metro Manila",
    climateContext: "Dense tropical megacity, tropical climate",
    businessModel: "Integrated electric utility (distribution + generation)",
    reportingPeriod: "FY2024",
    dataSource: {
      reportTitle: "One Meralco 2024 Integrated Report",
      reportingPeriod: "FY2024 (1 Jan – 31 Dec 2024)",
      url: "https://company.meralco.com.ph/node/13077",
      accessDate: "June 2026",
    },
    scope1: 6_630_953,           // equity-adjusted; dominated by MGen coal/gas generation
    scope2: 2_418_234,           // dominated by system loss (2,350,989 tCO2e)
    scope3: 37_671_744,
    totalGHG: 46_720_931,
    scope2Basis: "Location-based (energy purchased) + system loss",
    intensityValue: 134,         // combined Scope 1+2 emission intensity
    intensityUnit: "tCO2e/GWh (S1+2)",
    sf6tCO2e: 4_208,             // 4,207.90 tCO2e (166.98 kg SF6)
    systemLossPct: 5.99,         // 2024, below the 6.50% regulatory cap
    renewableNote:
      "Secured 2,329 MW of new renewable energy power-supply agreements (target was 1,500 MW). Group GHG inventory covers CO₂ and SF₆.",
    netZeroYear: null,           // No explicit dated net-zero commitment found
    reductionTarget:
      "Stated goals: 'coal-free by 2050' and a '30 by '30' interim programme. No single dated company-wide net-zero year disclosed.",
    headcount: 19_623,
    femaleBoardPct: null,        // report notes ≥1 female independent director; exact board gender % not disclosed
    femaleWorkforcePct: 23,
    trainingHoursPerEmployee: 45, // "over 45 training hours per employee" (2024); Meralco DU overall avg 45.4
    injuryMetricValue: 1.42,
    injuryMetricUnit: "LTIFR (lost-time injury freq. rate, per million hours)",
    communityInvestmentNative: "PhP 224M",
    communityInvestmentNote:
      "PhP 224 million CSR project expenses (2024, GRI 201-1). ≈ S$5.1M at PhP→SGD ≈ 0.0228 (mid-2025, approximate). One Meralco Foundation programmes reported separately.",
    independentDirectorsPct: 27.3, // 3 independent of 11 directors
    antiCorruptionTrainingPct: null, // GRI 205-2 reported & DNV-assured, but % not in extracted data
    externalAssurance: true,
    externalAssuranceProvider: "DNV (VeriSustain v6.0; AA1000AS v3)",
    frameworks: ["GRI 2021", "GRI G4 Electric Utilities", "SASB (IF-EU)", "IFRS S2", "TCFD-aligned"],
    naMetrics: [],
    dataNotes: [
      "CRITICAL: the 'One Meralco' report CONSOLIDATES generation via subsidiary MGen (coal/gas), so group Scope 1 (6.63M tCO₂e) is dominated by power GENERATION, not the distribution 'wires' business. At group level Meralco is effectively an integrated utility, not pure distribution.",
      "Scope 2 (2.42M tCO₂e) is dominated by system (distribution) loss emissions: 2.35M tCO₂e.",
      "System loss 5.99% (2024) is the distribution-network loss rate, below the 6.50% regulatory cap.",
      "Carbon intensity (134 tCO₂e/GWh, Scope 1+2) uses a per-GWh denominator — not comparable with SMRT's per-revenue transit metric.",
      "LTIFR rose to 1.42 (2024) from 0.35 (2023). Figures are equity-adjusted group totals.",
      "No explicit dated net-zero commitment found in the report; targets are 'coal-free by 2050' plus '30 by '30' interim goals.",
      "Community investment: PhP 224M (2024) ≈ S$5.1M at PhP→SGD ≈ 0.0228 (mid-2025, approximate). The native PhP figure is authoritative; SMRT's is reported in S$ — the two are shown in native currency and not ranked against each other.",
    ],
  },

  /* ───────────────────────────────────────────────────────────────
     CLP POWER HONG KONG — PENDING (intentionally omitted for now)
     Reason: CLP's sustainability portal and CDN block automated retrieval
     (HTTP 403). Only two figures could be verified from CLP's HKEX 2025
     annual-results filing: GHG intensity 0.50 kg CO₂e/kWh (Group, FY2025)
     and net-zero Scope 1+2 by 2050. Detailed scopes/SF₆/social metrics
     require the ESG Databook, which was not obtainable via automation.
     To be added once the official databook can be sourced.
  ─────────────────────────────────────────────────────────────── */
];

export const CLP_PENDING_NOTE =
  "CLP Power Hong Kong (vertically integrated utility; Hong Kong, dense subtropical city) is a planned third operator. " +
  "Its data is pending: CLP's official sustainability portal blocks automated retrieval. " +
  "Verified so far from CLP's HKEX 2025 annual-results filing only: Group GHG intensity 0.50 kg CO₂e/kWh (FY2025) and a net-zero Scope 1+2 target by 2050. " +
  "Detailed figures will be added once the official ESG Databook is obtained — no estimated or third-party data will be used.";
