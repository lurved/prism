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

  // ── Normalised intensity (kg CO2e/kWh, Scope 1+2) for cross-company comparison ──
  // Only set where it is directly disclosed or an exact unit conversion of a
  // disclosed figure (never derived by inventing a denominator). undefined/null = N/D;
  // add "normalizedIntensityKgPerKwh" to naMetrics where the metric doesn't apply (e.g. banks).
  normalizedIntensityKgPerKwh?: number | null;
  normalizedIntensityNote?: string;

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
  femaleSeniorMgmtPct?: number | null;   // "senior management" definitions vary by company
  trainingHoursPerEmployee: number | null;
  employeeTurnoverPct?: number | null;
  employeeEngagementScore?: number | null; // % favourable
  injuryMetricValue: number | null;
  injuryMetricUnit: string;     // unit differs by company — stated explicitly
  communityInvestmentNative: string;   // native currency, as reported
  communityInvestmentNote: string;
  independentDirectorsPct: number | null;
  esgLinkedExecComp?: boolean | null;    // exec remuneration linked to ESG/sustainability
  antiCorruptionTrainingPct: number | null;
  externalAssurance: boolean | null;
  externalAssuranceProvider: string | null;
  frameworks: string[];

  naMetrics: string[];          // metric keys that are N/A for this business model
  dataNotes: string[];

  /**
   * Known page references in the source report, keyed by the row `key` used
   * in PeerComparison's row list / PeerCompanyCard's stat keys (e.g. "s1",
   * "s2", "s3", "total", "sf6", "intensity", "normIntensity", "systemLoss",
   * "netzero", "headcount", "femaleBoard", "femaleWorkforce",
   * "femaleSeniorMgmt", "training", "turnover", "engagement", "injury",
   * "indepDir"). Only populated where a page was actually recorded during
   * extraction — never guessed. See lib/peerMetrics.ts.
   */
  citationPages?: Record<string, number>;
}

export const peerCompanies: PeerCompany[] = [
  /* ═══════════════════════════════════════════════════════════════
     MERALCO (Manila Electric Company)
     Source: SEC Form 17-A Annual Report (incl. Part V Sustainability
     Report), for the fiscal year ended 31 December 2025.
     Filed with the Philippine SEC; Drive copy verified July 2026.
     NOTE: text extraction reached only the front matter through Item 13
     (Corporate Governance), i.e. printed pages up to ~149 of ~162. Part V
     "Sustainability Report" (printed page 157 onward per the filing's own
     Table of Contents) — which holds the GHG, energy, safety and
     community-investment KPIs — was NOT reached, so most environmental/
     social metrics are N/D this cycle rather than carried forward from
     the FY2024 Integrated Report previously cited here.
  ═══════════════════════════════════════════════════════════════ */
  {
    id: "meralco",
    name: "Manila Electric Company (Meralco)",
    shortName: "Meralco",
    logoInitials: "ME",
    accentColor: "#E39A4D",
    country: "Philippines",
    city: "Metro Manila",
    climateContext: "Dense tropical megacity, tropical climate",
    businessModel: "Integrated electric utility (distribution + generation)",
    reportingPeriod: "FY2025",
    dataSource: {
      reportTitle: "MERALCO SEC Form 17-A Annual Report (incl. Part V Sustainability Report) 2025",
      reportingPeriod: "FY2025 (1 Jan – 31 Dec 2025)",
      url: "https://edge.pse.com.ph/",
      accessDate: "July 2026",
    },
    scope1: null,              // not re-verified for FY2025 — see dataNotes (Part V not reached)
    scope2: null,              // not re-verified for FY2025 — see dataNotes
    scope3: null,              // not re-verified for FY2025 — see dataNotes
    totalGHG: null,            // not re-verified for FY2025 — see dataNotes
    scope2Basis: "N/D — not re-verified for FY2025",
    intensityValue: null,      // not re-verified for FY2025 — see dataNotes
    intensityUnit: "N/D",
    normalizedIntensityKgPerKwh: null,
    normalizedIntensityNote: "Not re-verified for FY2025 — see dataNotes.",
    sf6tCO2e: null,             // not re-verified for FY2025 — see dataNotes
    systemLossPct: 5.85,        // FY2025; down from 5.99% in FY2024, below the 6.50% regulatory cap
    renewableNote: "Not re-verified for FY2025 — see dataNotes (Part V not reached).",
    netZeroYear: null,           // No explicit dated net-zero commitment found in the extracted portion
    reductionTarget: "Not re-verified for FY2025 — see dataNotes (Part V not reached).",
    headcount: null,            // "MERALCO has a total of 6,175 regular employees" (FY2025) is PARENT-COMPANY-ONLY — a narrower scope than the "One Meralco" group figure (19,623) previously stored, so not used as a replacement — see dataNotes
    femaleBoardPct: 18.2,        // newly confirmed: 2 of 11 directors
    femaleWorkforcePct: null,   // not re-verified for FY2025 — see dataNotes
    trainingHoursPerEmployee: null, // not re-verified for FY2025 — see dataNotes
    injuryMetricValue: null,    // not re-verified for FY2025 — see dataNotes ("LTI cases declining by 21%" found, but not the LTIFR rate itself)
    injuryMetricUnit: "N/D — LTIFR rate not located within the extracted portion",
    communityInvestmentNative: "N/D",
    communityInvestmentNote:
      "PhP 224M was the FY2024 CSR project-expense figure (GRI 201-1); the FY2025 equivalent was not located within the extracted portion of the 17-A (Part V not reached) and is not carried forward.",
    independentDirectorsPct: 27.3, // confirmed unchanged: 3 independent of 11 directors
    antiCorruptionTrainingPct: null, // not re-verified for FY2025 (Anti-Bribery and Corruption Policy referenced, but no % found)
    externalAssurance: null,    // not re-verified for FY2025 — see dataNotes
    externalAssuranceProvider: null,
    frameworks: ["GRI 2021", "GRI G4 Electric Utilities", "SASB (IF-EU)", "IFRS S2", "TCFD-aligned"],
    naMetrics: [],
    dataNotes: [
      "This 17-A filing's Part V 'Sustainability Report' (printed page 157 onward, per the filing's own Table of Contents) is where GHG emissions, energy, safety and community-investment KPIs live — that section was NOT reached by text extraction this cycle (which covered roughly the front matter through Item 13, Corporate Governance, ending around printed page 149). Rather than carry forward the FY2024 Integrated Report's figures under a new FY2025 reportingPeriod, those fields are left N/D — see individual field comments for what each N/D represents.",
      "System loss IS confirmed for FY2025 from the Operational Data table in Item 6 (MD&A): 5.85% (FY2025), 5.99% (FY2024, matching the figure previously stored), 5.88% (FY2023) — all below the 6.50% regulatory cap.",
      "Board composition confirmed unchanged: 11 directors, 3 independent (incl. 1 female independent director), 7 non-executive, 1 executive — independentDirectorsPct 27.3% matches the figure previously stored. Board gender split is now also confirmed: 9 male, 2 female directors (18.2%) — this was previously N/D ('exact board gender % not disclosed'); it is disclosed in this filing's Board Diversity section.",
      "Headcount: the filing states 'MERALCO has a total of 6,175 regular employees' as at 31 Dec 2025, but this is the MERALCO parent-company headcount only (Managerial/Executive 1,822 + Supervisory/Rank-and-file 4,353) — a materially narrower scope than the 'One Meralco' consolidated-group figure (19,623, including MGen and other subsidiaries) previously stored under this field. Left N/D rather than substituting a different-scope number.",
      "'Lost Time Injury (\"LTI\") cases declining by 21%' is stated in Item 6, but this is a year-over-year change in case count, not the LTIFR rate itself (the metric this field represents) — left N/D.",
      "No net-zero target, external-assurance statement, SF₆ figure, training-hours figure, or community-investment SGD/PhP figure for FY2025 was found within the extracted portion.",
    ],
    citationPages: {
      // Verified July 2026 against MERALCO's SEC Form 17-A (incl. Part V Sustainability Report) for FY2025 (Drive copy).
      // Operational Data — "System loss (in percentage): MERALCO 5.85 5.99 5.88" (2025/2024/2023 columns).
      systemLoss: 42,
      // Board Diversity: "the Board has two (2) female directors" of 11 — "9 male and 2 female directors".
      femaleBoard: 134,
      // Board Composition: "The Board consists of eleven (11) directors, three (3) of whom are independent directors".
      indepDir: 133,
    },
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
    accentColor: "#4FC17E",
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
    normalizedIntensityKgPerKwh: 0.58, // reported S1+2 equity-only intensity (matches Meralco's S1+2 basis)
    normalizedIntensityNote: "CLP's reported S1+2 equity-only intensity, used here for a like-for-like Scope 1+2 basis (its headline 0.50 includes Scope 3 Cat 3).",
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
    femaleSeniorMgmtPct: 15,   // Group Executive Committee (2 of 13) — narrowest top tier; see note
    trainingHoursPerEmployee: 51.9, // Group average; HK 63.3
    injuryMetricValue: 0.04,
    injuryMetricUnit: "Lost-time injury rate per 200,000 work hours",
    communityInvestmentNative: "HK$240M",
    communityInvestmentNote:
      "HK$240M allocated under the CLP Community Energy Saving Fund (programme allocation). A single consolidated community-investment total is not disclosed in the Annual Report.",
    independentDirectorsPct: 54,  // Independent Non-executive Directors, 13-member board
    esgLinkedExecComp: true,   // executive scorecard weights Safety/Environmental/community
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
      "Verified July 2026 against the CLP Holdings 2025 Sustainability Report (a different CLP document than the Annual Report originally cited, but the same FY2025 period, and CLP's own official report). That document does not carry CLP's absolute Scope 1/2/3/total GHG tonnages, its 0.58 kg CO2e/kWh S1+2-only intensity, female workforce/senior-management %, or board independence % — those live in the Annual Report's Five-Year ESG Data table or the separate ESG Databook, neither available in Drive — so scope1, scope2, scope3, total, normIntensity, femaleWorkforce, femaleSeniorMgmt and indepDir remain uncited (reported, not confirmed).",
      "The Sustainability Report's 'Employees and contractors by region' table (Group total Average FTE 8,467.2) is close to but does not exactly match the stored headcount of 8,539 (a different metric — average FTE across the year vs. the Annual Report's point-in-time headcount) — left uncited rather than treated as a straight match.",
    ],
    citationPages: {
      // Verified July 2026 against CLP Holdings 2025 Sustainability Report (Drive copy).
      // "...further reduced the Group's GHG emissions intensity to 0.50kg CO2e per kilowatt hour in 2025."
      intensity: 25,
      // "...achieve net-zero GHG emissions across our value chain by 2050."
      netzero: 6,
      // Sustainability agenda scorecard: Board diversity target >30% female — "2025 performance: 38%".
      femaleBoard: 7,
      // "51.9 training hours/employee (in line with 2024)".
      training: 28,
      // "The lost-time injury rate fell to a record low of 0.04."
      injury: 79,
    },
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
    accentColor: "#6E9BE8",
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
    femaleSeniorMgmtPct: 44,   // 72 of 162 senior managers
    trainingHoursPerEmployee: null, // N/D in 20-F (in blocked Responsible Business databook)
    employeeEngagementScore: 81, // Grid:Voice survey, % favourable
    injuryMetricValue: 0.11,
    injuryMetricUnit: "LTIFR per 100,000 hours worked (employees + contractors)",
    communityInvestmentNative: "£6.8M/yr",
    communityInvestmentNote:
      "Grid for Good Energy Affordability Fund: £3.5M/yr (UK) + £3.3M/yr (US) ≈ £6.8M/yr. A consolidated total community-investment figure is not disclosed in the 20-F.",
    independentDirectorsPct: 81.8, // 9 of 11 (8 independent NEDs + independent-on-appointment Chair)
    esgLinkedExecComp: true,   // LTPP includes controllable Scope 1 reductions; APP includes LTIFR
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
      "Verified July 2026 against the 'Responsible Business review' chapter (pp.38-52) of the National Grid plc Annual Report and Accounts 2025/26 itself (a Drive upload of that excerpt, distinct from the SEC 20-F originally cited). totalGHG, netZeroYear, headcount, femaleBoard/Workforce/SeniorMgmt %, employee engagement, LTIFR and the external assurance provider all matched exactly. Scope 1/2/3 individual absolute figures, GHG intensity (425 tCO2e/£M revenue), and independent-directors % were not present in this excerpt (the first two likely sit in the separate Responsible Business data tables; board independence is a Corporate Governance-chapter disclosure) — left uncited rather than guessed.",
      "Community investment also corroborated in this excerpt: 'the fund commits £3.5 million of support in the UK and £3.3 million in the US' each year — not formally cited (communityInvestmentNative is a free-text field, not run through the citation system) but confirms the existing £6.8M/yr figure.",
    ],
    citationPages: {
      // Verified July 2026 against the Annual Report and Accounts 2025/26 "Responsible Business review" excerpt (Drive copy).
      // "Achieve net zero by 2050."
      netzero: 40,
      // "Our 2025/26 GHG emissions footprint across direct and indirect sources was 37,015 ktCO2e."
      total: 42,
      // "Our 33,017 colleagues across the UK and US" / Gender demographic table (Board, Senior management, Whole company).
      headcount: 48,
      femaleBoard: 48,
      femaleWorkforce: 48,
      femaleSeniorMgmt: 48,
      // "81% ... Employee engagement index in 2025/26" (Grid:Voice).
      engagement: 48,
      // "We have recorded a Group LTIFR of 0.11 this year."
      injury: 49,
    },
  },
];
