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
      url: "https://www.dbs.com/iwov-resources/images/sustainability/reporting/pdf/web/DBS_SR2024.pdf",
      accessDate: "August 2026",
    },
    scope1: 1_148,            // backup generators 75 + owned vehicles 4 + refrigerants/fire retardants 1,069
    scope2: 23_571,           // market-based (location-based: 50,091)
    scope3: 51_987,           // OPERATIONAL Scope 3 only (financed emissions not aggregated)
    totalGHG: 76_706,         // S1 + S2(market) + S3(operational); location-based total 103,226
    scope2Basis: "Market-based (location-based 50,091 tCO₂e also reported)",
    intensityValue: 39,
    intensityUnit: "kgCO2e/m² GFA (S1+2 market-based)",
    sf6tCO2e: null,
    systemLossPct: null,
    renewableNote:
      "RECs purchased across HK, China, India and Indonesia; renewable % of consumption not stated. Market-based Scope 2 is materially below location-based as a result.",
    netZeroYear: 2050,
    reductionTarget:
      "Own-operations net zero by 2050 (interim 2030 CRREM-aligned S1+2 target). Financed-emissions net zero by 2050 across nine priority sectors (Power by 2040).",
    headcount: 39_983,
    femaleBoardPct: null,      // FY2024 figure came from the Annual Report CG section; AR2025 not held
    femaleWorkforcePct: 49,
    femaleSeniorMgmtPct: 41,   // SVP–MD level
    trainingHoursPerEmployee: null,
    employeeTurnoverPct: null, // voluntary attrition reported by age/gender band, not as a group rate
    employeeEngagementScore: 91, // My Voice 2025
    injuryMetricValue: null,
    injuryMetricUnit: "N/A (bank — no material operational injury exposure)",
    communityInvestmentNative: "N/D",
    communityInvestmentBasis: "not_disclosed",
    communityInvestmentNote:
      "No consolidated annual community-investment total located in SR2025 for FY2025.",
    independentDirectorsPct: null, // Annual Report CG section; AR2025 not held
    esgLinkedExecComp: true,       // balanced-scorecard linkage restated in SR2025
    antiCorruptionTrainingPct: null,
    externalAssurance: null,       // assurance statement not located in the extracted text
    externalAssuranceProvider: null,
    frameworks: ["GRI 2021", "TCFD", "SASB", "IFRS S2"],
    sustainableFinanceNative: null,
    financedEmissionsStatus: null,
    naMetrics: ["sf6tCO2e", "systemLossPct", "injuryMetricValue", "normalizedIntensityKgPerKwh"],
    // Not yet read from SR2025 for THIS period. These render as "pending",
    // never N/D — several sit in the Annual Report, which we do not hold.
    notExtracted: [
      "female_board_pct", "independent_directors_pct", "training_hours_per_employee",
      "turnover_pct", "anti_corruption_training_pct", "community_investment",
      "external_assurance", "safety_rate",
    ],
    dataNotes: [
      "PERIOD REFRESHED to FY2025 (Aug 2026) from DBS Sustainability Report 2025.",
      "RESTATEMENT: SR2025 restates every FY2024 emissions figure. Total GHG (market-based) FY2024 is restated from 83,784 to 81,852 tCO₂e; Scope 1 from 1,300 to 1,484; Scope 2 market-based from 26,322 to 24,871; Scope 3 from 56,162 to 55,497. Year-on-year movement must be read against the RESTATED comparatives, not against the figures previously shown here.",
      "Universal bank: operational emissions (76,706 tCO₂e market-based) are tiny vs FINANCED emissions, which dominate but are NOT aggregated into one figure — DBS discloses per-sector intensity/absolute targets only.",
      "Scope 2 shown is market-based (23,571 tCO₂e); location-based is 50,091 tCO₂e. Total on a location basis is 103,226 tCO₂e.",
      "Scope 1 composition FY2025: backup generators 75, owned vehicle transport 4, refrigerants and fire retardants 1,069 tCO₂e. Reporting on petrol and diesel vehicles for executive transport was discontinued in 2025.",
      "Headcount fell to 39,983 (FY2024: 41,638), attributed in the report to higher voluntary attrition and post-integration optimisation in India and Taiwan.",
      "Female workforce 49% and female senior management (SVP–MD) 41% — both unchanged from FY2024.",
      "PENDING: board composition, independent directors, training hours, turnover rate, community investment, anti-corruption training and the assurance statement were not located in the extracted text and several sit in the Annual Report, which is not held. They render as 'pending', not N/D.",
      "SF₆, system loss and industrial injury rate are N/A for a bank.",
    ],
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
      reportingPeriod: "FY2025 (1 Jan – 31 Dec 2025)",
      url: "https://www.ocbc.com/iwov-resources/sg/ocbc/gbc/pdf/ocbc-sustainability-report-2024.pdf",
      accessDate: "August 2026",
    },
    scope1: 2_001,            // now INCLUDES fugitive emissions (FY2024: 132, which excluded them)
    scope2: 30_551,           // market-based (location-based: 78,650)
    scope3: 3_657,            // operational Scope 3: business air travel + waste
    totalGHG: 36_209,         // S1 + S2(market) + S3
    scope2Basis: "Market-based (location-based 78,650 tCO₂e also reported)",
    intensityValue: 0.0094,
    intensityUnit: "tCO2e/ft² floor area (S2 location-based)",
    sf6tCO2e: null,
    systemLossPct: null,
    renewableNote:
      "Market-based Scope 2 is projected to fall to 25,518 tCO₂e once EACs for China and Malaysia are issued; those certificates were NOT used to adjust the reported figure. Operational carbon neutrality maintained.",
    netZeroYear: 2050,
    reductionTarget:
      "Operational carbon neutrality maintained annually. Financed-emissions net zero by 2050 across six priority sectors (NZBA signatory).",
    headcount: null,          // "over 30,000 employees across 19 locations" — not an exact figure
    femaleBoardPct: null,     // Annual Report CG section; AR2025 not held
    femaleWorkforcePct: 56,
    femaleSeniorMgmtPct: 43,  // leadership positions, Managing Director and above
    trainingHoursPerEmployee: null,
    employeeTurnoverPct: null,
    injuryMetricValue: null,
    injuryMetricUnit: "N/A (bank — no material operational injury exposure)",
    communityInvestmentNative: "N/D",
    communityInvestmentBasis: "not_disclosed",
    communityInvestmentNote:
      "No consolidated community-investment total in SR2025; the report cites a 13% increase in community engagement activities.",
    independentDirectorsPct: null,
    esgLinkedExecComp: true,
    antiCorruptionTrainingPct: null,
    externalAssurance: true,
    externalAssuranceProvider: "External assurance obtained for selected indicators (SR2025 p.140)",
    frameworks: ["GRI 2021", "TCFD", "SASB", "UN SDGs"],
    sustainableFinanceNative: null,
    financedEmissionsStatus: null,
    naMetrics: ["sf6tCO2e", "systemLossPct", "injuryMetricValue", "normalizedIntensityKgPerKwh"],
    notExtracted: [
      "female_board_pct", "independent_directors_pct", "training_hours_per_employee",
      "turnover_pct", "anti_corruption_training_pct", "community_investment",
      "headcount", "safety_rate",
    ],
    dataNotes: [
      "PERIOD REFRESHED to FY2025 (Aug 2026) from OCBC Sustainability Report 2025.",
      "BOUNDARY EXPANSION, material: Scope 1 rose from 132 to 2,001 tCO₂e because fugitive emissions were brought into the inventory and entity coverage was widened to align with the IFRS Sustainability Disclosure Standards. This is NOT a real increase in emissions. Read year-on-year movement with that in mind.",
      "Consolidation approach is OPERATIONAL CONTROL, covering Great Eastern Holdings, OCBC Yuanshen, Pac Lease Berhad, PTOS, and Bank of Singapore (HK and MY). International branches are excluded as together under 1.5% of Group emissions, assessed as immaterial under IFRS S2.",
      "GWP values are taken from the GHG Protocol 'Global Warming Potential Values' (August 2024) — one of the very few entities in this set to state a GWP basis at all.",
      "Scope 1 excludes Great Eastern Holdings' fugitive emissions. R22 (HCFC-22) is excluded per EPA and GHG Protocol guidance; 52.4 kg of R22 was recorded in 2025.",
      "Scope 2 shown is market-based (30,551 tCO₂e); location-based is 78,650 tCO₂e. Scope 2 intensity improved to 0.0094 from 0.0117 tCO₂e/ft², though the GFA denominator methodology was also refined during the year.",
      "Scope 3 (3,657 tCO₂e) comprises business air travel plus, newly for 2025, emissions associated with waste.",
      "Water consumption rose to 765,070 m³ (FY2024: 470,083) alongside the same entity-coverage expansion.",
      "Headcount is described as 'over 30,000 employees across 19 locations' — not an exact figure, so it is left pending rather than approximated.",
      "PENDING: board composition, independent directors, training hours, turnover, community investment and anti-corruption training were not located in the extracted text. They render as 'pending', not N/D.",
      "SF₆, system loss and industrial injury rate are N/A for a bank.",
    ],
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
    reportingPeriod: "FY2024",
    dataSource: {
      reportTitle: "UOB Sustainability Report 2024",
      reportingPeriod: "FY2024 operational; financed-emissions data year 2023 (PCAF lag)",
      url: "https://www.uobgroup.com/investor-relations/assets/pdfs/investor/annual/uob-sustainability-report-2024.pdf",
      accessDate: "June 2026",
    },
    scope1: 5_100,            // refrigerants 1,800 + fuel 200 + vehicles 3,100
    scope2: 1_700,            // market-based after RECs (location-based: 73,700)
    scope3: 8_900,            // business air travel only (operational)
    totalGHG: 15_800,         // S1 + S2(market) + S3(air travel); carbon neutral via 15,753 offsets
    scope2Basis: "Market-based (location-based 73,700 tCO₂e); carbon-neutral via RECs + offsets",
    intensityValue: 88.8,
    intensityUnit: "kgCO2e/m² floor (S1+2 location-based, excl. data centres)",
    sf6tCO2e: null,
    systemLossPct: null,
    renewableNote:
      "Onsite solar 0.21 GWh (Thailand + Indonesia); 139.3 GWh of RECs redeemed (I-REC/TIGR). Operationally carbon-neutral since 2021.",
    netZeroYear: 2050,
    reductionTarget:
      "Operational: −25% S1+2 intensity by 2030 vs 2018 (−17.9% to date). Financed-emissions net zero by 2050 across six priority sectors. Carbon-neutral operations since 2021.",
    headcount: 32_071,        // incl. Citigroup-acquired employees
    femaleBoardPct: 20,        // 2 of 10 directors (FY2024 Annual Report CG section)
    femaleWorkforcePct: 62.5,
    femaleSeniorMgmtPct: 38.4,
    trainingHoursPerEmployee: 36.6, // derived from p115 by-gender hours; report headline is "5.2 training days"
    employeeTurnoverPct: 13.6,
    injuryMetricValue: null,
    injuryMetricUnit: "N/A (bank — office injury rate 0.10/100 FTE reported, not industrial LTIFR)",
    sustainableFinanceNative: "SGD 58.0bn portfolio (31 Dec 2024)",
    financedEmissionsStatus:
      "2023 data year, all on track: Power 242 kgCO₂/MWh; Automotive 121 gCO₂/veh-km; Real estate 80 kgCO₂/m²; Steel 1.64 tCO₂/t. PCAF + PACTA + SBTi + GFANZ.",
    communityInvestmentNative: "SGD 16.1M",
    communityInvestmentBasis: "annual",
    communityInvestmentNote:
      "SGD 16.1M monetary community contributions in FY2024 (GRI 201-1, EY-assured), incl. UOB Heartbeat Run (>SGD 3M). Avg 2.9 volunteer hours/employee.",
    independentDirectorsPct: 70,     // 7 of 10 (FY2024 Annual Report CG section)
    esgLinkedExecComp: true,         // sustainability metrics embedded in Group Balanced Scorecard
    antiCorruptionTrainingPct: null, // GRI 205-2 assured; % not stated (100% info-security training reported instead)
    externalAssurance: true,
    externalAssuranceProvider: "Ernst & Young LLP Singapore (limited; ISAE 3000/3410) — financed emissions NOT assured",
    frameworks: ["GRI 2021", "TCFD", "IFRS S1", "PCAF", "SBTi", "UN SDGs"],
    naMetrics: ["sf6tCO2e", "systemLossPct", "injuryMetricValue", "normalizedIntensityKgPerKwh"],
    dataNotes: [
      "Universal bank: operational emissions (15,800 tCO₂e market-based; 87,700 location-based) are immaterial vs financed emissions. UOB has been operationally carbon-neutral every year since 2021.",
      "Financed-emissions progress uses 2023 data (PCAF lag); no single aggregate financed-emissions figure is disclosed.",
      "Scope 2 shown is market-based (1,700 tCO₂e) after RECs; location-based 73,700 tCO₂e is the basis for the intensity target.",
      "Scope 3 (8,900 tCO₂e) is business air travel only — UOB's defined operational Scope 3 line; financed emissions tracked separately.",
      "Financed sectors (2023, all on track): Power 242 kgCO₂/MWh; Automotive 121 gCO₂/veh-km; Real estate 80 kgCO₂/m²; Construction; Steel 1.64 tCO₂/t. Methodology: PCAF + PACTA + SBTi + GFANZ.",
      "Sustainable finance: SGD 58.0bn portfolio at 31 Dec 2024 (new end-of-period basis); SGD 23.1bn extended during FY2024.",
      "Board: 2 of 10 directors are women (20%) and 7 of 10 are independent (70%) per the FY2024 Annual Report CG section (the SR only showed the Group Management Committee). Female workforce 62.5%; female senior management 38.4%.",
      "Training: report headline is 5.2 training days/employee; ~36.6 hrs derived from the by-gender hours table. Attrition 13.6%.",
      "SF₆, system loss, industrial LTIFR N/A for a bank. Anti-corruption training % not disclosed (100% information-security training reported instead).",
    ],
  },
];
