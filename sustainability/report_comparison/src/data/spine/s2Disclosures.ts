/**
 * IFRS S2 ¶29(b)–(g) — the cross-industry metrics, as actually disclosed.
 *
 * Extracted July/August 2026 from the source reports held in Drive. Every
 * figure below was read from the entity's own report for the SAME reporting
 * period the entity row uses; nothing is carried across fiscal years, and
 * nothing is inferred.
 *
 * WHAT THE SWEEP FOUND. Eight reports were searched whose period matches the
 * dataset (Sembcorp, SMRT, Singtel, CLP, National Grid, IHH, TMG, RMG):
 *
 *   Sembcorp  publishes the full ¶29 metric set — (b) through (f) — in a
 *             "Climate Risks (Climate-related Disclosures – Metrics)" table.
 *             It is the only entity in the corpus that does.
 *   Singtel   publishes (f) an internal carbon price and (g) a remuneration
 *             percentage, though the latter is an ESG rather than a
 *             climate-only measure — see the note on that entry.
 *   CLP, National Grid, SMRT, IHH, RMG, TMG
 *             disclose none of (b)–(g). Those remain N/D, which is the
 *             finding, not a gap in this extraction.
 *
 * Meralco, DBS, OCBC and UOB are deliberately ABSENT. Drive holds FY2025
 * reports for them while their entity rows are FY2024, and mixing a figure
 * from one year into a row labelled another would break exactly the IFRS S1
 * same-period rule this model is built on. They need a period refresh first.
 *
 * PAGE NUMBERS. Sembcorp's five ¶29 figures are now page-verified: the batch
 * extraction pipeline (scripts/extract) located the Climate Risks metrics
 * table on PDF page 20, so those cells render "confirmed". Singtel's two are
 * still page-less and render "reported" — its report has not yet been put
 * through the pipeline.
 */

/** The ¶29(b)–(g) spine keys this file can populate. */
export type S2GapKey =
  | "transition_risk_exposure"
  | "physical_risk_exposure"
  | "climate_opportunity"
  | "climate_capital_deployment"
  | "internal_carbon_price"
  | "exec_remuneration_climate_pct";

export interface S2Disclosure {
  /** Numeric value for comparison; null for range/text-only disclosures. */
  value: number | null;
  display: string;
  unit: string;
  year: string;
  /** Report the figure was read from — used to build the citation. */
  reportTitle: string;
  /** null = no page-level location recorded. Never guessed. */
  page: number | null;
  /** Clarifies what `page` refers to — e.g. a PDF page index where the page
   *  carries no printed folio. */
  pageNote?: string;
  note?: string;
}

const SEMBCORP_SR2025 = "Sembcorp Sustainability Report 2025";
/** All five ¶29 metrics sit in one table, located by the extraction pipeline.
 *  The page carries no printed folio, so the PDF index is cited as such. */
const SEMBCORP_P20 = "PDF page 20 (Climate Risks metrics table); the page carries no printed folio.";
const SINGTEL_SR2025 = "Singtel Group Sustainability Report 2025";

export const S2_DISCLOSURES: Record<string, Partial<Record<S2GapKey, S2Disclosure>>> = {
  /* ── Sembcorp — the only full ¶29 discloser in the corpus ──────────
     Source: "Climate Risks (Climate-related Disclosures – Metrics)" table,
     which labels its rows against S2 (29). FY2025 column.                  */
  sembcorp: {
    transition_risk_exposure: {
      value: 50,
      display: "S$1.0bn · 50%",
      unit: "%",
      year: "FY2025",
      reportTitle: SEMBCORP_SR2025,
      page: 20,
      pageNote: SEMBCORP_P20,
      note: "Business activities vulnerable to transition risks: S$1.0 billion, 50% of the relevant base. Reported in the Climate Risks metrics table against S2 ¶29.",
    },
    physical_risk_exposure: {
      value: 13,
      display: "S$1.9bn · 13%",
      unit: "%",
      year: "FY2025",
      reportTitle: SEMBCORP_SR2025,
      page: 20,
      pageNote: SEMBCORP_P20,
      note: "Assets vulnerable to physical risks: S$1.9 billion, 13% of the relevant base.",
    },
    climate_opportunity: {
      value: 36,
      display: "S$723M · 36%",
      unit: "%",
      year: "FY2025",
      reportTitle: SEMBCORP_SR2025,
      page: 20,
      pageNote: SEMBCORP_P20,
      note: "Business activities aligned to climate-related opportunities: S$723 million, 36% of the relevant base.",
    },
    climate_capital_deployment: {
      value: 626,
      display: "S$626M",
      unit: "SGD m",
      year: "FY2025",
      reportTitle: SEMBCORP_SR2025,
      page: 20,
      pageNote: SEMBCORP_P20,
      note: "Capital deployment for climate-related opportunities, FY2025.",
    },
    internal_carbon_price: {
      // A RANGE, not a single price — stored as text so no single number is
      // invented from it. Sembcorp operates a Group Internal Carbon Pricing
      // Framework.
      value: null,
      display: "S$25–183/tCO₂e",
      unit: "SGD/tCO₂e",
      year: "FY2025",
      reportTitle: SEMBCORP_SR2025,
      page: 20,
      pageNote: SEMBCORP_P20,
      note: "Internal carbon price disclosed as a RANGE of S$25 to S$183 per tCO₂e under Sembcorp's Group Internal Carbon Pricing Framework. Stored as a range, not reduced to a single figure.",
    },
    // (g) is not in the Sustainability Report — the remuneration framework sits
    // in the Corporate Governance Statement of the Annual Report (pp. 96–100),
    // which is a different document and was not extracted here.
  },

  /* ── Singtel ───────────────────────────────────────────────────── */
  singtel: {
    internal_carbon_price: {
      value: 50,
      display: "S$50/tCO₂e",
      unit: "SGD/tCO₂e",
      year: "FY2025",
      reportTitle: SINGTEL_SR2025,
      page: null,
      note: "Shadow price of S$50 per tonne CO₂e applied to low-emission business cases, formalised in 2023 as the emissions-weighted average cost of carbon (e-WACC) and used to guide capital-expenditure decisions and vendor selection.",
    },
    exec_remuneration_climate_pct: {
      value: 20,
      display: "20% of LTI",
      unit: "% of long-term incentive",
      year: "FY2025",
      reportTitle: SINGTEL_SR2025,
      page: null,
      note: "Group-wide ESG KPIs for senior leaders carry shared targets contributing 20% of long-term incentive plans. IMPORTANT: this is an ESG measure spanning climate action AND talent development, and it applies to the long-term incentive plan rather than total remuneration — so it is narrower and broader than the climate-only share of total remuneration that S2 ¶29(g) asks for. Shown because a figure is published; read with that caveat.",
    },
  },
};

/** Disclosures recorded for an entity, or an empty object. */
export function s2DisclosuresFor(entityId: string): Partial<Record<S2GapKey, S2Disclosure>> {
  return S2_DISCLOSURES[entityId] ?? {};
}

/**
 * Entities whose Drive report is a LATER period than their entity row, so
 * ¶29(b)–(g) was deliberately not extracted for them. Surfaced in the UI and
 * tests so this is a recorded decision rather than an unexplained gap.
 */
export const PERIOD_MISMATCH: Record<string, string> = {
  meralco: "Row is FY2024; the One Meralco 2025 Integrated Report exists but could not be read (the file returns empty content, and the 17-A filing carries no emissions section).",
  uob: "Row is FY2024; UOB SR2025 exists but its text extraction stops at p.79, before the Direct Environmental Impact section that begins at p.117.",
};
