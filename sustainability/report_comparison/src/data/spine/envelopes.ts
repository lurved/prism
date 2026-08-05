/**
 * DISCLOSURE ENVELOPES — the GHG Protocol accounting basis per entity.
 *
 * Nothing here is new research. Every field is promoted from something the
 * datasets ALREADY record — a code comment, a `dataNotes` string, or an
 * existing field — and the source is quoted alongside it. Promoting them from
 * prose into structure is the whole point: as prose they cannot be compared,
 * filtered or checked; as fields they decide whether two figures may sit in
 * the same comparison (see comparability.ts).
 *
 * Where a report does not state something, the value is "not_stated" / null.
 * Nothing is inferred — an unstated consolidation approach is a finding, not a
 * blank to be filled with the most likely answer.
 */
import type { Envelope } from "./types";

const base = {
  gwpSource: "not_stated" as const, // no entity in the current set states its IPCC AR version
  baseYearNote: null as string | null,
};

export const ENVELOPES: Record<string, Envelope> = {
  /* ── Temasek ───────────────────────────────────────────────────── */
  sembcorp: {
    ...base,
    // dataNotes: "Scope 1+2 emissions use equity-share approach."
    consolidation: "equity_share",
    // scope2Emissions comment: "location-based; market-based disclosure not separately stated"
    scope2Method: "location_based",
    // dataNotes: "Scope 3 includes Categories 3, 11, and 15 only"
    scope3Categories: [3, 11, 15],
    baseYear: "2010",
    baseYearNote: "Intensity baseline 0.40 tCO₂e/MWh (2010); no absolute Scope 1+2 baseline stated.",
    assurance: "external_limited",
    assuranceProvider: "DNV; ERM CVS (Scope 1+2)",
  },
  smrt: {
    ...base,
    consolidation: "unknown", // not stated in SR2024/25
    // dataNotes: "SMRT's Scope 2 is not labelled location- or market-based"
    scope2Method: "not_stated",
    scope3Categories: null, // categories not enumerated
    baseYear: "2022",
    baseYearNote: "Target is −20% vs 2022 levels by 2030; total GHG has risen with network expansion.",
    // dataNotes: "No external assurance ... internal audit of Scope 1 & 2 only"
    assurance: "internal_only",
    assuranceProvider: null,
  },
  singtel: {
    ...base,
    consolidation: "unknown", // not stated in SR2025
    // scope2Emissions comment: "market-based; location-based: 467.7 ktCO2e (FY2024)"
    scope2Method: "market_based",
    // dataNotes: "full 15-category total = 2,309.4 ktCO2e"
    scope3Categories: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    baseYear: "FY2023",
    baseYearNote:
      "FY2023 SBTi baseline 440.6 ktCO₂e. FY2025 Scope 1 rose 57.2% due to reporting-scope expansion (Global Offices + NCS), not a real increase — a GHG Protocol base-year recalculation trigger.",
    assurance: "external_limited",
    assuranceProvider: "EY",
  },

  /* ── Electricity utilities ─────────────────────────────────────── */
  meralco: {
    ...base,
    // dataNotes: "Figures are equity-adjusted group totals."
    consolidation: "equity_share",
    // scope2Basis: "Location-based (energy purchased) + system loss"
    scope2Method: "location_based",
    scope3Categories: null,
    baseYear: null,
    assurance: "external_limited",
    assuranceProvider: "DNV (VeriSustain v6.0; AA1000AS v3)",
  },
  clp: {
    ...base,
    // "Figures = CLP GROUP on an equity basis"
    consolidation: "equity_share",
    // scope2Basis: "N/D (single Scope 2 figure; location/market basis not labelled)"
    scope2Method: "not_stated",
    // "Cats 1,2,3,5,6,7,11"
    scope3Categories: [1, 2, 3, 5, 6, 7, 11],
    baseYear: "2019",
    baseYearNote: "Science-based targets vs 2019 baseline; GHG of electricity sold 60,644 kt (2019) → 24,520 kt (2025).",
    assurance: "external_limited",
    assuranceProvider: "KPMG (ISAE 3000 Revised; ISAE 3410)",
  },
  nationalgrid: {
    ...base,
    // "Figures = National Grid Group (UK + USA), GHG Protocol operational control"
    consolidation: "operational_control",
    // scope2Basis: "Location-based (explicitly stated; market-based not reported)"
    scope2Method: "location_based",
    scope3Categories: null, // "full value chain", categories not enumerated in the 20-F
    baseYear: "2018/19",
    baseYearNote: "Scope 1+2 target −60% by 2030/31 vs 2018/19 (SBTi-approved).",
    assurance: "external_limited",
    assuranceProvider: "Deloitte LLP (ISAE 3000 Revised; ISAE 3410)",
  },

  /* ── Banks ─────────────────────────────────────────────────────── */
  dbs: {
    ...base,
    consolidation: "unknown",
    // Both bases disclosed: market 26,322 / location 50,889 — dual reporting satisfied.
    scope2Method: "dual_reported",
    // "OPERATIONAL only (Cats 1,3,4,5,6,7,8,13)"
    scope3Categories: [1, 3, 4, 5, 6, 7, 8, 13],
    baseYear: null,
    baseYearNote: "Interim 2030 CRREM-aligned Scope 1+2 target; baseline year not stated in the extract.",
    assurance: "external_limited",
    assuranceProvider: "PwC Singapore (SSAE 3000/3410) — financed emissions NOT assured",
  },
  ocbc: {
    ...base,
    consolidation: "unknown",
    scope2Method: "dual_reported", // market 35,373 / location 68,391
    scope3Categories: null, // operational Scope 3, categories not enumerated
    baseYear: null,
    assurance: "external_limited",
    assuranceProvider: "PwC Singapore (SSAE 3000/3410) — financed emissions NOT assured",
  },
  uob: {
    ...base,
    consolidation: "unknown",
    scope2Method: "dual_reported", // market 1,700 / location 73,700
    scope3Categories: null, // business air travel only; category number not stated in the extract
    baseYear: "2018",
    baseYearNote: "Operational target −25% Scope 1+2 intensity by 2030 vs 2018 (−17.9% to date).",
    assurance: "external_limited",
    assuranceProvider: "Ernst & Young LLP Singapore (ISAE 3000/3410) — financed emissions NOT assured",
  },

  /* ── Healthcare ────────────────────────────────────────────────── */
  ihh: {
    ...base,
    consolidation: "unknown",
    // NOTE: IHH mixes bases — the published intensity is location-based while
    // the combined Scope 1+2 absolute is market-based. The entity-level
    // declaration (location_based) is kept, and the market-based caveat rides
    // on the scope1and2_abs cell, where a reader meets the number.
    scope2Method: "location_based",
    scope3Categories: [3, 5, 6, 7],
    baseYear: "2025",
    baseYearNote: "−42% Scope 1+2 vs a 2025 baseline (SBTi-referenced), announced Apr 2026. Earlier 2022 baseline 277,628 tCO₂e.",
    assurance: "internal_only",
    assuranceProvider: "SR 2025 not externally assured; external assurance targeted FY2027",
  },
  tmg: {
    ...base,
    consolidation: "unknown",
    scope2Method: "not_stated",
    scope3Categories: null,
    baseYear: null,
    assurance: "unknown",
    assuranceProvider: null,
  },
  rmg: {
    ...base,
    consolidation: "unknown",
    // "Scope 2 location/market basis is not stated."
    scope2Method: "not_stated",
    scope3Categories: null, // Scope 3 not reported at all
    baseYear: null,
    baseYearNote: "Medium-term target includes reducing Scope 1+2; baseline not quantified in the extract.",
    assurance: "none",
    assuranceProvider: "External assurance not commissioned for FY2025",
  },
};

/** Fiscal year-ends, for the IFRS S1 vintage-spread warning. */
export const FISCAL_YEAR_END: Record<string, string> = {
  sembcorp: "12-31", smrt: "03-31", singtel: "03-31",
  meralco: "12-31", clp: "12-31", nationalgrid: "03-31",
  dbs: "12-31", ocbc: "12-31", uob: "12-31",
  ihh: "12-31", tmg: "06-30", rmg: "12-31",
};

export const UNKNOWN_ENVELOPE: Envelope = {
  consolidation: "unknown",
  scope2Method: "not_stated",
  scope3Categories: null,
  baseYear: null,
  baseYearNote: null,
  gwpSource: "not_stated",
  assurance: "unknown",
  assuranceProvider: null,
};
