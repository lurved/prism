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
import { peerCompanies, type PeerCompany } from "@/data/peerData";
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
// metricId strings mirror the row `key` used in PeerComparison / PeerCompanyCard.
const PEER_METRIC_IDS: Array<[string, (c: PeerCompany) => number | null]> = [
  ["s1", (c) => c.scope1],
  ["s2", (c) => c.scope2],
  ["s3", (c) => c.scope3],
  ["total", (c) => c.totalGHG],
  ["headcount", (c) => c.headcount],
  ["femaleBoard", (c) => c.femaleBoardPct],
  ["netzero", (c) => c.netZeroYear],
  ["indepDir", (c) => c.independentDirectorsPct],
];

describe("Peer/bank metric provenance", () => {
  it("non-null → reported|confirmed + cited; null → unverified + no citation", () => {
    for (const set of [peerCompanies, bankCompanies]) {
      for (const c of set) {
        for (const [metricId, get] of PEER_METRIC_IDS) {
          const v = get(c);
          const mv = peerMetricValue(c, v, "unit", undefined, metricId);
          if (v === null) {
            expect(mv.status, `${c.id}/${metricId}`).toBe("unverified");
            expect(mv.citation, `${c.id}/${metricId}`).toBeNull();
          } else {
            expect(["confirmed", "reported"], `${c.id}/${metricId}`).toContain(mv.status);
            expect(mv.citation, `${c.id}/${metricId}`).not.toBeNull();
          }
        }
      }
    }
  });

  it("never emits a confirmed value without a page-level citation", () => {
    for (const set of [peerCompanies, bankCompanies]) {
      for (const c of set) {
        for (const [metricId, get] of PEER_METRIC_IDS) {
          const v = get(c);
          const mv = peerMetricValue(c, v, "unit", undefined, metricId);
          if (mv.status === "confirmed") {
            expect(mv.citation, `${c.id}/${metricId}`).not.toBeNull();
            expect(typeof mv.citation?.page, `${c.id}/${metricId} confirmed but no page`).toBe("number");
          }
        }
      }
    }
  });

  it("a citationPages entry can never promote a null value to confirmed", () => {
    for (const set of [peerCompanies, bankCompanies]) {
      for (const c of set) {
        for (const [metricId, get] of PEER_METRIC_IDS) {
          if (get(c) === null) {
            const mv = peerMetricValue(c, null, "unit", undefined, metricId);
            expect(mv.status, `${c.id}/${metricId}`).toBe("unverified");
          }
        }
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
});
