/**
 * SOURCE SCOPE — which documents this comparison reads.
 *
 * THE RULE: an entity's sustainability reporting, wherever that entity chooses
 * to publish it.
 *
 * That wording is deliberate, because "sustainability reports only, no annual
 * reports" would delete half this corpus. Six of twelve entities publish their
 * sustainability disclosure INSIDE an annual or integrated report rather than
 * as a standalone document:
 *
 *   Sembcorp       Annual Report 2025 — Environmental, Social and Governance Review
 *   Meralco        One Meralco Integrated Report
 *   CLP            Annual Report — KPMG-assured Five-Year ESG Data
 *   National Grid  Annual Report and Accounts (Form 20-F)
 *   TMG            FY2025 Annual Report, sustainability section pp. 54–100
 *   Raffles (RMG)  Annual Report 2025, Sustainability Report section
 *
 * Sembcorp is among them, and it is the ONLY entity in the corpus disclosing
 * the full IFRS S2 ¶29 cross-industry metric set. A document-type rule would
 * throw that away. So scope follows the CONTENT — the entity's sustainability
 * reporting — not the cover the entity bound it in.
 *
 * WHAT IS OUT OF SCOPE: reaching into a different part of an annual report to
 * source a metric the sustainability reporting does not carry. The case that
 * arises here is board composition. DBS and OCBC report it in the Corporate
 * Governance Statement — a distinct disclosure regime (SGX Listing Rules and
 * the Code of Corporate Governance) answering to different requirements — and
 * their sustainability reports do not repeat it.
 *
 * WHY THIS NEEDS ITS OWN CELL STATE. Such a cell is not any of the four the
 * model already has, and using one of them would state something false:
 *
 *   nd        claims the entity did not disclose it. They did — elsewhere.
 *   na        claims the metric does not apply. Board gender diversity plainly
 *             applies to a bank.
 *   pending   claims we have not read it yet. Under this rule we never will.
 *
 * So the honest answer is a fifth state that names the boundary as OURS. It
 * keeps the count off our backlog without misattributing a gap to the entity —
 * the same separation completeness.ts exists to protect.
 */
import type { Cell, Entity } from "./types";

const DBS_CG =
  "Not carried in DBS's Sustainability Report 2025. DBS reports board composition in the Corporate Governance Statement of its Annual Report, under the SGX Listing Rules and the Code of Corporate Governance — outside this comparison's source scope, which reads sustainability reporting only. Not a DBS disclosure gap.";

const OCBC_CG =
  "Not carried in OCBC's Sustainability Report 2025. OCBC reports board composition in the Corporate Governance Statement of its Annual Report, under the SGX Listing Rules and the Code of Corporate Governance — outside this comparison's source scope, which reads sustainability reporting only. Not an OCBC disclosure gap.";

/**
 * entityId → metric key → why it sits outside scope.
 *
 * Every entry needs a reason a reader can check. An unexplained exclusion is
 * indistinguishable from a figure we quietly gave up on.
 */
export const OUT_OF_SCOPE: Record<string, Record<string, string>> = {
  dbs: {
    female_board_pct: DBS_CG,
    independent_directors_pct: DBS_CG,
  },
  ocbc: {
    female_board_pct: OCBC_CG,
    independent_directors_pct: OCBC_CG,
  },
};

/**
 * Stamp the scope decision onto an entity's cells.
 *
 * Applied centrally in index.ts rather than in each adapter, so the rule is
 * declared once and cannot drift between categories.
 *
 * Only ever REPLACES a non-disclosed cell. If a figure has actually been read
 * from the entity's sustainability reporting, the figure wins — a scope rule
 * must never blank a disclosure that exists.
 */
export function applySourceScope(e: Entity): Entity {
  const excluded = OUT_OF_SCOPE[e.id];
  if (!excluded) return e;

  const metrics: Record<string, Cell> = { ...e.metrics };
  for (const [key, reason] of Object.entries(excluded)) {
    const current = metrics[key];
    if (current && current.state === "disclosed") continue;
    metrics[key] = { state: "out_of_scope", reason };
  }
  return { ...e, metrics };
}
