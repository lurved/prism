/**
 * SPINE — shared type layer.
 *
 * One vocabulary for every category. The governing idea, taken from the
 * frameworks the source reports are written against:
 *
 *   GHG Protocol  → what a number MEANS   (the disclosure envelope)
 *   IFRS S1       → who reports, over what period, with what comparatives
 *   IFRS S2       → WHICH climate metrics must be disclosed (Tier 1)
 *   GRI           → the social & governance rows S2 does not cover (Tier 2)
 *
 * The consequence that drives this file: a metric is NOT `value + unit +
 * citation`. A GHG figure is uninterpretable without its accounting basis, so
 * every entity carries an Envelope, and comparability is DERIVED from envelope
 * agreement rather than hand-set per metric.
 *
 * Framework references (`authorityRef`) are recorded so intent is traceable.
 * They should be verified against the current standards text before being
 * surfaced as claims on the site.
 */
import type { ProvenanceTier } from "../provenance";

/** Which standard a spine row answers to. "house" = our own construct. */
export type Authority = "IFRS S2" | "IFRS S1" | "GHG Protocol" | "GRI" | "house";

/* ── GHG Protocol: the disclosure envelope ───────────────────────── */

/** GHG Protocol organizational boundary. Two entities on different bases are
 *  not comparable on absolute emissions, however similar the numbers look. */
export type Consolidation =
  | "equity_share"
  | "financial_control"
  | "operational_control"
  | "unknown";

/** Scope 2 Guidance (2015) expects DUAL reporting — location *and* market. */
export type Scope2Method =
  | "location_based"
  | "market_based"
  | "dual_reported"
  | "not_stated";

/** Which IPCC assessment report supplied the GWPs. Material wherever
 *  high-GWP gases (SF₆, HFCs) are a meaningful share — i.e. grid utilities. */
export type GwpSource = "AR4" | "AR5" | "AR6" | "not_stated";

/** Assurance level over the reported figures. "limited" and "reasonable" are
 *  materially different claims and must not be flattened to a boolean. */
export type AssuranceLevel =
  | "external_reasonable"
  | "external_limited"
  | "internal_only"
  | "none"
  | "unknown";

export interface Envelope {
  consolidation: Consolidation;
  scope2Method: Scope2Method;
  /** GHG Protocol Scope 3 Standard categories 1–15 actually included.
   *  null = the report does not enumerate them (never inferred from prose). */
  scope3Categories: number[] | null;
  /** Base year for reduction targets, and the note explaining any restatement
   *  (GHG Protocol requires a base-year recalculation policy for structural
   *  change — e.g. Singtel's FY2025 boundary expansion). */
  baseYear: string | null;
  baseYearNote: string | null;
  gwpSource: GwpSource;
  assurance: AssuranceLevel;
  assuranceProvider: string | null;
}

export const CONSOLIDATION_LABEL: Record<Consolidation, string> = {
  equity_share: "Equity share",
  financial_control: "Financial control",
  operational_control: "Operational control",
  unknown: "Not stated",
};

export const SCOPE2_METHOD_LABEL: Record<Scope2Method, string> = {
  location_based: "Location-based",
  market_based: "Market-based",
  dual_reported: "Dual-reported (location + market)",
  not_stated: "Not stated",
};

export const ASSURANCE_LEVEL_LABEL: Record<AssuranceLevel, string> = {
  external_reasonable: "External — reasonable",
  external_limited: "External — limited",
  internal_only: "Internal only",
  none: "None",
  unknown: "Unknown",
};

export const GWP_LABEL: Record<GwpSource, string> = {
  AR4: "IPCC AR4",
  AR5: "IPCC AR5",
  AR6: "IPCC AR6",
  not_stated: "Not stated",
};

/* ── Per-figure citation ─────────────────────────────────────────── */

export interface SpineCitation {
  reportTitle: string;
  url: string | null;
  /** null = no page-level location recorded. Never guessed. */
  page: number | null;
  pageNote?: string;
  publishedDate: string | null;
  /** Human or ISO month, e.g. "June 2026" / "2026-06". */
  extractedDate: string;
}

/* ── The cell: four states, absence is not one of them ───────────── */

/**
 * Every Tier 1 key is present on every entity. A metric is disclosed, N/D,
 * N/A (with a mandatory reason), or pending. Absence is not a state, because
 * an absent row is indistinguishable from an oversight.
 */
/** One prior-period observation. IFRS S1 expects comparative information, so
 *  a figure that has a history carries it rather than losing it. */
export interface SeriesPoint {
  year: string;
  /** null = the entity did not disclose that year — the line breaks, never
   *  interpolates through the gap. */
  value: number | null;
}

export type Cell =
  | {
      state: "disclosed";
      /** null for text-only metrics (targets, coverage statements). */
      value: number | null;
      display: string;
      unit: string;
      year: string;
      provenance: ProvenanceTier;
      citation: SpineCitation | null;
      note?: string;
      /**
       * Prior periods, oldest first, INCLUDING the current year as the last
       * point. Present only where the report actually publishes comparatives;
       * absent is "single-year disclosure", never an implied flat line.
       */
      series?: SeriesPoint[];
    }
  | { state: "nd"; note?: string }
  | { state: "na"; reason: string }
  | { state: "pending" };

/* ── Spine rows ──────────────────────────────────────────────────── */

export type Tier = 1 | 2 | 3;
/** "as_reported" shows every figure as published; "comparable" shows only
 *  figures whose envelopes agree, and says why when it withholds one. */
export type View = "as_reported" | "comparable";

export interface SpineRow {
  key: string;
  label: string;
  sublabel?: string;
  group: string;
  tier: Tier;
  authority: Authority;
  /** e.g. "S2 ¶29(a)", "GRI 405-1". Verify against the standard before
   *  publishing as a claim. */
  authorityRef?: string;
  unit: string;
  views: View[];
  /** Eligible for a best-performer badge — subject to envelope agreement. */
  rankable?: boolean;
  lowerIsBetter?: boolean;
  /**
   * Envelope fields that must AGREE across entities before this row may be
   * compared or ranked. Empty = broadly comparable regardless of GHG
   * accounting basis (most GRI social rows).
   */
  comparabilityKeys?: (keyof Envelope)[];
}

/* ── Entity ──────────────────────────────────────────────────────── */

/* ── IFRS S2 ¶33–37: targets ─────────────────────────────────────── */

/**
 * A climate target in the shape S2 asks for. Most fields are nullable on
 * purpose: no entity in this corpus publishes targets in this structure, and
 * the nulls are the finding. `verbatim` always carries what the report
 * actually says, so nothing is lost to the structuring attempt.
 */
export interface Target {
  /** "Net zero", "Interim Scope 1+2 reduction", … */
  objective: string;
  /** Verbatim-ish statement from the report — never discarded. */
  verbatim: string;
  /** Scopes the target covers, where stated. */
  scopeCovered: string | null;
  /** Base period against which progress is measured (S2 ¶34(b)). */
  basePeriod: string | null;
  /** Period by which the target is to be met. */
  targetPeriod: string | null;
  /** Quantified target value where one is stated. */
  value: number | null;
  unit: string | null;
  /** Validated by a third party (e.g. SBTi) — null when not stated. */
  thirdPartyValidated: boolean | null;
  /** Gross vs net of carbon credits (S2 ¶36) — null when the report is silent. */
  grossOrNet: "gross" | "net" | null;
  /** Whether the target relies on carbon credits — null when not stated. */
  usesCarbonCredits: boolean | null;
}

export interface EntitySource {
  reportTitle: string;
  reportingPeriod: string;
  url: string | null;
  accessDate: string;
}

export type EntityStatus =
  | "populated"
  | "pending_extraction"
  | "pending_verification"
  | "excluded";

export interface Entity {
  id: string;
  name: string;
  shortName: string;
  logoInitials: string;
  accentColor: string;
  categoryId: string;
  /** Listing / ticker context, or null for unlisted. */
  listing: string | null;
  countries: string[];
  businessModel: string;
  sectorLabel: string;

  /** IFRS S1: the reporting entity must match the financial-statement entity,
   *  over the same period. fiscalYearEnd drives the vintage-spread warning. */
  reportingPeriod: string;
  fiscalYearEnd: string | null;
  reportLagNote: string | null;
  boundaryNote: string | null;

  status: EntityStatus;
  rationaleCode: string | null;

  envelope: Envelope;
  source: EntitySource | null;
  metrics: Record<string, Cell>;
  /** Structured climate targets (S2 ¶33-37). Empty when none are stated. */
  targets: Target[];
  /** Raw framework strings as the dataset records them. Resolve through
   *  frameworks.ts before display or filtering. */
  frameworks: string[];
  dataNotes: string[];
  /**
   * Notes that touch restatements, extraction limits or data quality.
   * DERIVED by keyword from dataNotes — a useful reading aid, but NOT the
   * entity's own IFRS S1 estimation-uncertainty disclosure. Labelled in the UI
   * as a caveat list so it is never mistaken for one.
   */
  caveatNotes: string[];
}
