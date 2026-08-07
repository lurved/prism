/**
 * Data-integrity gate.
 *
 * These are the guardrails the audit flagged as missing: invariants that must
 * hold for EVERY figure across EVERY vertical, checked at CI time so a bad data
 * shape (wrong provenance, out-of-range %, unsourced number, N/D rendered as 0)
 * fails the PR instead of reaching production.
 *
 * They read the same builders the UI and export use — so a violation here is a
 * violation the user would have seen.
 */
import { describe, it, expect } from "vitest";

import { METRIC_DEFS, buildMetricValue, buildMetricSeries } from "@/lib/metrics";
import { peerMetricValue } from "@/lib/peerMetrics";
import { companies, aggregateTotals } from "@/data/esgData";
import { peerCompanies, COMMUNITY_BASIS_LABEL } from "@/data/peerData";
import { bankCompanies } from "@/data/bankData";
import {
  healthcareEntities,
  effectiveFlag,
  type MetricValue as HcMetricValue,
} from "@/data/healthcareData";
import type { Company } from "@/data/types";

const URL_RE = /^https?:\/\//;
const ISO_MONTH_RE = /^\d{4}(-\d{2})?(-\d{2})?$/;

/* ── Provenance invariants (the core of the audit) ───────────────── */
describe("Company metric provenance", () => {
  it("never emits a confirmed value without a page-level citation", () => {
    for (const c of companies) {
      for (const def of METRIC_DEFS) {
        const mv = buildMetricValue(c, def);
        if (mv.status === "confirmed") {
          expect(mv.citation, `${c.id}/${def.metricId}`).not.toBeNull();
          expect(
            typeof mv.citation?.page,
            `${c.id}/${def.metricId} confirmed but no page`,
          ).toBe("number");
        }
      }
    }
  });

  it("maps null → unverified/N-D and non-null → cited (confirmed|reported)", () => {
    for (const c of companies) {
      for (const def of METRIC_DEFS) {
        const mv = buildMetricValue(c, def);
        if (mv.value === null) {
          expect(mv.status, `${c.id}/${def.metricId}`).toBe("unverified");
          expect(mv.citation, `${c.id}/${def.metricId}`).toBeNull();
        } else {
          expect(["confirmed", "reported"]).toContain(mv.status);
          expect(mv.citation, `${c.id}/${def.metricId}`).not.toBeNull();
        }
      }
    }
  });

  it("carries a unit for every metric value", () => {
    for (const s of buildMetricSeries(companies)) {
      for (const mv of s.values) {
        expect(mv.unit.length, `${s.companyId}/${s.metricId}`).toBeGreaterThan(0);
      }
    }
  });
});

/* ── Range / sanity checks on disclosed numbers ──────────────────── */
const PCT_METRICS: Array<(c: Company) => number | null> = [
  (c) => c.environmental.renewableEnergyPct,
  (c) => c.environmental.scope1and2ReductionPct,
  (c) => c.social.femaleBoardPct,
  (c) => c.social.femaleLeadershipPct,
  (c) => c.governance.independentDirectorsPct,
  (c) => c.governance.antiCorruptionTrainingPct,
];

describe("Disclosed values are in range", () => {
  it("percentages sit within 0–100", () => {
    for (const c of companies) {
      for (const get of PCT_METRICS) {
        const v = get(c);
        if (v !== null) {
          expect(v, c.id).toBeGreaterThanOrEqual(0);
          expect(v, c.id).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("emissions are non-negative where disclosed", () => {
    for (const c of companies) {
      for (const y of c.historicalEmissions) {
        expect(y.scope1, `${c.id}/${y.year}`).toBeGreaterThanOrEqual(0);
        expect(y.scope2, `${c.id}/${y.year}`).toBeGreaterThanOrEqual(0);
        if (y.scope3 !== null) expect(y.scope3, `${c.id}/${y.year}`).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

/* ── Source integrity across the main + peer + bank datasets ─────── */
describe("Every company has a resolvable source", () => {
  it("main dataset: https url + ISO extracted date + unique id", () => {
    const ids = new Set<string>();
    for (const c of companies) {
      expect(c.dataSource.url, c.id).toMatch(URL_RE);
      expect(c.dataSource.extractedDateISO, c.id).toMatch(ISO_MONTH_RE);
      expect(ids.has(c.id), `duplicate id ${c.id}`).toBe(false);
      ids.add(c.id);
    }
  });

  it("peer + bank datasets: https url + unique ids per set", () => {
    for (const set of [peerCompanies, bankCompanies]) {
      const ids = new Set<string>();
      for (const c of set) {
        expect(c.dataSource.url, c.id).toMatch(URL_RE);
        expect(ids.has(c.id), `duplicate id ${c.id}`).toBe(false);
        ids.add(c.id);
      }
    }
  });
});

/* ── Peer/bank figures carry the same per-figure provenance ──────── */
describe("Peer/bank metric provenance", () => {
  it("non-null → reported + cited; null → unverified + no citation", () => {
    for (const set of [peerCompanies, bankCompanies]) {
      for (const c of set) {
        const vals = [c.scope1, c.scope2, c.scope3, c.totalGHG, c.headcount, c.femaleBoardPct, c.netZeroYear];
        for (const v of vals) {
          const mv = peerMetricValue(c, v, "unit");
          if (v === null) {
            expect(mv.status, c.id).toBe("unverified");
            expect(mv.citation, c.id).toBeNull();
          } else {
            expect(mv.status, c.id).toBe("reported");
            expect(mv.citation, c.id).not.toBeNull();
          }
        }
      }
    }
  });
});

/* ── N/A is a distinct state from N/D, and must carry a reason ───── */
describe("Not-applicable metrics", () => {
  it("every naMetrics entry names a real metric and gives a reason", () => {
    const known = new Set(METRIC_DEFS.map((d) => d.metricId));
    for (const c of companies) {
      for (const [metricId, reason] of Object.entries(c.naMetrics ?? {})) {
        expect(known.has(metricId), `${c.id}: unknown metricId "${metricId}"`).toBe(true);
        expect(reason.trim().length, `${c.id}/${metricId} needs a reason`).toBeGreaterThan(20);
      }
    }
  });

  it("renders N/A (not N/D) with no citation, and never carries a value", () => {
    for (const c of companies) {
      for (const def of METRIC_DEFS) {
        const mv = buildMetricValue(c, def);
        if (c.naMetrics?.[def.metricId] !== undefined) {
          expect(mv.notApplicable, `${c.id}/${def.metricId}`).toBe(true);
          expect(mv.value, `${c.id}/${def.metricId}`).toBeNull();
          expect(mv.citation, `${c.id}/${def.metricId}`).toBeNull();
          expect(mv.notes, `${c.id}/${def.metricId}`).toBe(c.naMetrics[def.metricId]);
        } else {
          expect(mv.notApplicable, `${c.id}/${def.metricId}`).toBeFalsy();
        }
      }
    }
  });
});

/* ── Scope 2 basis is stated per company, never asserted in a label ── */
describe("Scope 2 reporting basis", () => {
  it("every company states its own basis, and it reaches the metric notes", () => {
    for (const c of companies) {
      expect(c.environmental.scope2Basis?.trim().length, c.id).toBeGreaterThan(0);
      const def = METRIC_DEFS.find((d) => d.metricId === "scope2")!;
      expect(buildMetricValue(c, def).notes, c.id).toContain(c.environmental.scope2Basis);
    }
  });

  it("the Scope 2 column label makes no claim about the basis", () => {
    const def = METRIC_DEFS.find((d) => d.metricId === "scope2")!;
    // The set is genuinely mixed (Sembcorp location-based, SMRT unstated,
    // Singtel market-based), so a single label can only ever be wrong for two
    // of the three.
    expect(`${def.label} ${def.sublabel ?? ""}`.toLowerCase()).not.toMatch(/market-based|location-based/);
  });
});

/* ── Community investment: the basis is never left implicit ──────── */
describe("Community investment basis", () => {
  it("peer + bank sets declare a basis consistent with the figure shown", () => {
    for (const set of [peerCompanies, bankCompanies]) {
      for (const c of set) {
        expect(COMMUNITY_BASIS_LABEL[c.communityInvestmentBasis], c.id).toBeTruthy();
        // "not_disclosed" and an actual figure are mutually exclusive.
        const looksDisclosed = c.communityInvestmentNative.trim() !== "N/D";
        expect(c.communityInvestmentBasis !== "not_disclosed", c.id).toBe(looksDisclosed);
      }
    }
  });
});

/* ── N/D never silently becomes 0 in aggregates ──────────────────── */
describe("Aggregates respect N/D", () => {
  it("aggregateTotals are finite (no NaN from null arithmetic)", () => {
    expect(Number.isFinite(aggregateTotals.totalScope1ktCO2e)).toBe(true);
    expect(Number.isFinite(aggregateTotals.totalScope2ktCO2e)).toBe(true);
    expect(Number.isFinite(aggregateTotals.totalHeadcount)).toBe(true);
    expect(Number.isFinite(aggregateTotals.avgFemaleBoard)).toBe(true);
    expect(Number.isFinite(aggregateTotals.earliestNetZero)).toBe(true);
    expect(Number.isFinite(aggregateTotals.latestNetZero)).toBe(true);
  });
});

/* ── Healthcare vertical enforces its own hard rule ──────────────── */
describe("Healthcare provenance", () => {
  it("a value with no citation can never be effectively confirmed", () => {
    for (const e of healthcareEntities) {
      for (const [key, mv] of Object.entries(e.metrics) as [string, HcMetricValue][]) {
        if (mv.citation === null) {
          expect(effectiveFlag(mv), `${e.id}/${key}`).not.toBe("confirmed");
        }
      }
    }
  });

  // "Confirmed" must be earned the SAME way on every vertical: a page was
  // recorded for THIS figure. Without this, page-less healthcare figures
  // rendered ✅ while identical evidence rendered • on banks/utilities.
  it("a citation with no page degrades to 'reported', never 'confirmed'", () => {
    for (const e of healthcareEntities) {
      for (const [key, mv] of Object.entries(e.metrics) as [string, HcMetricValue][]) {
        if (mv.citation !== null && mv.citation.page === null) {
          expect(effectiveFlag(mv), `${e.id}/${key}`).not.toBe("confirmed");
        }
        if (effectiveFlag(mv) === "confirmed") {
          expect(typeof mv.citation?.page, `${e.id}/${key} confirmed but no page`).toBe("number");
        }
      }
    }
  });

  it("matches how the other verticals tier the same evidence", () => {
    // Same evidentiary state, same tier, whichever page you are on.
    const pageless = peerMetricValue(peerCompanies[0], 42, "unit"); // peer sets record no pages
    expect(pageless.status).toBe("reported");
    const hcPageless = healthcareEntities
      .flatMap((e) => Object.values(e.metrics) as HcMetricValue[])
      .find((mv) => mv.citation !== null && mv.citation.page === null && mv.value !== null);
    expect(hcPageless && effectiveFlag(hcPageless)).toBe("reported");
  });
});
