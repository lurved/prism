/**
 * SPINE — the canonical metric registry.
 *
 * This is the "template of key data points". Every category ANSWERS these rows;
 * no category defines its own. Tier 1 is not our opinion about what matters —
 * it is IFRS S2's cross-industry metric categories, the disclosure standard the
 * reporting entities are themselves moving onto.
 *
 *   Tier 1  IFRS S2 ¶29 (a)–(g) cross-industry metrics + ¶33–37 targets
 *   Tier 2  GRI-anchored social & governance (S2 is climate-only)
 *   Tier 3  industry packs, per S2's industry-based guidance
 *
 * Adding a metric here makes it exist for EVERY category at once — as a value,
 * N/D, N/A-with-reason, or pending. That is the point: a gap becomes visible
 * and countable instead of an absent row nobody notices.
 */
import type { SpineRow } from "./types";

/* ═══════════════════════════════════════════════════════════════════
   ENTITY & BOUNDARY — GHG Protocol organizational boundary + IFRS S1
   reporting entity. These frame every number below them.
   ═══════════════════════════════════════════════════════════════════ */
const ENTITY_ROWS: SpineRow[] = [
  {
    key: "business_model", label: "Business model", group: "Entity & boundary",
    tier: 1, authority: "IFRS S1", authorityRef: "S1 — reporting entity",
    unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "reporting_period", label: "Reporting period", sublabel: "same period as financial statements",
    group: "Entity & boundary", tier: 1, authority: "IFRS S1", authorityRef: "S1 ¶64–69",
    unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "consolidation", label: "Consolidation approach", sublabel: "organizational boundary",
    group: "Entity & boundary", tier: 1, authority: "GHG Protocol",
    authorityRef: "Corporate Standard ch.3", unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "scope2_method_row", label: "Scope 2 method", sublabel: "dual reporting expected",
    group: "Entity & boundary", tier: 1, authority: "GHG Protocol",
    authorityRef: "Scope 2 Guidance (2015)", unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "base_year", label: "Base year", sublabel: "and recalculation policy",
    group: "Entity & boundary", tier: 1, authority: "GHG Protocol",
    authorityRef: "Corporate Standard ch.5", unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "gwp_source", label: "GWP source", group: "Entity & boundary",
    tier: 1, authority: "GHG Protocol", unit: "", views: ["comparable"],
  },
  {
    key: "assurance_level", label: "Assurance level", group: "Entity & boundary",
    tier: 1, authority: "house", unit: "", views: ["as_reported", "comparable"],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   TIER 1 — IFRS S2 ¶29 (a) GROSS GHG EMISSIONS
   Absolute gross emissions in tCO₂e on a GHG Protocol basis.
   Comparability requires envelope agreement, so each row declares which
   envelope fields must match.
   ═══════════════════════════════════════════════════════════════════ */
const S2_EMISSIONS_ROWS: SpineRow[] = [
  {
    key: "scope1_abs", label: "Scope 1", sublabel: "direct — absolute gross",
    group: "GHG emissions · S2 ¶29(a)", tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶29(a)(i)",
    unit: "tCO₂e", views: ["as_reported", "comparable"],
    lowerIsBetter: true, comparabilityKeys: ["consolidation"],
  },
  {
    key: "scope2_abs", label: "Scope 2", sublabel: "as reported — headline basis",
    group: "GHG emissions · S2 ¶29(a)", tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶29(a)(i)",
    unit: "tCO₂e", views: ["as_reported"],
    lowerIsBetter: true, comparabilityKeys: ["consolidation", "scope2Method"],
  },
  {
    key: "scope2_location", label: "Scope 2 — location-based", sublabel: "dual reporting",
    group: "GHG emissions · S2 ¶29(a)", tier: 1, authority: "GHG Protocol",
    authorityRef: "Scope 2 Guidance (2015)", unit: "tCO₂e", views: ["comparable"],
    lowerIsBetter: true, comparabilityKeys: ["consolidation"],
  },
  {
    key: "scope2_market", label: "Scope 2 — market-based", sublabel: "dual reporting",
    group: "GHG emissions · S2 ¶29(a)", tier: 1, authority: "GHG Protocol",
    authorityRef: "Scope 2 Guidance (2015)", unit: "tCO₂e", views: ["comparable"],
    lowerIsBetter: true, comparabilityKeys: ["consolidation"],
  },
  {
    key: "scope1and2_abs", label: "Scope 1+2 combined", sublabel: "where reported only as a total",
    group: "GHG emissions · S2 ¶29(a)", tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶29(a)(i)",
    unit: "tCO₂e", views: ["as_reported"], lowerIsBetter: true,
    comparabilityKeys: ["consolidation", "scope2Method"],
  },
  {
    key: "scope3_abs", label: "Scope 3", sublabel: "value chain — absolute gross",
    group: "GHG emissions · S2 ¶29(a)", tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶29(a)(i)",
    unit: "tCO₂e", views: ["as_reported", "comparable"],
    lowerIsBetter: true, comparabilityKeys: ["consolidation", "scope3Categories"],
  },
  {
    key: "scope3_categories", label: "Scope 3 categories included", sublabel: "of the 15",
    group: "GHG emissions · S2 ¶29(a)", tier: 1, authority: "GHG Protocol",
    authorityRef: "Scope 3 Standard", unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "scope3_cat15", label: "Scope 3 Cat 15 — investments", sublabel: "of which",
    group: "GHG emissions · S2 ¶29(a)", tier: 1, authority: "GHG Protocol",
    authorityRef: "Scope 3 Standard cat. 15", unit: "tCO₂e", views: ["as_reported"],
    lowerIsBetter: true, comparabilityKeys: ["consolidation"],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   TIER 1 — IFRS S2 ¶29 (b)–(g)
   The categories this site is currently near-silent on. They are listed
   here precisely SO THAT the silence is visible and countable rather than
   an absent row. An N/D here is a finding, not a formatting problem.
   ═══════════════════════════════════════════════════════════════════ */
const S2_CROSS_INDUSTRY_ROWS: SpineRow[] = [
  {
    key: "transition_risk_exposure", label: "Transition-risk exposure",
    sublabel: "assets / activities vulnerable", group: "Risk & capital · S2 ¶29(b)–(f)",
    tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶29(b)",
    unit: "%", views: ["as_reported", "comparable"],
  },
  {
    key: "physical_risk_exposure", label: "Physical-risk exposure",
    sublabel: "assets / activities vulnerable", group: "Risk & capital · S2 ¶29(b)–(f)",
    tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶29(c)",
    unit: "%", views: ["as_reported", "comparable"],
  },
  {
    key: "climate_opportunity", label: "Climate opportunities",
    sublabel: "assets / activities aligned", group: "Risk & capital · S2 ¶29(b)–(f)",
    tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶29(d)",
    unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "climate_capital_deployment", label: "Capital deployment",
    sublabel: "toward climate risks & opportunities", group: "Risk & capital · S2 ¶29(b)–(f)",
    tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶29(e)",
    unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "internal_carbon_price", label: "Internal carbon price",
    sublabel: "price per tonne & how applied", group: "Risk & capital · S2 ¶29(b)–(f)",
    tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶29(f)",
    unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "exec_remuneration_climate_pct", label: "Exec pay linked to climate",
    sublabel: "% of remuneration — S2 asks for a percentage",
    group: "Risk & capital · S2 ¶29(b)–(f)", tier: 1, authority: "IFRS S2",
    authorityRef: "S2 ¶29(g)", unit: "%", views: ["as_reported", "comparable"],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   TIER 1 — IFRS S2 ¶33–37 TARGETS
   Structured, not prose: objective, scope, base period, validation.
   ═══════════════════════════════════════════════════════════════════ */
const S2_TARGET_ROWS: SpineRow[] = [
  {
    key: "net_zero_year", label: "Net-zero target year", group: "Targets · S2 ¶33–37",
    tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶33–36",
    unit: "year", views: ["as_reported", "comparable"], lowerIsBetter: true,
  },
  {
    key: "interim_target", label: "Interim target", sublabel: "scope · base period · horizon",
    group: "Targets · S2 ¶33–37", tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶33–36",
    unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "target_validated", label: "Third-party validated", sublabel: "e.g. SBTi",
    group: "Targets · S2 ¶33–37", tier: 1, authority: "IFRS S2", authorityRef: "S2 ¶33(e)",
    unit: "", views: ["as_reported", "comparable"],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   TIER 2 — GRI-anchored social & governance.
   IFRS S2 is CLIMATE-ONLY, so these rows answer to GRI, not to IFRS.
   Labelling them IFRS would be a misrepresentation.
   Most are broadly comparable across business models — they carry no
   comparabilityKeys because they do not depend on GHG accounting basis.
   ═══════════════════════════════════════════════════════════════════ */
const GRI_ROWS: SpineRow[] = [
  {
    key: "intensity_reported", label: "GHG intensity", sublabel: "each entity's own denominator",
    group: "Intensity", tier: 2, authority: "house",
    unit: "", views: ["as_reported"], lowerIsBetter: true,
  },
  {
    key: "renewable_share_pct", label: "Renewable electricity", sublabel: "% of consumption",
    group: "Energy & water", tier: 2, authority: "GRI", authorityRef: "GRI 302-1",
    unit: "%", views: ["as_reported", "comparable"], rankable: true, lowerIsBetter: false,
  },
  {
    key: "water_m3", label: "Water consumption", group: "Energy & water",
    tier: 2, authority: "GRI", authorityRef: "GRI 303-5",
    unit: "m³", views: ["as_reported"], lowerIsBetter: true,
  },

  {
    key: "headcount", label: "Headcount", group: "Social · GRI",
    tier: 2, authority: "GRI", authorityRef: "GRI 2-7",
    unit: "employees", views: ["as_reported", "comparable"],
  },
  {
    key: "female_board_pct", label: "Female board", group: "Social · GRI",
    tier: 2, authority: "GRI", authorityRef: "GRI 405-1",
    unit: "%", views: ["as_reported", "comparable"], rankable: true, lowerIsBetter: false,
  },
  {
    key: "female_leadership_pct", label: "Female leadership", sublabel: "definitions vary by entity",
    group: "Social · GRI", tier: 2, authority: "GRI", authorityRef: "GRI 405-1",
    unit: "%", views: ["as_reported"], lowerIsBetter: false,
  },
  {
    key: "female_workforce_pct", label: "Female workforce", group: "Social · GRI",
    tier: 2, authority: "GRI", authorityRef: "GRI 405-1",
    unit: "%", views: ["as_reported"], lowerIsBetter: false,
  },
  {
    key: "training_hours_per_employee", label: "Training hrs / employee", group: "Social · GRI",
    tier: 2, authority: "GRI", authorityRef: "GRI 404-1",
    unit: "hrs", views: ["as_reported", "comparable"], rankable: true, lowerIsBetter: false,
  },
  {
    key: "turnover_pct", label: "Employee turnover", group: "Social · GRI",
    tier: 2, authority: "GRI", authorityRef: "GRI 401-1",
    unit: "%", views: ["as_reported"], lowerIsBetter: true,
  },
  {
    key: "engagement_pct", label: "Employee engagement", group: "Social · GRI",
    tier: 2, authority: "house", unit: "%", views: ["as_reported"], lowerIsBetter: false,
  },
  {
    key: "safety_rate", label: "Injury rate", sublabel: "basis differs — see cell",
    group: "Social · GRI", tier: 2, authority: "GRI", authorityRef: "GRI 403-9",
    unit: "", views: ["as_reported"], lowerIsBetter: true,
  },
  {
    key: "fatalities", label: "Workplace fatalities", group: "Social · GRI",
    tier: 2, authority: "GRI", authorityRef: "GRI 403-9",
    unit: "", views: ["as_reported"], lowerIsBetter: true,
  },
  {
    key: "community_investment", label: "Community investment", sublabel: "native currency · basis differs",
    group: "Social · GRI", tier: 2, authority: "GRI", authorityRef: "GRI 201-1",
    unit: "", views: ["as_reported"],
  },

  {
    key: "independent_directors_pct", label: "Independent directors", sublabel: "basis varies by jurisdiction",
    group: "Governance · GRI", tier: 2, authority: "GRI", authorityRef: "GRI 2-9",
    unit: "%", views: ["as_reported"], lowerIsBetter: false,
  },
  {
    key: "anti_corruption_training_pct", label: "Anti-corruption training", sublabel: "% employees trained",
    group: "Governance · GRI", tier: 2, authority: "GRI", authorityRef: "GRI 205-2",
    unit: "%", views: ["as_reported"], lowerIsBetter: false,
  },
  {
    // Deliberately NOT the same row as anti-corruption training. "% of
    // operations assessed for corruption risk" (205-1) and "% of employees
    // trained" (205-2) are different disclosures; the old healthcare model put
    // the first in the slot labelled like the second, inviting a false
    // comparison. One key per disclosure.
    key: "corruption_risk_assessed_pct", label: "Operations assessed for corruption risk",
    sublabel: "% of operations — not the same as training %",
    group: "Governance · GRI", tier: 2, authority: "GRI", authorityRef: "GRI 205-1",
    unit: "%", views: ["as_reported"], lowerIsBetter: false,
  },
  {
    key: "external_assurance", label: "External assurance", sublabel: "provider & level",
    group: "Governance · GRI", tier: 2, authority: "house",
    unit: "", views: ["as_reported", "comparable"],
  },
  {
    key: "frameworks", label: "Reporting frameworks", group: "Governance · GRI",
    tier: 2, authority: "house", unit: "", views: ["as_reported"],
  },
];

/** Tier 1 + Tier 2 — answered by every category. */
export const SPINE: SpineRow[] = [
  ...ENTITY_ROWS,
  ...S2_EMISSIONS_ROWS,
  ...S2_CROSS_INDUSTRY_ROWS,
  ...S2_TARGET_ROWS,
  ...GRI_ROWS,
];

/* ═══════════════════════════════════════════════════════════════════
   TIER 3 — INDUSTRY PACKS.
   Per IFRS S2's industry-based guidance: metrics that matter for one
   industry and are genuinely N/A elsewhere. A new category defines its
   pack here rather than inventing a whole table.
   ═══════════════════════════════════════════════════════════════════ */
export type PackId = "utilities" | "banks" | "healthcare" | "diversified";

/** Shared by any category containing a power generator. */
const RENEWABLE_CAPACITY_ROW: SpineRow = {
  key: "renewable_capacity_gw", label: "Renewable capacity", sublabel: "GW installed",
  group: "Industry · generation", tier: 3, authority: "IFRS S2",
  authorityRef: "S2 industry-based — Electric Utilities", unit: "GW",
  views: ["as_reported"], lowerIsBetter: false,
};

export const PACKS: Record<PackId, SpineRow[]> = {
  utilities: [
    {
      key: "sf6_tco2e", label: "SF₆ emissions", sublabel: "switchgear gas",
      group: "Industry · electric utilities", tier: 3, authority: "IFRS S2",
      authorityRef: "S2 industry-based — Electric Utilities", unit: "tCO₂e",
      views: ["as_reported"], lowerIsBetter: true, comparabilityKeys: ["gwpSource"],
    },
    {
      key: "system_loss_pct", label: "System / T&D loss", group: "Industry · electric utilities",
      tier: 3, authority: "IFRS S2", authorityRef: "S2 industry-based — Electric Utilities",
      unit: "%", views: ["as_reported", "comparable"], lowerIsBetter: true,
    },
    {
      key: "normalized_intensity_kwh", label: "Normalised intensity",
      sublabel: "kg CO₂e/kWh (S1+2) — like-for-like", group: "Industry · electric utilities",
      tier: 3, authority: "IFRS S2", authorityRef: "S2 industry-based — Electric Utilities",
      unit: "kg CO₂e/kWh", views: ["comparable"], rankable: true, lowerIsBetter: true,
      comparabilityKeys: ["consolidation"],
    },
    RENEWABLE_CAPACITY_ROW,
  ],
  banks: [
    {
      key: "financed_emissions_abs", label: "Financed emissions", sublabel: "Scope 3 Cat 15 — aggregate",
      group: "Industry · commercial banking", tier: 3, authority: "IFRS S2",
      authorityRef: "S2 industry-based — Commercial Banks", unit: "tCO₂e",
      views: ["as_reported", "comparable"], lowerIsBetter: true,
      comparabilityKeys: ["consolidation"],
    },
    {
      key: "financed_emissions_progress", label: "Sector target progress", sublabel: "per-sector intensity",
      group: "Industry · commercial banking", tier: 3, authority: "IFRS S2",
      authorityRef: "S2 industry-based — Commercial Banks", unit: "",
      views: ["as_reported"],
    },
    {
      key: "sustainable_finance", label: "Sustainable finance", sublabel: "committed portfolio",
      group: "Industry · commercial banking", tier: 3, authority: "IFRS S2",
      authorityRef: "S2 ¶29(d) — opportunities", unit: "", views: ["as_reported"],
    },
  ],
  healthcare: [
    {
      key: "intensity_bed_day", label: "Scope 1+2 intensity", sublabel: "kg CO₂e/patient-bed-day",
      group: "Industry · healthcare", tier: 3, authority: "IFRS S2",
      authorityRef: "S2 industry-based — Health Care Delivery", unit: "kg CO₂e/bed-day",
      views: ["as_reported", "comparable"], rankable: true, lowerIsBetter: true,
      comparabilityKeys: ["consolidation", "scope2Method"],
    },
    {
      key: "beds_licensed", label: "Licensed beds", sublabel: "by country",
      group: "Industry · healthcare", tier: 3, authority: "IFRS S2",
      authorityRef: "S2 industry-based — Health Care Delivery", unit: "beds",
      views: ["as_reported"],
    },
  ],
  // Mixed-sector categories (e.g. the Temasek portfolio) carry only the rows
  // that some member genuinely reports.
  diversified: [RENEWABLE_CAPACITY_ROW],
};

/** Rows shown for a category = spine + its industry pack. */
export function rowsForPack(pack: PackId): SpineRow[] {
  return [...SPINE, ...PACKS[pack]];
}

/** The S2 ¶29 cross-industry categories, for the coverage scorecard (§3.6).
 *  An entity "covers" a category when it discloses at least one of its keys. */
export const S2_COVERAGE: { id: string; label: string; ref: string; keys: string[] }[] = [
  { id: "a", label: "Gross GHG emissions", ref: "S2 ¶29(a)", keys: ["scope1_abs", "scope2_abs", "scope2_location", "scope2_market", "scope1and2_abs", "scope3_abs"] },
  { id: "b", label: "Transition-risk exposure", ref: "S2 ¶29(b)", keys: ["transition_risk_exposure"] },
  { id: "c", label: "Physical-risk exposure", ref: "S2 ¶29(c)", keys: ["physical_risk_exposure"] },
  { id: "d", label: "Climate opportunities", ref: "S2 ¶29(d)", keys: ["climate_opportunity", "sustainable_finance"] },
  { id: "e", label: "Capital deployment", ref: "S2 ¶29(e)", keys: ["climate_capital_deployment"] },
  { id: "f", label: "Internal carbon price", ref: "S2 ¶29(f)", keys: ["internal_carbon_price"] },
  { id: "g", label: "Climate-linked exec pay", ref: "S2 ¶29(g)", keys: ["exec_remuneration_climate_pct"] },
];

export const AUTHORITY_LABEL: Record<SpineRow["authority"], string> = {
  "IFRS S2": "IFRS S2",
  "IFRS S1": "IFRS S1",
  "GHG Protocol": "GHG Protocol",
  GRI: "GRI",
  house: "House",
};
