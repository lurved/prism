/**
 * DECISION-USEFULNESS — the analyst layer.
 *
 * IFRS S1 frames the whole purpose of sustainability reporting as information
 * "useful to primary users in making decisions relating to providing resources
 * to the entity". Everything upstream of this file establishes what a figure
 * IS. This file answers the question an investor actually asks:
 *
 *     Can I use this number, and if not, what do I ask the company?
 *
 * Nothing here is a score of the entity's climate performance. It grades the
 * DISCLOSURE — whether a figure is sourced, page-verified, assured, reported on
 * a stated accounting basis, and current. A company can have excellent
 * emissions performance and poor decision-usefulness, and vice versa; conflating
 * the two is the single most common error in ESG scoring, and this file is
 * built to avoid it.
 *
 * The grade is DERIVED from explicit, listed criteria — never hand-set — so an
 * analyst can see exactly why a figure scored what it did and disagree with the
 * reasoning rather than having to trust a black box.
 */
import type { Cell, Entity, SpineRow } from "./types";
import { isDisclosed } from "./comparability";

export type Usability = "high" | "moderate" | "limited" | "not_usable";

export const USABILITY_LABEL: Record<Usability, string> = {
  high: "High",
  moderate: "Moderate",
  limited: "Limited",
  not_usable: "Not usable",
};

export const USABILITY_BLURB: Record<Usability, string> = {
  high: "Page-verified and externally assured, on a stated accounting basis. Usable directly.",
  moderate: "From the entity's own report on a stated basis, but not both page-verified and assured.",
  limited: "Usable only with caveats — the accounting basis is unstated, or the figure is not current.",
  not_usable: "Nothing disclosed, not applicable, or not yet extracted.",
};

/** The checks behind a grade. Exposed so the reasoning is auditable. */
export interface UsabilityChecks {
  /** A citation exists — the figure traces to a document. */
  sourced: boolean;
  /** A page-level location was recorded for THIS figure. */
  pageVerified: boolean;
  /** The entity obtained external assurance for the cycle. */
  externallyAssured: boolean;
  /**
   * The GHG accounting basis this row depends on is stated. A Scope 2 figure
   * whose method is unknown, or a Scope 1 figure with no stated consolidation
   * approach, cannot be relied on for comparison however precise it looks.
   */
  basisStated: boolean;
  /** The entity's row uses the most recent report available to us. */
  current: boolean;
}

export interface UsabilityVerdict {
  grade: Usability;
  checks: UsabilityChecks;
  /** Plain-language reasons the grade is not "high". */
  limitations: string[];
}

/**
 * Latest report period we hold for each entity. Where this is ahead of the
 * entity's own reportingPeriod, the row is STALE and every figure on it drops a
 * grade — an investor cannot act on last year's data when this year's exists.
 */
export const LATEST_AVAILABLE: Record<string, string> = {
  // Refreshed to FY2025 in Aug 2026 — no longer stale, so they are not listed.
  // Still behind: the FY2025 reports exist but could not be read here (Meralco's
  // integrated report returns empty; UOB's text extraction stops at p.79, before
  // the environmental section that begins at p.117).
  meralco: "FY2025",
  uob: "FY2025",
};

export function isStale(entity: Entity): boolean {
  const latest = LATEST_AVAILABLE[entity.id];
  return latest !== undefined && latest !== entity.reportingPeriod;
}

/** Envelope fields a row's reliability genuinely depends on. */
function basisIsStated(row: SpineRow, entity: Entity): boolean {
  const env = entity.envelope;
  const keys = row.comparabilityKeys ?? [];
  for (const k of keys) {
    if (k === "consolidation" && env.consolidation === "unknown") return false;
    if (k === "scope2Method" && env.scope2Method === "not_stated") return false;
    if (k === "scope3Categories" && env.scope3Categories === null) return false;
    if (k === "gwpSource" && env.gwpSource === "not_stated") return false;
  }
  return true;
}

/**
 * Grade one figure. The ladder:
 *   high      sourced + page-verified + externally assured + basis stated + current
 *   moderate  sourced + basis stated + current, missing verification or assurance
 *   limited   sourced, but the basis is unstated or the row is stale
 *   not_usable nothing disclosed
 */
export function assessUsability(cell: Cell | undefined, row: SpineRow, entity: Entity): UsabilityVerdict {
  const notUsable = (why: string): UsabilityVerdict => ({
    grade: "not_usable",
    checks: { sourced: false, pageVerified: false, externallyAssured: false, basisStated: false, current: !isStale(entity) },
    limitations: [why],
  });

  if (!cell) return notUsable("No value on this row.");
  if (cell.state === "nd") return notUsable("Not disclosed by the entity.");
  if (cell.state === "na") return notUsable("Does not apply to this business model.");
  if (cell.state === "pending") return notUsable("Report not yet read — figure not extracted.");

  const assured = entity.envelope.assurance === "external_limited" || entity.envelope.assurance === "external_reasonable";
  const checks: UsabilityChecks = {
    sourced: cell.citation !== null,
    pageVerified: cell.citation?.page != null,
    externallyAssured: assured,
    basisStated: basisIsStated(row, entity),
    current: !isStale(entity),
  };

  const limitations: string[] = [];
  if (!checks.sourced) limitations.push("No citation recorded for this figure.");
  if (!checks.pageVerified) limitations.push("Cited to the report but no page recorded — not page-verified.");
  if (!checks.externallyAssured) {
    limitations.push(
      entity.envelope.assurance === "internal_only"
        ? "Internal assurance only — not externally assured."
        : "No external assurance over the reported figures.",
    );
  }
  if (!checks.basisStated) {
    limitations.push("The GHG accounting basis this figure depends on is not stated, so it cannot be relied on for comparison.");
  }
  if (!checks.current) {
    limitations.push(
      `Row covers ${entity.reportingPeriod} while a ${LATEST_AVAILABLE[entity.id]} report is available — this figure is superseded.`,
    );
  }

  let grade: Usability;
  if (!checks.sourced) grade = "limited";
  else if (!checks.basisStated || !checks.current) grade = "limited";
  else if (checks.pageVerified && checks.externallyAssured) grade = "high";
  else grade = "moderate";

  return { grade, checks, limitations };
}

/* ── Per-entity roll-up ──────────────────────────────────────────── */

export interface EntityUsability {
  entityId: string;
  shortName: string;
  counts: Record<Usability, number>;
  /** Disclosed figures that an analyst can use directly or with minor caveats. */
  usableShare: number;
  stale: boolean;
}

export function entityUsability(entity: Entity, rows: SpineRow[]): EntityUsability {
  const counts: Record<Usability, number> = { high: 0, moderate: 0, limited: 0, not_usable: 0 };
  for (const row of rows) {
    counts[assessUsability(entity.metrics[row.key], row, entity).grade]++;
  }
  const disclosed = counts.high + counts.moderate + counts.limited;
  return {
    entityId: entity.id,
    shortName: entity.shortName,
    counts,
    usableShare: disclosed === 0 ? 0 : Math.round(((counts.high + counts.moderate) / disclosed) * 100),
    stale: isStale(entity),
  };
}

/* ── Engagement questions ────────────────────────────────────────── */

export interface EngagementQuestion {
  /** What the gap is, in the standard's terms. */
  topic: string;
  /** The question to put to the company. */
  question: string;
  basis: string;
}

/**
 * The questions an analyst would actually put to the company, derived from
 * what the disclosure is missing. This is the practical output of a gap
 * analysis: a gap is only useful if it converts into something you can ask.
 */
export function engagementQuestions(entity: Entity): EngagementQuestion[] {
  const q: EngagementQuestion[] = [];
  const env = entity.envelope;

  if (env.consolidation === "unknown") {
    q.push({
      topic: "Organizational boundary",
      question:
        "Which GHG Protocol consolidation approach do your Scope 1 and 2 figures use — equity share, financial control or operational control? Please also report the consolidated group separately from associates and joint ventures.",
      basis: "GHG Protocol Corporate Standard, organizational boundaries",
    });
  }
  if (env.scope2Method === "not_stated") {
    q.push({
      topic: "Scope 2 method",
      question:
        "Is the reported Scope 2 figure location-based or market-based? The 2015 Scope 2 Guidance expects both to be disclosed where contractual instruments are available in your markets.",
      basis: "GHG Protocol Scope 2 Guidance (2015), dual reporting",
    });
  } else if (env.scope2Method === "location_based" || env.scope2Method === "market_based") {
    q.push({
      topic: "Scope 2 dual reporting",
      question: `Only the ${env.scope2Method === "market_based" ? "market" : "location"}-based Scope 2 figure is disclosed. Can you publish both bases, so the effect of contractual instruments on the reported figure is visible?`,
      basis: "GHG Protocol Scope 2 Guidance (2015), dual reporting",
    });
  }
  if (env.scope3Categories === null) {
    q.push({
      topic: "Scope 3 coverage",
      question:
        "Which of the 15 Scope 3 categories are included in your reported total, and what is the rationale for any excluded as immaterial?",
      basis: "GHG Protocol Corporate Value Chain (Scope 3) Standard",
    });
  }
  if (env.gwpSource === "not_stated") {
    q.push({
      topic: "GWP basis",
      question:
        "Which IPCC assessment report supplies the global warming potentials used in your inventory? This materially affects totals where high-GWP gases such as SF₆ or HFCs are present.",
      basis: "GHG Protocol Corporate Standard",
    });
  }
  if (env.baseYear === null) {
    q.push({
      topic: "Base year",
      question:
        "What base year do your reduction targets use, and what is your base-year recalculation policy for acquisitions, divestments and methodology changes?",
      basis: "GHG Protocol Corporate Standard, base-year recalculation",
    });
  }
  if (env.assurance === "none" || env.assurance === "unknown" || env.assurance === "internal_only") {
    q.push({
      topic: "Assurance",
      question:
        "Do you intend to obtain external assurance over reported GHG figures, at what level (limited or reasonable), and over which scopes?",
      basis: "Investor reliance on reported figures",
    });
  }

  // IFRS S2 ¶29 cross-industry gaps.
  const s2Gaps: [string, string, string][] = [
    ["transition_risk_exposure", "Transition-risk exposure", "S2 ¶29(b)"],
    ["physical_risk_exposure", "Physical-risk exposure", "S2 ¶29(c)"],
    ["climate_opportunity", "Climate opportunities", "S2 ¶29(d)"],
    ["climate_capital_deployment", "Capital deployment", "S2 ¶29(e)"],
    ["internal_carbon_price", "Internal carbon price", "S2 ¶29(f)"],
    ["exec_remuneration_climate_pct", "Climate-linked remuneration", "S2 ¶29(g)"],
  ];
  const missing = s2Gaps.filter(([key]) => !isDisclosed(entity.metrics[key]));
  if (missing.length) {
    q.push({
      topic: "IFRS S2 cross-industry metrics",
      question: `The following cross-industry metrics are not disclosed: ${missing
        .map(([, label, ref]) => `${label} (${ref})`)
        .join("; ")}. Do you intend to report them, and on what timetable?`,
      basis: "IFRS S2 ¶29",
    });
  }

  // Targets missing the elements S2 asks for.
  const looseTargets = entity.targets.filter(
    (t) => t.grossOrNet === null || t.usesCarbonCredits === null || t.thirdPartyValidated === null,
  );
  if (looseTargets.length) {
    q.push({
      topic: "Target structure",
      question:
        "For each stated target, can you confirm whether it is a gross or net emissions target, the extent to which it relies on carbon credits, and whether it has been validated by a third party?",
      basis: "IFRS S2 ¶33–37",
    });
  }

  if (isStale(entity)) {
    q.push({
      topic: "Reporting currency",
      question: `This comparison currently reflects ${entity.reportingPeriod}; a ${LATEST_AVAILABLE[entity.id]} report is available and the figures here are superseded pending a refresh.`,
      basis: "IFRS S1, reporting period",
    });
  }

  return q;
}
