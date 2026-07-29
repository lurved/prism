/**
 * BANKS COMPARISON — Singapore's three largest banks.
 *
 * Same accuracy rules and PeerCompany shape as the electricity-utility set
 * (see peerData.ts). All figures verified from each bank's latest official
 * Sustainability Report (FY2024). Verified June 2026.
 *
 * KEY CONTEXT: for a bank, FINANCED emissions (Scope 3 Category 15) dominate
 * its climate footprint, while operational Scope 1/2 are tiny. None of the
 * three banks disclose a single aggregate financed-emissions tCO2e figure —
 * they report per-sector intensity/absolute targets instead — so `scope3`
 * here holds OPERATIONAL Scope 3 only, and financed-emissions detail lives in
 * dataNotes. Grid metrics (SF6, system loss) and industrial injury rates are
 * N/A for banks.
 */
import type { PeerCompany } from "./peerData";

export const bankCompanies: PeerCompany[] = [
  {
    id: "dbs",
    name: "DBS Group Holdings Ltd",
    shortName: "DBS",
    logoInitials: "DB",
    accentColor: "#EA7267",
    country: "Singapore",
    city: "Singapore",
    climateContext: "Singapore-HQ universal bank; core markets SG, HK, Greater China, S/SE Asia, India",
    businessModel: "Universal bank (commercial + retail + wealth)",
    reportingPeriod: "FY2025",
    dataSource: {
      reportTitle: "DBS Group Holdings Sustainability Report 2025",
      reportingPeriod: "FY2025 (1 Jan – 31 Dec 2025)",
      url: "https://www.dbs.com/iwov-resources/images/sustainability/reporting/pdf/web/DBS_SR2025.pdf",
      accessDate: "July 2026",
    },
    scope1: 1_148,             // restated FY2024 comparative: 1,695
    scope2: 23_571,            // market-based (location-based: 50,091; restated FY2024 comparative: 53,141)
    scope3: 51_987,            // OPERATIONAL Scope 3 only (financed emissions not aggregated)
    totalGHG: 76_706,          // S1 + S2(market) + S3(operational)
    scope2Basis: "Market-based (location-based 50,091 tCO₂e also reported)",
    intensityValue: 39,        // FY2025 report switched its headline operational intensity metric from tCO2e/SGD M income to per-floor-area
    intensityUnit: "kg CO2e/m2 GFA (S1+2, market-based)",
    sf6tCO2e: null,
    systemLossPct: null,
    renewableNote:
      "Purchased renewable electricity 3,716 MWh + self-generated solar 1,426 MWh, of 95,933 MWh total electricity consumption (FY2025). Renewable % of consumption not stated by DBS.",
    netZeroYear: 2050,
    reductionTarget:
      "Own operations net zero by 2050, interim 2030 target of 61 kgCO2e/m2 (CRREM-aligned S1+2). Financed-emissions net zero by 2050 across nine priority sectors.",
    headcount: 39_983,         // down from 41,638 in FY2024 — voluntary attrition + post-integration optimisation in India/Taiwan
    femaleBoardPct: 30,        // FY2025: DBS reached its 2030 target of 30% female Board representation
    femaleWorkforcePct: 49,
    femaleSeniorMgmtPct: 41,   // SVP–MD level
    trainingHoursPerEmployee: 34.0,
    employeeTurnoverPct: 7,    // voluntary attrition (Table 4 total row; FY2024 restated comparative also 7%)
    employeeEngagementScore: 91, // My Voice 2025
    injuryMetricValue: null,
    injuryMetricUnit: "N/A (bank — no material operational injury exposure)",
    communityInvestmentNative: "SGD 1B / 10yr (DBS Foundation)",
    communityInvestmentNote:
      "DBS Foundation commitment of up to SGD 1 billion over 10 years; no annual community-investment SGD total disclosed in the SR. Employee volunteering >300,000 hours in FY2025.",
    independentDirectorsPct: null,   // not re-verified for FY2025 — see dataNotes
    esgLinkedExecComp: true,         // "balanced scorecard" approach explicitly stated, incl. sustainability
    antiCorruptionTrainingPct: null, // DBS explicitly does not report this % (GRI 205-2)
    externalAssurance: true,         // "selected indicators also subjected to external assurance" (SR2025 p.5)
    externalAssuranceProvider: null, // provider name not re-confirmed for FY2025 — see dataNotes
    frameworks: ["GRI 2021", "TCFD", "SASB", "IFRS S2"],
    naMetrics: ["sf6tCO2e", "systemLossPct", "injuryMetricValue", "normalizedIntensityKgPerKwh"],
    dataNotes: [
      "Universal bank: operational emissions (76,706 tCO₂e incl. operational Scope 3) are tiny vs FINANCED emissions, which dominate but are NOT aggregated into one figure — DBS discloses per-sector intensity/absolute targets only.",
      "Scope 2 shown is market-based (23,571 tCO₂e); location-based is 50,091 tCO₂e (difference = RECs in HK/China/India/Indonesia).",
      "Scope 3 (51,987 tCO₂e) is OPERATIONAL only (Cats 3,4,5,6,7,8,13). Financed emissions (Cat 15) are tracked by sector, not aggregated.",
      "FY2024 comparatives shown in the FY2025 report were restated for data-quality/methodology refinements (e.g. Scope 1 restated 1,300→1,695; Scope 2 market-based restated 26,322→24,871) — the prior FY2024 figures in this dataset predate that restatement.",
      "Employee engagement 91% (My Voice 2025, unchanged from FY2024). Voluntary attrition 7% (Table 4 total row). Female senior management (SVP–MD) 41%; Group Management Committee 24% (a narrower top-tier figure, not used here).",
      "Independent-directors %, anti-corruption-training %, and the specific external-assurance provider are ordinarily sourced from the Annual Report's Corporate Governance / assurance-statement section; that document was not available for FY2025 verification, and pages 81–127 of the Sustainability Report PDF (which include the assurance statement) did not extract as text, so these are left as N/D rather than carrying forward the FY2024 figures unverified.",
      "SF₆, system loss and industrial injury rate are N/A for a bank.",
    ],
    citationPages: {
      // Verified July 2026 against DBS Group Holdings Sustainability Report 2025 (Drive copy).
      // GHG emissions table (Scope 1/2/3, total, GFA intensity) — Notes on data quality and coverage.
      s1: 79,
      s2: 79,
      s3: 79,
      total: 79,
      intensity: 79,
      // "We aim to achieve net zero for our own operations by 2050..." / Highlights.
      netzero: 6,
      // Table 4: Total number and rates of new employee hires and voluntary attrition — Total row.
      headcount: 72,
      turnover: 72,
      // "average training hours for permanent and direct contract employees were 34.0 hours in 2025".
      training: 64,
      // "Women now comprise 30% of our Board... women represent 49% of the total workforce and 41% of senior management (SVP to MD)."
      femaleBoard: 69,
      femaleWorkforce: 69,
      femaleSeniorMgmt: 69,
      // Highlights: "Achieved 91% employee engagement score in My Voice survey".
      engagement: 6,
    },
  },

  {
    id: "ocbc",
    name: "Oversea-Chinese Banking Corporation (OCBC)",
    shortName: "OCBC",
    logoInitials: "OC",
    accentColor: "#E39A4D",
    country: "Singapore",
    city: "Singapore",
    climateContext: "Singapore-HQ universal bank; core markets SG, Malaysia, Indonesia, Greater China; insurer Great Eastern",
    businessModel: "Universal bank (commercial + retail + wealth)",
    reportingPeriod: "FY2025",
    dataSource: {
      reportTitle: "OCBC Sustainability Report 2025",
      reportingPeriod: "FY2025 operational",
      url: "https://www.ocbc.com/iwov-resources/sg/ocbc/gbc/pdf/ocbc-sustainability-report-2025.pdf",
      accessDate: "July 2026",
    },
    scope1: 2_001,             // boundary/methodology expanded in 2025 to include fugitive emissions — not a real operational jump vs FY2024's 132
    scope2: 30_551,            // market-based (location-based: 78,650)
    scope3: 3_657,             // operational Scope 3 only — 2025 boundary also expanded to include waste emissions
    totalGHG: 36_209,          // S1 + S2(market) + S3(operational)
    scope2Basis: "Market-based (location-based 78,650 tCO₂e also reported)",
    intensityValue: 0.0094,
    intensityUnit: "tCO2e/ft² floor area (S2 location-based)",
    sf6tCO2e: null,
    systemLossPct: null,
    renewableNote:
      "404 MWh generated from on-site renewable sources in FY2025 (excl. Great Eastern Holdings); of 136,994 MWh grid electricity consumption. Renewable % of consumption not stated.",
    netZeroYear: 2050,
    reductionTarget:
      "Operational carbon neutrality maintained annually. Financed-emissions net zero by 2050 across six priority sectors (NZBA signatory). Insurance subsidiary Great Eastern Holdings also committed to net zero by 2050.",
    headcount: null,           // not re-verified for FY2025 — see dataNotes
    femaleBoardPct: null,      // not re-verified for FY2025 — see dataNotes
    femaleWorkforcePct: 56,    // "Balanced gender mix of 56% women and 44% men across our workforce"
    femaleSeniorMgmtPct: 43,   // "43% of leadership positions (Managing Director and above) filled by women"
    trainingHoursPerEmployee: 54.4,
    employeeTurnoverPct: null, // not re-verified for FY2025 — see dataNotes
    injuryMetricValue: null,
    injuryMetricUnit: "N/A (bank — no material operational injury exposure)",
    communityInvestmentNative: "N/D",
    communityInvestmentNote:
      "No consolidated community-investment SGD total in the SR. 616,521 beneficiaries reached; 17,681 employee volunteers in FY2025.",
    independentDirectorsPct: null,   // not re-verified for FY2025 — see dataNotes
    esgLinkedExecComp: true,         // "sustainability incl. climate incorporated in senior exec scorecards"
    antiCorruptionTrainingPct: 100,  // "Maintained 100% completion of mandatory employee training on fraud awareness, whistleblowing, anti-bribery and anti-corruption"
    externalAssurance: true,         // "we also obtained external assurance for selected indicators" (SR2025 p.2)
    externalAssuranceProvider: null, // provider name not re-confirmed for FY2025 — see dataNotes
    frameworks: ["GRI 2021", "TCFD", "SASB", "UN SDGs"],
    naMetrics: ["sf6tCO2e", "systemLossPct", "injuryMetricValue", "normalizedIntensityKgPerKwh"],
    dataNotes: [
      "Universal bank: operational emissions (36,209 tCO₂e market-based) are immaterial vs financed emissions, which are tracked by sector but not published as one aggregate figure.",
      "In 2025 OCBC expanded its emissions-reporting boundary to include fugitive emissions (Scope 1) and waste-related emissions (Scope 3), and widened entity coverage to include Great Eastern Holdings, OCBC Yuanshen, Pac Lease Berhad (Malaysia), PTOS (Indonesia), and Bank of Singapore (Hong Kong/Malaysia). This is why Scope 1 jumped from 132 (FY2024) to 2,001 (FY2025) tCO₂e — a boundary change, not a real operational increase.",
      "Scope 2 shown is market-based (30,551 tCO₂e); location-based 78,650 tCO₂e.",
      "Financed-emissions detail (sector-by-sector targets, sustainable-finance commitments) was not re-verified this cycle — see FY2024 figures retained only in historical notes if needed; not carried into this record to avoid mixing verification cycles.",
      "Headcount, board gender %, board independence %, employee turnover %, and the specific external-assurance provider are ordinarily sourced from the Performance Data appendix / GRI Content Index (report pages ~80–143) or the Annual Report's Corporate Governance section; those pages did not extract as text and no Annual Report was available for FY2025 verification, so these are left as N/D rather than carrying forward the FY2024 figures unverified. (The FY2024 board-gender figure was itself sourced from the Annual Report, not the Sustainability Report, since the prior SR's own chart — '40%' — did not reconcile; the same risk applies to any SR-only figure found in future.)",
      "Anti-corruption training %: newly confirmed at 100% for FY2025 (previously N/D) — 'Maintained 100% completion of mandatory employee training on fraud awareness, whistleblowing, anti-bribery and anti-corruption.'",
      "SF₆, system loss and injury rate are N/A for a bank.",
    ],
    citationPages: {
      // Verified July 2026 against OCBC Sustainability Report 2025 (Drive copy).
      // "Our Operational Footprint" table — Energy / Emissions, FY2025 column.
      s1: 57,
      s2: 57,
      s3: 57,
      total: 57,
      intensity: 57,
      // "OCBC is committed to accelerating the transition to a net-zero future..." / GEH also net zero by 2050.
      netzero: 19,
      // Targets and Performance Dashboard — People: "average of 54.4 training hours completed".
      training: 8,
      // Targets and Performance Dashboard — Workplace: "43% of leadership positions... filled by women" / "56% women and 44% men".
      femaleWorkforce: 8,
      femaleSeniorMgmt: 8,
      // Conducting Our Business Responsibly: "100% completion of mandatory employee training on fraud awareness, whistleblowing, anti-bribery and anti-corruption".
      antiCorruptionTraining: 9,
    },
  },

  {
    id: "uob",
    name: "United Overseas Bank (UOB)",
    shortName: "UOB",
    logoInitials: "UO",
    accentColor: "#6E9BE8",
    country: "Singapore",
    city: "Singapore",
    climateContext: "Singapore-HQ, ASEAN-focused universal bank; SG, Malaysia, Thailand, Indonesia, Vietnam, Greater China",
    businessModel: "Universal bank (commercial + retail + wealth)",
    reportingPeriod: "FY2025",
    dataSource: {
      reportTitle: "UOB Sustainability Report 2025",
      reportingPeriod: "FY2025 (1 Jan – 31 Dec 2025)",
      url: "https://www.uobgroup.com/investor-relations/assets/pdfs/investor/annual/uob-sustainability-report-2025.pdf",
      accessDate: "July 2026",
    },
    scope1: null,              // not re-verified for FY2025 — see dataNotes
    scope2: null,              // not re-verified for FY2025 — see dataNotes
    scope3: null,              // not re-verified for FY2025 — see dataNotes
    totalGHG: null,            // not re-verified for FY2025 — see dataNotes
    scope2Basis: "N/D — not re-verified for FY2025",
    intensityValue: 75.4,
    intensityUnit: "kgCO2e/m² floor (S1+2 location-based)",
    sf6tCO2e: null,
    systemLossPct: null,
    renewableNote:
      "Operationally carbon-neutral (own operations, incl. Scope 3 business air travel and operational waste). Absolute renewable-energy figures for FY2025 not re-verified — see dataNotes.",
    netZeroYear: 2050,
    reductionTarget:
      "Operational: −25% combined S1+2 emissions intensity by 2030 vs 2018 baseline — FY2025 achieved −30.4% (already ahead of the 2030 target). Financed-emissions net zero by 2050 across six priority sectors. Carbon-neutral operations maintained.",
    headcount: null,           // not re-verified for FY2025 — see dataNotes
    femaleBoardPct: null,      // not re-verified for FY2025 — see dataNotes
    femaleWorkforcePct: null,  // not re-verified for FY2025 — see dataNotes
    femaleSeniorMgmtPct: null, // not re-verified for FY2025 — see dataNotes
    trainingHoursPerEmployee: null, // not re-verified for FY2025 — see dataNotes
    employeeTurnoverPct: null, // not re-verified for FY2025 — see dataNotes
    injuryMetricValue: null,
    injuryMetricUnit: "N/A (bank — office injury rate reported, not industrial LTIFR)",
    communityInvestmentNative: "N/D",  // not re-verified for FY2025 — see dataNotes
    communityInvestmentNote:
      "SGD 16.1M was the FY2024 monetary community contribution (GRI 201-1, EY-assured); the FY2025 equivalent figure was not located within the extracted portion of the report and is not carried forward. Avg 2.8 volunteer hours/employee reported for FY2025.",
    independentDirectorsPct: null,   // not re-verified for FY2025 — see dataNotes
    esgLinkedExecComp: true,         // "Variable pay pool is based on the performance against the Group Balanced Scorecard, which includes a sustainability-related metric"
    antiCorruptionTrainingPct: 100,  // "Maintained 100 per cent completion by all eligible employees of mandatory e-learning on AML/CFT and sanctions, fraud awareness, anti-bribery and anti-corruption"
    externalAssurance: true,
    externalAssuranceProvider: "Ernst & Young LLP (limited; ISAE 3000) — financed emissions NOT assured",
    frameworks: ["GRI 2021", "TCFD", "IFRS S1", "PCAF", "SBTi", "UN SDGs"],
    naMetrics: ["sf6tCO2e", "systemLossPct", "injuryMetricValue", "normalizedIntensityKgPerKwh"],
    dataNotes: [
      "UOB Sustainability Report 2025 is a much larger document (188 pages, per its own Assurance Statement page reference) than could be fully extracted this cycle — extraction covered roughly the first 73 pages. The 'Direct Environmental Impact' data table (report page 109) and the 'Sustainability in Numbers' appendix (report page 125) — which hold the absolute Scope 1/2/3 GHG figures, headcount, board composition, community-investment SGD total, and training-hours breakdown — were NOT captured, so those fields are left as N/D rather than carrying forward FY2024 figures under a FY2025 label.",
      "GHG intensity IS confirmed for FY2025: combined Scope 1+2 emissions intensity (location-based) fell to 75.4 kgCO2e/m²/year, a 30.4% reduction vs the 2018 baseline of 108.2 — already ahead of the 2030 target of 81.1 (−25%). FY2024 was 88.8 (the figure previously stored in this dataset under the FY2024 period).",
      "Anti-corruption training %: newly confirmed at 100% for FY2025 (previously N/D) — 'Maintained 100 per cent completion by all eligible employees of mandatory e-learning on AML/CFT and sanctions, fraud awareness, anti-bribery and anti-corruption.'",
      "Board: 'Two female directors served on the UOB Board' is stated for FY2025, but total board size was not confirmed within the extracted pages, so femaleBoardPct is left as N/D rather than assuming the FY2024 board size of 10 still holds.",
      "External assurance (Ernst & Young LLP, ISAE 3000, against GRI Standards) is explicitly restated for FY2025 in the report's 'About This Report' section.",
      "Training: FY2025 headline is 4.9 training days/employee (down from 5.2 in FY2024); no hours-equivalent breakdown table was found within the extracted pages, so trainingHoursPerEmployee is left as N/D rather than re-deriving with an assumed hours-per-day conversion.",
      "SF₆, system loss, industrial LTIFR N/A for a bank.",
    ],
    citationPages: {
      // Verified July 2026 against UOB Sustainability Report 2025 (Drive copy).
      // "UOB | Net Zero Commitment by 2050".
      netzero: 14,
      // "Combined Scope 1 and 2 emissions intensity (kgCO2e/m2/year)" chart: 2025 = 75.4.
      intensity: 38,
      // "Maintained 100 per cent completion... anti-bribery and anti-corruption."
      antiCorruptionTraining: 58,
    },
  },
];
