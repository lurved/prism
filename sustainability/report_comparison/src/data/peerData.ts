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
 * NOTE ON COMPARABILITY: these electricity utilities have very different
 * business models, scopes and scales (Meralco = Philippines distribution +
 * MGen generation; CLP = Asia-centric vertically integrated group, equity
 * basis; National Grid = large UK+US transmission & distribution group).
 * Absolute emissions and carbon-intensity units are therefore NOT directly
 * comparable. The UI states this prominently. Social/governance metrics are
 * broadly comparable.
 */

export type PeerBusinessModel =
  | "Mass transit operator"
  | "Integrated electric utility (distribution + generation)"
  | "Vertically integrated electric utility"
  | "Transmission & distribution only"
  | "Universal bank (commercial + retail + wealth)";

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
      "Carbon intensity (134 tCO₂e/GWh, Scope 1+2) uses a per-GWh denominator; CLP reports per-kWh — convert before comparing.",
      "LTIFR rose to 1.42 (2024) from 0.35 (2023). Figures are equity-adjusted group totals.",
      "No explicit dated net-zero commitment found in the report; targets are 'coal-free by 2050' plus '30 by '30' interim goals.",
      "Community investment: PhP 224M (2024) ≈ S$5.1M at PhP→SGD ≈ 0.0228 (mid-2025, approximate); the native PhP figure is authoritative. CLP reports in HK$ — figures are shown in native currency and not ranked against each other.",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     CLP GROUP / CLP POWER HONG KONG
     Source: CLP Holdings 2025 Annual Report (integrated; KPMG-assured
     Five-Year ESG Data summary), filed on HKEX 11 Mar 2026.
     PDF: www1.hkexnews.hk/.../2026/0311/2026031100298.pdf
     Reporting period: FY2025 (calendar year ended 31 Dec 2025).
     Figures = CLP GROUP on an equity basis (HK + Mainland China +
     Australia + India + Taiwan/SE Asia), unless noted. 2025 ESG-table
     figures independently verified by KPMG (ISAE 3000 / ISAE 3410).
     NOTE: CLP's own portal (sustainability.clpgroup.com) blocks automated
     retrieval (403); data was sourced from the HKEX-filed Annual Report,
     whose Five-Year ESG Data summary carries the KPMG-assured figures.
     Verified June 2026.
  ═══════════════════════════════════════════════════════════════ */
  {
    id: "clp",
    name: "CLP Group (CLP Power Hong Kong)",
    shortName: "CLP",
    logoInitials: "CL",
    accentColor: "#00843d",
    country: "Hong Kong",
    city: "Hong Kong",
    climateContext: "Dense vertical city, humid subtropical climate",
    businessModel: "Vertically integrated electric utility",
    reportingPeriod: "FY2025",
    dataSource: {
      reportTitle: "CLP Holdings 2025 Annual Report (KPMG-assured Five-Year ESG Data)",
      reportingPeriod: "FY2025 (calendar year ended 31 Dec 2025)",
      url: "https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0311/2026031100298.pdf",
      accessDate: "June 2026",
    },
    scope1: 34_356_000,          // 34,356 kt — dominated by power generation (equity basis)
    scope2: 302_000,             // 302 kt — basis (location/market) not labelled in the table
    scope3: 11_125_000,          // 11,125 kt — Cats 1,2,3,5,6,7,11 (Cat 3 fuel/energy = 8,433 kt)
    totalGHG: 45_783_000,        // 45,783 kt total CO2e (equity basis)
    scope2Basis: "N/D (single Scope 2 figure; location/market basis not labelled)",
    intensityValue: 0.50,        // kg CO2e/kWh — S1+S2+S3(Cat3), equity + long-term capacity/energy-purchase basis (S1+S2-only = 0.58)
    intensityUnit: "kg CO2e/kWh (S1+2+S3 Cat3)",
    sf6tCO2e: null,              // SF6 disclosed as MASS (3 t SF6), not tCO2e — see dataNotes
    systemLossPct: null,         // N/D — CLP discloses reliability indices, not a network-loss %
    renewableNote:
      "Renewables (wind/solar/hydro/WtE) 23.3% of equity capacity (4,363 MW); non-carbon incl. nuclear 33%. Renewable energy sent out 10.9% (6,501 GWh). Coal phase-out (Castle Peak) by 2035.",
    netZeroYear: 2050,
    reductionTarget:
      "Science-based targets vs 2019 baseline. Absolute GHG of electricity sold fell from 60,644 kt (2019) to 24,520 kt (2025), ≈ −60%. Net-zero Scope 1+2 by 2050 (ambition to extend to Scope 3).",
    headcount: 8_539,            // Group (HK 5,484; Mainland 788; Australia 2,267)
    femaleBoardPct: 38,
    femaleWorkforcePct: 26.5,
    trainingHoursPerEmployee: 51.9, // Group average; HK 63.3
    injuryMetricValue: 0.04,
    injuryMetricUnit: "Lost-time injury rate per 200,000 work hours",
    communityInvestmentNative: "HK$240M",
    communityInvestmentNote:
      "HK$240M allocated under the CLP Community Energy Saving Fund (programme allocation). A single consolidated community-investment total is not disclosed in the Annual Report.",
    independentDirectorsPct: 54,  // Independent Non-executive Directors, 13-member board
    antiCorruptionTrainingPct: null, // Ongoing fraud-risk training, but % of staff not disclosed; 0 convicted corruption cases 2021–2025
    externalAssurance: true,
    externalAssuranceProvider: "KPMG (ISAE 3000 (Revised); ISAE 3410 for GHG)",
    frameworks: ["HKEX ESG Code", "HKFRS S1", "HKFRS S2", "GRI", "SASB (IF-EU)"],
    naMetrics: [],
    dataNotes: [
      "CLP is a VERTICALLY INTEGRATED electric utility (generation + transmission + distribution + retail). Scope 1 (34,356 kt) is dominated by power generation it owns. Absolute emissions are only loosely comparable with Meralco given CLP's much wider multinational group boundary.",
      "All ESG figures are CLP GROUP (Hong Kong + Mainland China + Australia + India + Taiwan/SE Asia) on an equity basis — NOT CLP Power Hong Kong alone. CLP Power HK (the Scheme-of-Control business) serves ~2.9M customer accounts and 35,760 GWh of sales but does not publish its own Scope 1/2/3 split.",
      "FY2025 ESG figures are independently assured by KPMG (ISAE 3000 / ISAE 3410).",
      "Carbon intensity 0.50 kg CO₂e/kWh is the S1+S2+S3(Cat3) equity + long-term-purchase basis; the equity-only S1+S2 intensity is 0.58 kg CO₂e/kWh. Meralco reports per-GWh (134 tCO₂e/GWh = 0.134 kg CO₂e/kWh) — convert before comparing.",
      "SF₆ is reported as mass (3 tonnes of SF₆ gas), not in tCO₂e, so the tCO₂e field is shown as N/D to avoid an unlabelled derived value.",
      "System/T&D loss % is N/D (not disclosed); CLP reports reliability indices instead (e.g. supply availability 99.999%). The metric applies to its business — this is N/D, not N/A.",
      "Injury rate uses a per-200,000-work-hours basis — different from Meralco's per-million-hours LTIFR; not directly comparable.",
      "Community figure is the HK$240M CLP Community Energy Saving Fund allocation; a consolidated community-investment total is not disclosed in the Annual Report.",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     NATIONAL GRID plc
     Source: National Grid plc Annual Report and Accounts 2025/26
     (Form 20-F filed with the US SEC, 13 May 2026).
     PDF/HTML: sec.gov/Archives/edgar/data/1004315/000100431526000006/nggtf-20260331.htm
     Reporting period: FY2025/26 (1 Apr 2025 – 31 Mar 2026).
     Figures = National Grid Group (UK + USA), GHG Protocol operational control.
     NOTE: nationalgrid.com is Cloudflare-blocked to automation; data was taken
     from the SEC-filed 20-F (the same document as the Annual Report). A few
     metrics that appear only in the separate Responsible Business databook
     (also blocked) are marked N/D. Verified June 2026.
  ═══════════════════════════════════════════════════════════════ */
  {
    id: "nationalgrid",
    name: "National Grid plc",
    shortName: "National Grid",
    logoInitials: "NG",
    accentColor: "#1a3a6b",
    country: "UK / USA",
    city: "London (HQ); New York & New England (US)",
    climateContext: "Large multinational T&D operator; temperate UK + NE US",
    businessModel: "Transmission & distribution only",
    reportingPeriod: "FY2025/26",
    dataSource: {
      reportTitle: "National Grid plc Annual Report and Accounts 2025/26 (Form 20-F)",
      reportingPeriod: "FY2025/26 (1 Apr 2025 – 31 Mar 2026)",
      url: "https://www.sec.gov/Archives/edgar/data/1004315/000100431526000006/nggtf-20260331.htm",
      accessDate: "June 2026",
    },
    scope1: 5_001_000,         // incl. Long Island fossil generation, gas leaks, SF6, fleet
    scope2: 2_510_000,         // location-based; almost entirely electricity line losses
    scope3: 29_503_000,        // full value chain; dominated by sold gas (Cat 11: 19,736 kt)
    totalGHG: 37_015_000,      // S1+S2+S3 full footprint
    scope2Basis: "Location-based (explicitly stated; market-based not reported)",
    intensityValue: 425,
    intensityUnit: "tCO2e/£M revenue (S1+2, operational control)",
    sf6tCO2e: null,            // absolute N/D in 20-F; only −43% vs 2018/19 stated — see dataNotes
    systemLossPct: null,       // N/D; line losses 15,111 GWh disclosed but not as a % of throughput
    renewableNote:
      "T&D/networks operator with no material generation (divested National Grid Renewables in FY2025/26). Its climate role is enabling renewable generation to connect to its networks; no renewable energy % is reported.",
    netZeroYear: 2050,
    reductionTarget:
      "Scope 1+2: −60% by 2030/31 vs 2018/19 (SBTi-approved, 1.5°C); current −3%, stated as outside the Climate Transition Plan range due to higher Long Island generation. Scope 3 (excl. sold electricity): −37.5% by 2033. Net zero by 2050.",
    headcount: 33_017,         // permanent employees, 31 Mar 2026
    femaleBoardPct: 46,        // 5 of 11 directors
    femaleWorkforcePct: 25,    // 8,214 of 33,017
    trainingHoursPerEmployee: null, // N/D in 20-F (in blocked Responsible Business databook)
    injuryMetricValue: 0.11,
    injuryMetricUnit: "LTIFR per 100,000 hours worked (employees + contractors)",
    communityInvestmentNative: "£6.8M/yr",
    communityInvestmentNote:
      "Grid for Good Energy Affordability Fund: £3.5M/yr (UK) + £3.3M/yr (US) ≈ £6.8M/yr. A consolidated total community-investment figure is not disclosed in the 20-F.",
    independentDirectorsPct: 81.8, // 9 of 11 (8 independent NEDs + independent-on-appointment Chair)
    antiCorruptionTrainingPct: null, // mandatory e-learning confirmed; completion % not disclosed
    externalAssurance: true,
    externalAssuranceProvider: "Deloitte LLP (ISAE 3000 Revised; ISAE 3410 for GHG)",
    frameworks: ["GRI", "SASB", "TCFD", "EU Taxonomy", "GHG Protocol (operational control)"],
    naMetrics: [],
    dataNotes: [
      "SCALE: National Grid is a large MULTINATIONAL utility (UK + USA, ~33,000 employees) — far larger in scale and different in geography from Meralco and CLP. Absolute emission and community totals must NOT be compared directly.",
      "BUSINESS MODEL: predominantly a T&D/networks operator. Scope 1 (5,001 kt) is partly driven by Long Island fossil-fuel generation contracted to LIPA, not core T&D operations. It divested National Grid Renewables and Grain LNG in FY2025/26.",
      "Scope 2 (2,510 kt, location-based) is almost entirely electricity network line losses — the expected profile for a T&D operator. No market-based Scope 2 is reported.",
      "Scope 3 (29,503 kt) is dominated by sold gas (Category 11 = 19,736 kt, ~53% of total footprint) — a fundamentally different Scope 3 profile from Meralco/CLP; not comparable as a single headline.",
      "GHG intensity (425 tCO₂e/£M revenue) is a revenue-based metric — not comparable with CLP's per-kWh or Meralco's per-GWh intensities.",
      "SF₆: absolute value is N/D in the 20-F (only a −43% reduction vs 2018/19 baseline is stated; target −50% by 2030/31). The absolute figure sits in the separate Responsible Business databook, which is blocked to automation.",
      "System/T&D loss %: N/D — line losses are disclosed in GWh (15,111 GWh Group) but not as a percentage of throughput.",
      "Training hours/employee, anti-corruption training %: N/D in the 20-F (in the separate, blocked Responsible Business data tables).",
      "Community figure (£6.8M/yr, GBP) is the Grid for Good fund only; do not aggregate or rank against CLP's HK$ or Meralco's PhP figures.",
      "Independent directors 81.8% (9 of 11) uses the Companies Act basis (8 independent NEDs + Chair independent on appointment); NED-only would be 72.7%.",
      "External assurance by Deloitte LLP (limited assurance, ISAE 3000 / ISAE 3410) on ESG/Responsible Business metrics.",
      "Data taken from the SEC-filed Form 20-F because nationalgrid.com is Cloudflare-blocked to automated access. Fiscal year ends 31 March.",
    ],
  },
];
