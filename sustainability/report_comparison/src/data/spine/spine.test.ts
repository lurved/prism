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
import { resolveFrameworks, unmappedFrameworks, reportsUnder } from "./frameworks";
import { assessUsability, engagementQuestions, entityUsability, isStale } from "./usability";

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
  it("blocks the utilities set on period before anything else", () => {
    // Meralco FY2024, CLP FY2025, National Grid FY2025/26 — this set was never
    // period-comparable, which is a more fundamental blocker than the boundary
    // difference below and must be reported first.
    const row = SPINE.find((r) => r.key === "scope1_abs")!;
    const verdict = assessComparability(row, utilityEntities);
    expect(verdict.blockedReason).toMatch(/reporting periods differ/i);
    expect(verdict.eligible).toHaveLength(0);
  });

  it("blocks a row when the organizational boundary differs", () => {
    // Hold the period constant to isolate the envelope check: Meralco and CLP
    // report on equity share, National Grid on operational control, so under
    // the GHG Protocol those Scope 1 figures are not comparable.
    const row = SPINE.find((r) => r.key === "scope1_abs")!;
    const samePeriod = utilityEntities.map((e) => ({ ...e, reportingPeriod: "FY2025" }));
    const verdict = assessComparability(row, samePeriod);
    expect(verdict.blockedReason).toMatch(/organizational boundary/i);
    expect(verdict.eligible).toHaveLength(0);
  });

  it("blocks a row when reporting periods differ, whatever the envelopes say", () => {
    // The error a partial period refresh of a peer set would introduce: two
    // banks on FY2025 and one still on FY2024 would otherwise compare cleanly,
    // because their accounting bases are identical across years.
    const row = SPINE.find((r) => r.key === "scope2_location")!;
    const mixed = [
      { ...bankEntities[0], reportingPeriod: "FY2025" },
      bankEntities[1],
      bankEntities[2],
    ];
    const verdict = assessComparability(row, mixed);
    expect(verdict.blockedReason).toMatch(/reporting periods differ/i);
    expect(verdict.eligible).toHaveLength(0);
  });

  it("blocks the banks set while UOB lags a period behind", () => {
    // DBS and OCBC are refreshed to FY2025; UOB is still FY2024 because its
    // report could not be read. The set is therefore not comparable, and the
    // matrix says so rather than presenting a cross-year column as like-for-like.
    const row = SPINE.find((r) => r.key === "scope2_location")!;
    expect(assessComparability(row, bankEntities).blockedReason).toMatch(/reporting periods differ/i);
  });

  it("refuses to treat matching unknowns as agreement", () => {
    // DBS and UOB do not state a consolidation approach; OCBC states
    // operational control. Before this rule, three unstated bases "agreed" and
    // compared freely — equivalence asserted from ignorance.
    const row = SPINE.find((r) => r.key === "scope2_location")!;
    const samePeriod = bankEntities.map((e) => ({ ...e, reportingPeriod: "FY2025" }));
    expect(assessComparability(row, samePeriod).blockedReason).toMatch(/not stated by/i);
  });

  it("allows a row when the envelopes are stated and agree", () => {
    const row = SPINE.find((r) => r.key === "scope2_location")!;
    const stated = bankEntities.map((e) => ({
      ...e,
      reportingPeriod: "FY2025",
      envelope: { ...e.envelope, consolidation: "operational_control" as const },
    }));
    const verdict = assessComparability(row, stated);
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

  it("credits the ¶29 metrics Sembcorp actually publishes", () => {
    // Sembcorp is the only entity in the corpus with a full S2 ¶29 metrics
    // table — (b) through (f). Extracted from its SR2025.
    const sembcorp = temasekEntities.find((e) => e.id === "sembcorp")!;
    for (const k of [
      "transition_risk_exposure",
      "physical_risk_exposure",
      "climate_opportunity",
      "climate_capital_deployment",
      "internal_carbon_price",
    ]) {
      expect(isDisclosed(sembcorp.metrics[k]), `sembcorp/${k}`).toBe(true);
    }
    expect(s2Coverage(sembcorp).score).toBe(6); // (a)-(f); (g) is in the AR, not the SR
  });

  it("credits Singtel's internal carbon price and remuneration disclosure", () => {
    const singtel = temasekEntities.find((e) => e.id === "singtel")!;
    const icp = singtel.metrics.internal_carbon_price;
    expect(isDisclosed(icp) && icp.value).toBe(50);
    const pay = singtel.metrics.exec_remuneration_climate_pct;
    expect(isDisclosed(pay) && pay.value).toBe(20);
    // The caveat must travel with the figure: it is an ESG measure over LTI,
    // not the climate-only share of total remuneration S2 asks for.
    expect(isDisclosed(pay) && pay.note).toMatch(/talent development|long-term incentive/i);
  });

  it("does not backfill ¶29 metrics across a period mismatch", () => {
    // Drive holds FY2025 reports for these while their rows are FY2024.
    // Mixing periods would breach the IFRS S1 same-period rule.
    // Meralco and UOB only — DBS and OCBC have since been refreshed to FY2025.
    for (const id of ["meralco", "uob"]) {
      const e = allEntities.find((x) => x.id === id)!;
      const cell = e.metrics.internal_carbon_price;
      expect(cell.state, `${id}`).toBe("nd");
      expect(cell.state === "nd" && cell.note).toMatch(/Not extracted/);
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


/* ── Controlled framework vocabulary ─────────────────────────────── */
describe("Framework vocabulary", () => {
  it("maps every raw framework string in the corpus — no silent new categories", () => {
    const all = allEntities.flatMap((e) => e.frameworks);
    expect(unmappedFrameworks(all), "unmapped framework strings").toEqual([]);
  });

  it("collapses spelling variants onto one canonical name", () => {
    // "GRI 2021" and "GRI G4 Electric Utilities" both mean GRI; previously
    // they rendered as three separate chips.
    const meralco = utilityEntities.find((e) => e.id === "meralco")!;
    const canon = resolveFrameworks(meralco.frameworks).map((f) => f.canonical);
    expect(canon.filter((c) => c === "GRI")).toHaveLength(1);
    expect(new Set(canon).size).toBe(canon.length);
  });

  it("makes a cross-category standards filter possible", () => {
    // The question the free-text vocabulary could not answer.
    const s2 = allEntities.filter((e) => reportsUnder(e.frameworks, "IFRS S2"));
    expect(s2.length).toBeGreaterThan(0);
    // CLP reports under HKFRS S2 — the HK adoption — and must be counted.
    expect(s2.map((e) => e.id)).toContain("clp");
  });

  it("keeps the raw string for display detail", () => {
    const clp = utilityEntities.find((e) => e.id === "clp")!;
    const hk = resolveFrameworks(clp.frameworks).find((f) => f.canonical === "IFRS S2")!;
    expect(hk.raw).toBe("HKFRS S2");
    expect(hk.qualifier).toMatch(/Hong Kong/);
  });
});

/* ── IFRS S1 comparatives ────────────────────────────────────────── */
describe("Comparative information", () => {
  it("attaches a series only where the report publishes ≥2 periods", () => {
    for (const e of allEntities) {
      for (const [key, cell] of Object.entries(e.metrics)) {
        if (cell.state !== "disclosed" || !cell.series) continue;
        const disclosed = cell.series.filter((p) => p.value !== null);
        expect(disclosed.length, `${e.id}/${key} has a 1-point series`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("orders series oldest-first and ends on the current value", () => {
    for (const e of allEntities) {
      for (const [key, cell] of Object.entries(e.metrics)) {
        if (cell.state !== "disclosed" || !cell.series) continue;
        const years = cell.series.map((p) => p.year);
        expect(years, `${e.id}/${key} series is not chronological`).toEqual([...years].sort());
        expect(cell.series[cell.series.length - 1].value, `${e.id}/${key} series tail ≠ current value`).toBe(cell.value);
      }
    }
  });

  it("carries the Temasek emissions history in tCO₂e", () => {
    const singtel = temasekEntities.find((e) => e.id === "singtel")!;
    const s3 = singtel.metrics.scope3_abs;
    expect(s3.state === "disclosed" && s3.series?.length).toBe(3);
    expect(s3.state === "disclosed" && s3.series?.[0].value).toBe(3_622_500); // FY2023, 3,622.5 kt
  });

  it("folds IHH's year-keyed intensity into one series instead of two keys", () => {
    const ihh = healthcareSpineEntities.find((e) => e.id === "ihh")!;
    const cell = ihh.metrics.intensity_bed_day;
    expect(cell.state === "disclosed" && cell.series?.map((p) => p.year)).toEqual(["2022", "2025"]);
  });
});

/* ── IFRS S2 ¶33–37 targets ──────────────────────────────────────── */
describe("Structured targets", () => {
  it("never discards what the report actually says", () => {
    for (const e of allEntities) {
      for (const t of e.targets) {
        expect(t.verbatim?.trim().length, `${e.id} target has no verbatim statement`).toBeGreaterThan(0);
        expect(t.objective.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("records the finding: no entity publishes a fully S2-structured target", () => {
    // Every target in the corpus is missing at least one element S2 asks for
    // (gross vs net, carbon-credit reliance, or third-party validation).
    // If this ever fails, an entity has improved its disclosure and the
    // coverage story should be revisited.
    const complete = allEntities.flatMap((e) => e.targets).filter(
      (t) => t.grossOrNet !== null && t.usesCarbonCredits !== null && t.thirdPartyValidated !== null,
    );
    expect(complete).toHaveLength(0);
  });

  it("gives every entity with a net-zero year a corresponding target", () => {
    for (const e of allEntities) {
      const nz = e.metrics.net_zero_year;
      if (nz?.state === "disclosed") {
        expect(e.targets.some((t) => t.objective === "Net zero"), `${e.id}`).toBe(true);
      }
    }
  });
});


/* ── Decision-usefulness: the analyst layer ──────────────────────── */
describe("Decision-usefulness", () => {
  it("never grades an undisclosed figure as usable", () => {
    for (const { pack, entities } of CATEGORY_SETS) {
      for (const e of entities) {
        for (const row of rowsForPack(pack)) {
          const cell = e.metrics[row.key];
          const v = assessUsability(cell, row, e);
          if (!isDisclosed(cell)) {
            expect(v.grade, `${e.id}/${row.key}`).toBe("not_usable");
          }
        }
      }
    }
  });

  it("requires page-verification AND external assurance for a high grade", () => {
    for (const { pack, entities } of CATEGORY_SETS) {
      for (const e of entities) {
        for (const row of rowsForPack(pack)) {
          const v = assessUsability(e.metrics[row.key], row, e);
          if (v.grade === "high") {
            expect(v.checks.pageVerified, `${e.id}/${row.key}`).toBe(true);
            expect(v.checks.externallyAssured, `${e.id}/${row.key}`).toBe(true);
            expect(v.checks.basisStated, `${e.id}/${row.key}`).toBe(true);
            expect(v.checks.current, `${e.id}/${row.key}`).toBe(true);
          }
        }
      }
    }
  });

  it("caps a stale row at 'limited', however well sourced", () => {
    // Meralco and UOB remain FY2024 with FY2025 reports available but unreadable.
    for (const id of ["meralco", "uob"]) {
      const e = allEntities.find((x) => x.id === id)!;
      expect(isStale(e), id).toBe(true);
      const row = SPINE.find((r) => r.key === "scope1_abs")!;
      const v = assessUsability(e.metrics.scope1_abs, row, e);
      expect(["limited", "not_usable"], id).toContain(v.grade);
      expect(v.limitations.join(" ")).toMatch(/superseded/i);
    }
  });

  it("downgrades a figure whose accounting basis is unstated", () => {
    // SMRT does not state its consolidation approach, so its Scope 1 cannot
    // be relied on for comparison however precisely it is reported.
    const smrt = temasekEntities.find((e) => e.id === "smrt")!;
    const row = SPINE.find((r) => r.key === "scope1_abs")!;
    const v = assessUsability(smrt.metrics.scope1_abs, row, smrt);
    expect(v.checks.basisStated).toBe(false);
    expect(v.grade).toBe("limited");
  });

  it("always explains a grade below high", () => {
    for (const { pack, entities } of CATEGORY_SETS) {
      for (const e of entities) {
        for (const row of rowsForPack(pack)) {
          const v = assessUsability(e.metrics[row.key], row, e);
          if (v.grade !== "high") {
            expect(v.limitations.length, `${e.id}/${row.key} graded ${v.grade} with no reason`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("clears the staleness flag on the refreshed banks", () => {
    for (const id of ["dbs", "ocbc"]) {
      const e = allEntities.find((x) => x.id === id)!;
      expect(e.reportingPeriod, id).toBe("FY2025");
      expect(isStale(e), id).toBe(false);
    }
  });

  it("renders unextracted fields as pending, never as N/D", () => {
    // Claiming an entity did not disclose something we have not read would be
    // a false statement about that entity.
    const dbs = allEntities.find((e) => e.id === "dbs")!;
    expect(dbs.metrics.female_board_pct.state).toBe("pending");
    expect(dbs.status).toBe("pending_extraction");
  });

  it("rolls up to a usable share within 0-100", () => {
    for (const { pack, entities } of CATEGORY_SETS) {
      for (const e of entities) {
        const u = entityUsability(e, rowsForPack(pack));
        expect(u.usableShare).toBeGreaterThanOrEqual(0);
        expect(u.usableShare).toBeLessThanOrEqual(100);
      }
    }
  });
});

/* ── Engagement questions ────────────────────────────────────────── */
describe("Engagement questions", () => {
  it("turns every structural gap into a question with a standards basis", () => {
    for (const e of allEntities) {
      for (const q of engagementQuestions(e)) {
        expect(q.question.trim().length, `${e.id}`).toBeGreaterThan(30);
        expect(q.basis.trim().length, `${e.id}`).toBeGreaterThan(5);
        expect(q.topic.trim().length).toBeGreaterThan(2);
      }
    }
  });

  it("asks for dual Scope 2 where only one basis is published", () => {
    // Singtel publishes market-based only.
    const singtel = temasekEntities.find((e) => e.id === "singtel")!;
    expect(engagementQuestions(singtel).some((q) => /dual reporting/i.test(q.basis))).toBe(true);
  });

  it("asks the boundary question where consolidation is unstated", () => {
    const smrt = temasekEntities.find((e) => e.id === "smrt")!;
    expect(engagementQuestions(smrt).some((q) => /consolidation approach/i.test(q.question))).toBe(true);
  });

  it("raises no S2 ¶29 question against an entity that discloses the set", () => {
    // Sembcorp discloses (b)-(f); only (g) is outstanding, so the question
    // must name (g) and not the ones it does publish.
    const sembcorp = temasekEntities.find((e) => e.id === "sembcorp")!;
    const q = engagementQuestions(sembcorp).find((x) => /cross-industry/i.test(x.topic));
    expect(q?.question).toMatch(/¶29\(g\)/);
    expect(q?.question).not.toMatch(/¶29\(b\)/);
  });
});
