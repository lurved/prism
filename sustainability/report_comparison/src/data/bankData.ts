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
    accentColor: "#d11241",
    country: "Singapore",
    city: "Singapore",
    climateContext: "Singapore-HQ universal bank; core markets SG, HK, Greater China, S/SE Asia, India",
    businessModel: "Universal bank (commercial + retail + wealth)",
    reportingPeriod: "FY2024",
    dataSource: {
      reportTitle: "DBS Group Holdings Sustainability Report 2024",
      reportingPeriod: "FY2024 (1 Jan – 31 Dec 2024)",
      url: "https://www.dbs.com/iwov-resources/images/sustainability/reporting/pdf/web/DBS_SR2024.pdf",
      accessDate: "June 2026",
    },
    scope1: 1_300,
    scope2: 26_322,           // market-based (location-based: 50,889)
    scope3: 56_162,           // OPERATIONAL Scope 3 only (financed emissions not aggregated)
    totalGHG: 83_784,         // S1 + S2(market) + S3(operational)
    scope2Basis: "Market-based (location-based 50,889 tCO₂e also reported)",
    intensityValue: 3.76,
    intensityUnit: "tCO2e/SGD M income (operational)",
    sf6tCO2e: null,
    systemLossPct: null,
    renewableNote:
      "Onsite renewable 1,488 MWh; 47,800 MWh of RECs purchased (HK, China, India, Indonesia). Renewable % of consumption not stated. 40/41 SG branches BCA Green Mark Platinum.",
    netZeroYear: 2050,
    reductionTarget:
      "Own-operations net zero by 2050 (interim 2030 CRREM-aligned S1+2 target). Financed-emissions net zero by 2050 across nine priority sectors (Power by 2040).",
    headcount: 41_638,
    femaleBoardPct: 20,
    femaleWorkforcePct: 49,
    trainingHoursPerEmployee: 33.4,
    injuryMetricValue: null,
    injuryMetricUnit: "N/A (bank — no material operational injury exposure)",
    communityInvestmentNative: "SGD 1B / 10yr (DBS Foundation)",
    communityInvestmentNote:
      "DBS Foundation commitment of up to SGD 1 billion over 10 years; no annual community-investment SGD total disclosed in the SR. Employee volunteering >270,000 hours in FY2024.",
    independentDirectorsPct: null,   // in Annual Report, not the SR
    antiCorruptionTrainingPct: null, // DBS explicitly does not report this % (GRI 205-2)
    externalAssurance: true,
    externalAssuranceProvider: "PwC Singapore (limited; SSAE 3000/3410) — financed emissions NOT assured",
    frameworks: ["GRI 2021", "TCFD", "SASB", "IFRS S2"],
    naMetrics: ["sf6tCO2e", "systemLossPct", "injuryMetricValue", "normalizedIntensityKgPerKwh"],
    dataNotes: [
      "Universal bank: operational emissions (83,784 tCO₂e incl. operational Scope 3) are tiny vs FINANCED emissions, which dominate but are NOT aggregated into one figure — DBS discloses per-sector intensity/absolute targets only.",
      "Scope 2 shown is market-based (26,322 tCO₂e); location-based is 50,889 tCO₂e (difference = RECs in HK/China/India/Indonesia).",
      "Scope 3 (56,162 tCO₂e) is OPERATIONAL only (Cats 1,3,4,5,6,7,8,13). Financed emissions (Cat 15) are tracked by sector, not aggregated, and are explicitly outside external assurance.",
      "Financed-emissions progress: Power 208 kgCO₂/MWh (on track to 138 by 2030); Oil & Gas 26.4 MtCO₂e (on track); Steel and Shipping not on track. PCAF referenced.",
      "Sustainable finance: SGD 89bn commitments at Dec 2024 (from SGD 70bn); SGD 38bn sustainable bonds facilitated in FY2024.",
      "Employee engagement 91% (My Voice 2024). Voluntary attrition 6.6%. Female senior management (SVP–MD) 41%.",
      "Independent directors % and ESG-linked exec comp are in the Annual Report, not the SR (N/D here). Anti-corruption training %: DBS explicitly does not report it.",
      "SF₆, system loss and industrial injury rate are N/A for a bank.",
    ],
  },

  {
    id: "ocbc",
    name: "Oversea-Chinese Banking Corporation (OCBC)",
    shortName: "OCBC",
    logoInitials: "OC",
    accentColor: "#e60012",
    country: "Singapore",
    city: "Singapore",
    climateContext: "Singapore-HQ universal bank; core markets SG, Malaysia, Indonesia, Greater China; insurer Great Eastern",
    businessModel: "Universal bank (commercial + retail + wealth)",
    reportingPeriod: "FY2024",
    dataSource: {
      reportTitle: "OCBC Sustainability Report 2024",
      reportingPeriod: "FY2024 operational; financed-emissions data year 2023 (PCAF lag)",
      url: "https://www.ocbc.com/iwov-resources/sg/ocbc/gbc/pdf/ocbc-sustainability-report-2024.pdf",
      accessDate: "June 2026",
    },
    scope1: 132,              // excludes refrigerants (not consolidated)
    scope2: 35_373,           // market-based (location-based: 68,391)
    scope3: 3_475,            // operational Scope 3 only
    totalGHG: 38_980,         // S1 + S2(market) + S3(operational)
    scope2Basis: "Market-based (location-based 68,391 tCO₂e also reported)",
    intensityValue: 0.0117,
    intensityUnit: "tCO2e/ft² floor area (S2 location-based)",
    sf6tCO2e: null,
    systemLossPct: null,
    renewableNote:
      "Additional solar installed in Malaysia and China in 2024. Onsite renewable not consolidated for reporting. Operational carbon neutrality achieved in 2024 via RECs + offsets.",
    netZeroYear: 2050,
    reductionTarget:
      "Operational carbon neutrality maintained annually. Financed-emissions net zero by 2050 across six priority sectors (NZBA signatory).",
    headcount: 33_655,        // incl. Great Eastern Holdings
    femaleBoardPct: 40,
    femaleWorkforcePct: 56,
    trainingHoursPerEmployee: 54.3,
    injuryMetricValue: null,
    injuryMetricUnit: "N/A (bank — no material operational injury exposure)",
    communityInvestmentNative: "N/D",
    communityInvestmentNote:
      "No consolidated community-investment SGD total in the SR. 17,666 employee volunteers across 531 projects.",
    independentDirectorsPct: null,   // 'majority' independent stated, but % only in Annual Report
    antiCorruptionTrainingPct: null,
    externalAssurance: true,
    externalAssuranceProvider: "PwC Singapore (limited; SSAE 3000/3410) — financed emissions NOT assured",
    frameworks: ["GRI 2021", "TCFD", "SASB", "UN SDGs"],
    naMetrics: ["sf6tCO2e", "systemLossPct", "injuryMetricValue", "normalizedIntensityKgPerKwh"],
    dataNotes: [
      "Universal bank: operational emissions (38,980 tCO₂e market-based) are immaterial vs financed emissions, which are tracked by sector but not published as one aggregate figure.",
      "Financed-emissions progress uses 2023 measurement-year data (standard PCAF one-year lag); operational data is FY2024.",
      "Scope 1 (132 tCO₂e) EXCLUDES refrigerants (not yet consolidated), so it understates true Scope 1.",
      "Scope 2 shown is market-based (35,373 tCO₂e); location-based 68,391 tCO₂e. The market-based figure rose ~50% YoY due to a methodology change, not a real increase.",
      "Financed sectors (2023 data): Real Estate alignment −4.0% (on track); Steel 1.91 tCO₂/tSteel (on track to 1.68 by 2030). PCAF data-quality scoring applied.",
      "Sustainable finance: SGD 71bn committed portfolio at end-2024 (+SGD 15bn YoY); >SGD 9bn to SMEs since 2020.",
      "Board female %: chart shows 40% (4 of ~10 directors); text notes 'more than 25% women' (CBD target met). Female senior management 38%; all-leadership 42%.",
      "Independent directors % (exact) and community-investment SGD total are not in the SR (N/D). SF₆, system loss, injury rate N/A for a bank.",
    ],
  },

  {
    id: "uob",
    name: "United Overseas Bank (UOB)",
    shortName: "UOB",
    logoInitials: "UO",
    accentColor: "#003da5",
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
    femaleBoardPct: null,     // SR shows Management Committee (20%), not Board; Board % in Annual Report
    femaleWorkforcePct: 62.5,
    trainingHoursPerEmployee: 36.6, // derived from p115 by-gender hours; report headline is "5.2 training days"
    injuryMetricValue: null,
    injuryMetricUnit: "N/A (bank — office injury rate 0.10/100 FTE reported, not industrial LTIFR)",
    communityInvestmentNative: "SGD 16.1M",
    communityInvestmentNote:
      "SGD 16.1M monetary community contributions in FY2024 (GRI 201-1, EY-assured), incl. UOB Heartbeat Run (>SGD 3M). Avg 2.9 volunteer hours/employee.",
    independentDirectorsPct: null,   // Board composition in Annual Report, not the SR
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
      "Female board %: N/D in SR (only Group Management Committee shown = 20%; Board is in the Annual Report). Female workforce 62.5%; female senior management 38.4%.",
      "Training: report headline is 5.2 training days/employee; ~36.6 hrs derived from the by-gender hours table. Attrition 13.6%.",
      "Independent directors % is in the Annual Report (N/D here). SF₆, system loss, industrial LTIFR N/A for a bank.",
    ],
  },
];
