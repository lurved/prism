/**
 * COMPARABILITY — derived, never asserted.
 *
 * The old model had three mechanisms for one idea: a `comparable` boolean on
 * the Temasek metric defs, a `rankable` flag on healthcare rows, and nothing at
 * all on utilities/banks. All three were hand-set judgements.
 *
 * Here, comparability falls out of the GHG Protocol disclosure envelope:
 *
 *   Two figures may be compared only if their envelopes agree on the fields
 *   the row declares — same organizational boundary, same Scope 2 method,
 *   same Scope 3 categories, same GWP set.
 *
 * The healthcare page already did a version of this before ranking (checking
 * denominator and Scope 2 parity). This generalises it, and — importantly —
 * returns the REASON when it withholds a comparison, so the UI can explain a
 * suppressed badge in framework terms instead of a hand-written caveat.
 */
import type { Cell, Entity, Envelope, SpineRow } from "./types";
import { CONSOLIDATION_LABEL, SCOPE2_METHOD_LABEL, GWP_LABEL } from "./types";
import { S2_COVERAGE } from "./registry";

/** A cell that actually carries a disclosed figure. */
export function isDisclosed(cell: Cell | undefined): cell is Extract<Cell, { state: "disclosed" }> {
  return cell?.state === "disclosed";
}

export function numericValue(cell: Cell | undefined): number | null {
  return isDisclosed(cell) ? cell.value : null;
}

/** Human description of an envelope field, for explaining a mismatch. */
function describe(field: keyof Envelope, env: Envelope): string {
  switch (field) {
    case "consolidation": return CONSOLIDATION_LABEL[env.consolidation];
    case "scope2Method": return SCOPE2_METHOD_LABEL[env.scope2Method];
    case "scope3Categories":
      return env.scope3Categories === null ? "categories not enumerated" : `cats ${env.scope3Categories.join(", ")}`;
    case "gwpSource": return GWP_LABEL[env.gwpSource];
    case "baseYear": return env.baseYear ?? "no base year";
    default: return String(env[field] ?? "—");
  }
}

const FIELD_LABEL: Record<string, string> = {
  consolidation: "organizational boundary",
  scope2Method: "Scope 2 method",
  scope3Categories: "Scope 3 categories",
  gwpSource: "GWP set",
  baseYear: "base year",
};

export interface ComparabilityVerdict {
  /** Entities whose figures may sit in one comparison. */
  eligible: Entity[];
  /** Null when the row is comparable; otherwise why it is not. */
  blockedReason: string | null;
}

/**
 * Which entities may be compared on this row, and why not if they may not.
 * Requires ≥2 disclosed figures — ranking a lone entity is not a comparison.
 */
export function assessComparability(row: SpineRow, entities: Entity[]): ComparabilityVerdict {
  const disclosed = entities.filter((e) => isDisclosed(e.metrics[row.key]));
  if (disclosed.length < 2) {
    return {
      eligible: disclosed,
      blockedReason: disclosed.length === 1 ? "n = 1 — a single entity is not a comparison." : null,
    };
  }

  // PERIOD FIRST. Two entities in different fiscal years are not comparable
  // however well their accounting bases agree — a Scope 2 column mixing FY2024
  // and FY2025 is a different-year comparison wearing the clothes of a
  // like-for-like one. This is the specific error a partial period refresh of
  // a peer set would introduce, and the envelope checks below would not catch
  // it, because the accounting basis can be identical across years.
  const periods = new Map<string, string[]>();
  for (const e of disclosed) {
    periods.set(e.reportingPeriod, [...(periods.get(e.reportingPeriod) ?? []), e.shortName]);
  }
  if (periods.size > 1) {
    const parts = Array.from(periods.entries())
      .map(([period, names]) => `${names.join(", ")} ${period}`)
      .join("; ");
    return {
      eligible: [],
      blockedReason: `Not comparable — reporting periods differ (${parts}). Figures from different fiscal years cannot be compared like for like.`,
    };
  }

  for (const field of row.comparabilityKeys ?? []) {
    const seen = new Map<string, string[]>();
    for (const e of disclosed) {
      const k = JSON.stringify(e.envelope[field] ?? null);
      seen.set(k, [...(seen.get(k) ?? []), e.shortName]);
    }
    if (seen.size > 1) {
      const parts = disclosed
        .map((e) => `${e.shortName} ${describe(field, e.envelope)}`)
        .join("; ");
      return {
        eligible: [],
        blockedReason: `Not comparable — ${FIELD_LABEL[field] ?? field} differs (${parts}).`,
      };
    }
  }
  return { eligible: disclosed, blockedReason: null };
}

/**
 * Best performer for a row, or null. A badge requires: the row is rankable,
 * the envelopes agree, and the winner is not tied with the whole field.
 */
export function bestPerformer(row: SpineRow, entities: Entity[]): { winnerId: string | null; reason: string | null } {
  if (!row.rankable) return { winnerId: null, reason: null };
  const { eligible, blockedReason } = assessComparability(row, entities);
  if (blockedReason || eligible.length < 2) return { winnerId: null, reason: blockedReason };

  const withValues = eligible.filter((e) => numericValue(e.metrics[row.key]) !== null);
  if (withValues.length < 2) return { winnerId: null, reason: null };

  const best = withValues.reduce((a, b) => {
    const av = numericValue(a.metrics[row.key])!;
    const bv = numericValue(b.metrics[row.key])!;
    return (row.lowerIsBetter ? av <= bv : av >= bv) ? a : b;
  });
  const bestVal = numericValue(best.metrics[row.key])!;
  const allTied = withValues.every((e) => numericValue(e.metrics[row.key]) === bestVal);
  if (allTied) return { winnerId: null, reason: "All entities tied — no best performer." };

  // Assurance parity is a caveat, not a blocker: it does not change what the
  // number means, only how much weight it carries.
  const parity = new Set(withValues.map((e) => e.envelope.assurance)).size === 1;
  return { winnerId: best.id, reason: parity ? null : "Assurance levels differ across the compared entities." };
}

/* ── IFRS S2 cross-industry coverage scorecard (§3.6) ────────────── */

export interface CoverageResult {
  entityId: string;
  shortName: string;
  covered: string[];   // S2_COVERAGE ids the entity discloses
  missing: string[];
  score: number;       // covered.length
  total: number;
}

/**
 * Per-entity coverage of the IFRS S2 ¶29 cross-industry metric categories.
 *
 * This requires estimating nothing — it counts what the entity itself
 * discloses — which is why it is a defensible headline for a site whose
 * whole constraint is "no interpolation".
 */
export function s2Coverage(entity: Entity): CoverageResult {
  const covered: string[] = [];
  const missing: string[] = [];
  for (const cat of S2_COVERAGE) {
    const has = cat.keys.some((k) => isDisclosed(entity.metrics[k]));
    (has ? covered : missing).push(cat.id);
  }
  return {
    entityId: entity.id,
    shortName: entity.shortName,
    covered,
    missing,
    score: covered.length,
    total: S2_COVERAGE.length,
  };
}

/**
 * IFRS S1 expects comparability of reporting periods. Where a category mixes
 * fiscal year-ends, say so once, automatically, instead of relying on someone
 * remembering to hand-write a "read with care" aside.
 */
export function vintageSpread(entities: Entity[]): string | null {
  const ends = new Set(entities.map((e) => e.fiscalYearEnd).filter(Boolean) as string[]);
  const periods = entities.map((e) => `${e.shortName} ${e.reportingPeriod}`);
  if (ends.size <= 1) return null;
  return `Fiscal year-ends differ across this set (${periods.join(" · ")}), so figures are not from a common measurement window.`;
}
