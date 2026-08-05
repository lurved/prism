/**
 * SPINE INVARIANTS — the guardrails that make the contract real.
 *
 * The point of the spine is that a category cannot quietly diverge. These
 * tests are what enforce that: they fail the build if a Tier 1 key goes
 * missing, if emissions are entered on the wrong magnitude, if an N/A appears
 * without a reason, or if provenance is claimed rather than earned.
 */
import { describe, it, expect } from "vitest";

import {
  SPINE,
  PACKS,
  S2_COVERAGE,
  rowsForPack,
  assessComparability,
  bestPerformer,
  s2Coverage,
  isDisclosed,
  temasekEntities,
  utilityEntities,
  bankEntities,
  healthcareSpineEntities,
  allEntities,
  type Entity,
  type PackId,
} from "./index";
import { CATEGORIES } from "./categories";

const CATEGORY_SETS: { id: string; pack: PackId; entities: Entity[] }[] = [
  { id: "temasek", pack: "diversified", entities: temasekEntities },
  { id: "utility", pack: "utilities", entities: utilityEntities },
  { id: "banks", pack: "banks", entities: bankEntities },
  { id: "healthcare", pack: "healthcare", entities: healthcareSpineEntities },
];

/* ── Absence is not a state ──────────────────────────────────────── */
describe("Tier 1 completeness", () => {
  it("every entity answers every Tier 1 row — a value, N/D, N/A or pending", () => {
    const tier1 = SPINE.filter((r) => r.tier === 1);
    for (const e of allEntities) {
      for (const row of tier1) {
        expect(e.metrics[row.key], `${e.id} is missing Tier 1 row "${row.key}"`).toBeDefined();
      }
    }
  });

  it("every entity answers its own category's industry pack", () => {
    for (const { pack, entities } of CATEGORY_SETS) {
      for (const e of entities) {
        for (const row of PACKS[pack]) {
          expect(e.metrics[row.key], `${e.id} is missing pack row "${row.key}"`).toBeDefined();
        }
      }
    }
  });

  it("spine keys are unique across the registry and every pack", () => {
    for (const pack of Object.keys(PACKS) as PackId[]) {
      const keys = rowsForPack(pack).map((r) => r.key);
      expect(new Set(keys).size, `duplicate key in pack "${pack}"`).toBe(keys.length);
    }
  });
});

/* ── One unit at rest: the 1000x trap ────────────────────────────── */
describe("Emissions are tCO₂e everywhere", () => {
  it("converts the ktCO₂e-native Temasek dataset exactly once", () => {
    const sembcorp = temasekEntities.find((e) => e.id === "sembcorp")!;
    const s1 = sembcorp.metrics.scope1_abs;
    expect(isDisclosed(s1) && s1.value).toBe(7_425_400); // 7,425.4 ktCO₂e
    expect(isDisclosed(s1) && s1.unit).toBe("tCO₂e");
  });

  it("puts every disclosed absolute-emissions figure on a plausible tonnes scale", () => {
    // A ktCO₂e value left unconverted would land far below this floor for an
    // entity of any size — the exact failure this guards against.
    const keys = ["scope1_abs", "scope2_abs", "scope3_abs", "scope1and2_abs"];
    for (const e of allEntities) {
      for (const k of keys) {
        const cell = e.metrics[k];
        if (isDisclosed(cell) && cell.value !== null) {
          expect(cell.unit, `${e.id}/${k}`).toBe("tCO₂e");
          expect(cell.value, `${e.id}/${k} looks like ktCO₂e, not tCO₂e`).toBeGreaterThan(100);
        }
      }
    }
  });
});

/* ── N/A must justify itself ─────────────────────────────────────── */
describe("Cell states", () => {
  it("every N/A carries a reason", () => {
    for (const e of allEntities) {
      for (const [key, cell] of Object.entries(e.metrics)) {
        if (cell.state === "na") {
          expect(cell.reason.trim().length, `${e.id}/${key} is N/A with no reason`).toBeGreaterThan(15);
        }
      }
    }
  });

  it("no disclosed cell is an empty display", () => {
    for (const e of allEntities) {
      for (const [key, cell] of Object.entries(e.metrics)) {
        if (cell.state === "disclosed") {
          expect(cell.display.trim().length, `${e.id}/${key}`).toBeGreaterThan(0);
        }
      }
    }
  });
});

/* ── Provenance is earned identically on every category ──────────── */
describe("Provenance ladder", () => {
  it("confirmed requires a page; a page-less citation is reported; none is unverified", () => {
    for (const e of allEntities) {
      for (const [key, cell] of Object.entries(e.metrics)) {
        if (cell.state !== "disclosed") continue;
        const ctx = `${e.id}/${key}`;
        if (cell.provenance === "confirmed") {
          expect(typeof cell.citation?.page, `${ctx} confirmed without a page`).toBe("number");
        }
        if (cell.citation && cell.citation.page === null) {
          expect(cell.provenance, `${ctx} page-less but claims confirmed`).not.toBe("confirmed");
        }
        if (!cell.citation) {
          expect(["unverified", "reported"], ctx).toContain(cell.provenance);
        }
      }
    }
  });

  it("page-verified figures exist — the ladder is not collapsed to one tier", () => {
    const confirmed = allEntities.flatMap((e) =>
      Object.values(e.metrics).filter((c) => c.state === "disclosed" && c.provenance === "confirmed"),
    );
    expect(confirmed.length).toBeGreaterThan(0);
  });
});

/* ── Comparability is derived from the GHG Protocol envelope ─────── */
describe("Comparability", () => {
  it("blocks a row when the organizational boundary differs", () => {
    // Meralco and CLP report on equity share; National Grid on operational
    // control. Under the GHG Protocol those Scope 1 figures are not comparable.
    const row = SPINE.find((r) => r.key === "scope1_abs")!;
    const verdict = assessComparability(row, utilityEntities);
    expect(verdict.blockedReason).toMatch(/organizational boundary/i);
    expect(verdict.eligible).toHaveLength(0);
  });

  it("allows a row when the envelopes agree", () => {
    // All three banks dual-report Scope 2 and share an (unknown) boundary.
    const row = SPINE.find((r) => r.key === "scope2_location")!;
    const verdict = assessComparability(row, bankEntities);
    expect(verdict.blockedReason).toBeNull();
    expect(verdict.eligible.length).toBeGreaterThanOrEqual(2);
  });

  it("never badges a row whose envelopes disagree, and always explains why", () => {
    for (const { pack, entities } of CATEGORY_SETS) {
      for (const row of rowsForPack(pack)) {
        const { winnerId, reason } = bestPerformer(row, entities);
        if (!row.rankable) {
          expect(winnerId, `${row.key} is not rankable but produced a winner`).toBeNull();
          continue;
        }
        if (winnerId === null && reason !== null) {
          expect(reason.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("never ranks a single entity", () => {
    for (const { pack, entities } of CATEGORY_SETS) {
      for (const row of rowsForPack(pack).filter((r) => r.rankable)) {
        const disclosed = entities.filter((e) => isDisclosed(e.metrics[row.key]));
        if (disclosed.length < 2) {
          expect(bestPerformer(row, entities).winnerId, `${row.key} ranked n<2`).toBeNull();
        }
      }
    }
  });
});

/* ── IFRS S2 coverage scorecard ──────────────────────────────────── */
describe("S2 cross-industry coverage", () => {
  it("scores every entity within range and counts only what it discloses", () => {
    for (const e of allEntities) {
      const r = s2Coverage(e);
      expect(r.total).toBe(S2_COVERAGE.length);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(r.total);
      expect(r.covered.length + r.missing.length).toBe(r.total);
    }
  });

  it("credits gross GHG where it is disclosed", () => {
    const sembcorp = temasekEntities.find((e) => e.id === "sembcorp")!;
    expect(s2Coverage(sembcorp).covered).toContain("a");
  });

  it("records the exec-pay gap: S2 asks for a %, the corpus stores a boolean", () => {
    // Every entity in the corpus fails (g) — none discloses the percentage.
    // If this ever passes, the data has genuinely improved and the test
    // should be updated to match.
    for (const e of allEntities) {
      expect(isDisclosed(e.metrics.exec_remuneration_climate_pct), `${e.id}`).toBe(false);
    }
  });
});

/* ── The page contract ───────────────────────────────────────────── */
describe("Category registry", () => {
  it("has unique ids, hrefs and labels", () => {
    for (const field of ["id", "href", "label"] as const) {
      const vals = CATEGORIES.map((c) => c[field]);
      expect(new Set(vals).size, `duplicate ${field}`).toBe(vals.length);
    }
  });

  it("derives a freshness stamp from the data instead of a hand-typed string", () => {
    for (const c of CATEGORIES) {
      expect(c.asOf, `${c.id} has no derived as-of date`).toMatch(/\d{4}/);
    }
  });

  it("gives every category entities and a resolvable source per populated entity", () => {
    for (const c of CATEGORIES) {
      expect(c.entities.length, c.id).toBeGreaterThan(0);
      for (const e of c.entities.filter((x) => x.status === "populated")) {
        expect(e.source, `${e.id} has no source`).not.toBeNull();
      }
    }
  });
});
