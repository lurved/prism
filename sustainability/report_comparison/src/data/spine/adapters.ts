/**
 * ADAPTERS — existing datasets → the spine.
 *
 * The four verified data files stay the source of truth: no figure is
 * re-extracted, re-derived or moved here. These functions only RESHAPE them
 * onto the canonical keys, which is what makes one matrix, one export and one
 * page template possible.
 *
 * Two rules the adapters enforce mechanically:
 *   - Emissions are normalised to tCO₂e at rest. The Temasek dataset stores
 *     ktCO₂e, so it is multiplied here — the 1000× trap from the review, fixed
 *     in exactly one place.
 *   - Provenance is derived, never passed through: a page-level citation earns
 *     "confirmed", a document-level one earns "reported", nothing earns
 *     "unverified". Same rule for all four categories.
 */
import type { Company } from "../types";
import type { PeerCompany } from "../peerData";
import { COMMUNITY_BASIS_LABEL } from "../peerData";
import type { HealthcareEntity, MetricValue as HcMetricValue } from "../healthcareData";
import { effectiveFlag } from "../healthcareData";
import { ENVELOPES, FISCAL_YEAR_END, UNKNOWN_ENVELOPE } from "./envelopes";
import { PERIOD_MISMATCH, s2DisclosuresFor, type S2GapKey } from "./s2Disclosures";
import {
  CONSOLIDATION_LABEL,
  SCOPE2_METHOD_LABEL,
  ASSURANCE_LEVEL_LABEL,
  GWP_LABEL,
  type Cell,
  type Entity,
  type Envelope,
  type SeriesPoint,
  type SpineCitation,
  type Target,
} from "./types";

/**
 * Notes that touch restatement, extraction limits or data quality. This is a
 * keyword heuristic over the existing notes — a reading aid, NOT the entity's
 * own IFRS S1 estimation-uncertainty disclosure, and the UI labels it as such.
 */
function caveatsFrom(notes: string[]): string[] {
  return notes.filter((n) =>
    /restat|estimat|approximate|not extract|not recorded|ambiguous|CORRECTED|blocked|pending|not stated/i.test(n),
  );
}

/* ── Cell constructors ───────────────────────────────────────────── */

const ND = (note?: string): Cell => ({ state: "nd", note });
const NA = (reason: string): Cell => ({ state: "na", reason });
const PENDING: Cell = { state: "pending" };

/** Provenance is a function of the citation, never hand-set. */
function tierFor(cite: SpineCitation | null): "confirmed" | "reported" | "unverified" {
  if (!cite) return "unverified";
  return cite.page !== null ? "confirmed" : "reported";
}

function fmtTonnes(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M tCO₂e`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k tCO₂e`;
  return `${Math.round(v).toLocaleString()} tCO₂e`;
}

function num(
  value: number | null,
  unit: string,
  year: string,
  cite: SpineCitation | null,
  opts: { display?: string; note?: string; series?: SeriesPoint[] } = {},
): Cell {
  if (value === null) return ND(opts.note);
  const display =
    opts.display ?? (unit === "tCO₂e" ? fmtTonnes(value) : `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`);
  // A series is only attached when the report publishes comparatives — two or
  // more points. One point is a single-year disclosure, not a trend.
  const series = opts.series && opts.series.filter((p) => p.value !== null).length >= 2 ? opts.series : undefined;
  return { state: "disclosed", value, display, unit, year, provenance: tierFor(cite), citation: cite, note: opts.note, series };
}

function txt(display: string | null, year: string, cite: SpineCitation | null, note?: string): Cell {
  if (!display) return ND(note);
  return { state: "disclosed", value: null, display, unit: "", year, provenance: tierFor(cite), citation: cite, note };
}

/** Entity/boundary descriptors — sourced from the report, never page-cited. */
function meta(display: string, year: string, cite: SpineCitation | null, note?: string): Cell {
  return { state: "disclosed", value: null, display, unit: "", year, provenance: cite ? "reported" : "unverified", citation: cite, note };
}

/** The six envelope rows every entity answers identically. */
function envelopeCells(env: Envelope, period: string, cite: SpineCitation | null): Record<string, Cell> {
  return {
    consolidation:
      env.consolidation === "unknown"
        ? ND("The report does not state its GHG Protocol organizational boundary (equity share vs control).")
        : meta(CONSOLIDATION_LABEL[env.consolidation], period, cite),
    scope2_method_row:
      env.scope2Method === "not_stated"
        ? ND("The report does not label its Scope 2 as location- or market-based.")
        : meta(SCOPE2_METHOD_LABEL[env.scope2Method], period, cite),
    base_year: env.baseYear
      ? meta(env.baseYear, period, cite, env.baseYearNote ?? undefined)
      : ND(env.baseYearNote ?? "No base year stated."),
    gwp_source:
      env.gwpSource === "not_stated"
        ? ND("The report does not state which IPCC assessment-report GWP values it applies.")
        : meta(GWP_LABEL[env.gwpSource], period, cite),
    assurance_level: meta(
      ASSURANCE_LEVEL_LABEL[env.assurance],
      period,
      cite,
      env.assuranceProvider ?? undefined,
    ),
    scope3_categories:
      env.scope3Categories === null
        ? ND("The report does not enumerate which of the 15 Scope 3 categories are included.")
        : meta(
            `Cats ${env.scope3Categories.join(", ")}`,
            period,
            cite,
            `${env.scope3Categories.length} of 15 GHG Protocol categories.`,
          ),
  };
}

const S2_GAP_REFS: Record<S2GapKey, string> = {
  transition_risk_exposure: "¶29(b)",
  physical_risk_exposure: "¶29(c)",
  climate_opportunity: "¶29(d)",
  climate_capital_deployment: "¶29(e)",
  internal_carbon_price: "¶29(f)",
  exec_remuneration_climate_pct: "¶29(g)",
};

/**
 * The S2 ¶29(b)–(f) rows. Populated from s2Disclosures.ts where the entity
 * actually publishes the metric, and otherwise an N/D that names the paragraph
 * asking for it — so silence is countable rather than an absent row.
 *
 * Where the only available report covers a LATER period than the entity row,
 * the N/D says so instead of implying the entity failed to disclose.
 */
function s2GapCells(entityId: string, cite: SpineCitation | null): Record<string, Cell> {
  const disclosed = s2DisclosuresFor(entityId);
  const mismatch = PERIOD_MISMATCH[entityId];
  const keys: S2GapKey[] = [
    "transition_risk_exposure",
    "physical_risk_exposure",
    "climate_opportunity",
    "climate_capital_deployment",
    "internal_carbon_price",
  ];
  const out: Record<string, Cell> = {};
  for (const key of keys) {
    const d = disclosed[key];
    if (d) {
      out[key] = {
        state: "disclosed",
        value: d.value,
        display: d.display,
        unit: d.unit,
        year: d.year,
        provenance: d.page !== null ? "confirmed" : "reported",
        citation: {
          reportTitle: d.reportTitle,
          url: cite?.url ?? null,
          page: d.page,
          publishedDate: cite?.publishedDate ?? null,
          extractedDate: cite?.extractedDate ?? "2026-08",
        },
        note: d.note,
      };
    } else if (mismatch) {
      out[key] = ND(
        `Not extracted: ${mismatch} Mixing periods would breach the IFRS S1 same-period rule, so ${S2_GAP_REFS[key]} is left open pending a period refresh.`,
      );
    } else {
      out[key] = ND(
        `Not disclosed in the source report. IFRS S2 ${S2_GAP_REFS[key]} asks for this as a cross-industry metric.`,
      );
    }
  }
  return out;
}

/**
 * S2 ¶29(g) asks for the PERCENTAGE of executive remuneration linked to
 * climate. Where an entity publishes one it is used; otherwise a boolean
 * "linked / not linked" is all the corpus holds, and the honest cell is an N/D
 * carrying that finding rather than a Yes that does not answer the question.
 */
function execPayCellFor(entityId: string, linked: boolean | null | undefined, cite: SpineCitation | null): Cell {
  const d = s2DisclosuresFor(entityId).exec_remuneration_climate_pct;
  if (d) {
    return {
      state: "disclosed",
      value: d.value,
      display: d.display,
      unit: d.unit,
      year: d.year,
      provenance: d.page !== null ? "confirmed" : "reported",
      citation: {
        reportTitle: d.reportTitle,
        url: cite?.url ?? null,
        page: d.page,
        publishedDate: cite?.publishedDate ?? null,
        extractedDate: cite?.extractedDate ?? "2026-08",
      },
      note: d.note,
    };
  }
  return execPayCell(linked);
}

/**
 * S2 ¶29(g) asks for the PERCENTAGE of executive remuneration linked to
 * climate. Every dataset in this corpus stores a boolean instead, so the
 * honest cell is "linked, but the percentage is not disclosed" — an N/D that
 * carries the finding, not a Yes that pretends to answer the question.
 */
function execPayCell(linked: boolean | null | undefined): Cell {
  if (linked == null) return ND("Link between executive remuneration and climate not confirmed in the source report.");
  if (!linked) return ND("Executive remuneration is not linked to climate metrics.");
  return ND(
    "Executive remuneration IS linked to climate/ESG metrics, but the report does not disclose the percentage of remuneration affected, which is what IFRS S2 ¶29(g) asks for.",
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TEMASEK — Company model. NOTE: stores ktCO₂e; converted to tCO₂e here.
   ═══════════════════════════════════════════════════════════════════ */

const KT_TO_T = 1000;

function companyCite(c: Company, metricId: string): SpineCitation {
  return {
    reportTitle: c.dataSource.reportTitle,
    url: c.dataSource.url,
    page: c.citationPages?.[metricId] ?? null,
    publishedDate: c.dataSource.publishedDate ?? null,
    extractedDate: c.dataSource.extractedDateISO,
  };
}

export function fromCompany(c: Company, categoryId: string): Entity {
  const env = ENVELOPES[c.id] ?? UNKNOWN_ENVELOPE;
  const period = c.reportingPeriod;
  const src = companyCite(c, "__source__"); // page-less document citation
  const kt = (v: number | null) => (v === null ? null : v * KT_TO_T);
  const naFor = (metricId: string): Cell | null => {
    const reason = c.naMetrics?.[metricId];
    return reason ? NA(reason) : null;
  };

  const e = c.environmental;
  const s = c.social;
  const g = c.governance;

  const metrics: Record<string, Cell> = {
    business_model: meta(c.sector, period, src),
    reporting_period: meta(c.dataSource.reportingPeriod, period, src),
    ...envelopeCells(env, period, src),

    scope1_abs: num(kt(e.scope1Emissions), "tCO₂e", period, companyCite(c, "scope1"), {
      series: histSeries(c, "scope1", kt(e.scope1Emissions)),
    }),
    scope2_abs: num(kt(e.scope2Emissions), "tCO₂e", period, companyCite(c, "scope2"), {
      note: `Reporting basis: ${e.scope2Basis}.`,
      series: histSeries(c, "scope2", kt(e.scope2Emissions)),
    }),
    // Dual reporting: the value is placed under the basis the report actually
    // states, and the other side is N/D — never duplicated across both.
    scope2_location:
      env.scope2Method === "location_based"
        ? num(kt(e.scope2Emissions), "tCO₂e", period, companyCite(c, "scope2"))
        : ND(`Location-based Scope 2 not disclosed. ${e.scope2Basis}.`),
    scope2_market:
      env.scope2Method === "market_based"
        ? num(kt(e.scope2Emissions), "tCO₂e", period, companyCite(c, "scope2"))
        : ND(`Market-based Scope 2 not disclosed. ${e.scope2Basis}.`),
    scope1and2_abs: ND("Scope 1 and Scope 2 are reported separately; no combined total is published."),
    scope3_abs: num(kt(e.scope3Emissions), "tCO₂e", period, companyCite(c, "scope3"), {
      series: histSeries(c, "scope3", kt(e.scope3Emissions)),
    }),
    scope3_cat15: num(kt(e.scope3Cat15Emissions), "tCO₂e", period, companyCite(c, "scope3Cat15"), {
      note: "Subset of Scope 3; disclosed only where the report breaks it out.",
    }),

    ...s2GapCells(c.id, src),
    exec_remuneration_climate_pct: execPayCellFor(c.id, g.esgLinkedExecutiveComp, src),

    net_zero_year: num(e.netZeroTargetYear, "year", period, companyCite(c, "netZeroTarget"), {
      display: e.netZeroTargetYear ? String(e.netZeroTargetYear) : undefined,
    }),
    interim_target: txt(
      e.scope1and2ReductionPct !== null
        ? `${e.scope1and2ReductionPct.toFixed(1)}% Scope 1+2 reduction vs ${c.baselineYear}`
        : null,
      period,
      companyCite(c, "s1s2Reduction"),
      env.baseYearNote ?? undefined,
    ),
    target_validated: txt(
      c.id === "singtel" ? "Yes — SBTi-validated targets" : null,
      period,
      src,
      c.id === "singtel" ? undefined : "No third-party target validation stated in the source report.",
    ),

    intensity_reported: num(e.ghgIntensityValue, e.ghgIntensityUnit, period, companyCite(c, "ghgIntensity"), {
      display: e.ghgIntensityValue !== null ? `${e.ghgIntensityValue} ${e.ghgIntensityUnit}` : undefined,
      note: "Each entity's own denominator — not cross-comparable.",
    }),
    renewable_share_pct: num(e.renewableEnergyPct, "%", period, companyCite(c, "renewableEnergyPct"), {
      display: e.renewableEnergyPct !== null ? `${e.renewableEnergyPct}%` : undefined,
    }),
    renewable_capacity_gw:
      naFor("renewableCapacity") ??
      num(e.renewableCapacityGW, "GW", period, companyCite(c, "renewableCapacity"), {
        display: e.renewableCapacityGW !== null ? `${e.renewableCapacityGW} GW` : undefined,
      }),
    water_m3: num(e.waterConsumptionM3, "m³", period, companyCite(c, "waterConsumption"), {
      display:
        e.waterConsumptionM3 !== null
          ? e.waterConsumptionM3 >= 1_000_000
            ? `${(e.waterConsumptionM3 / 1_000_000).toFixed(2)}M m³`
            : `${e.waterConsumptionM3.toLocaleString()} m³`
          : undefined,
    }),

    headcount: num(s.totalHeadcount, "employees", period, companyCite(c, "headcount"), {
      display: s.totalHeadcount !== null ? s.totalHeadcount.toLocaleString() : undefined,
    }),
    female_board_pct: num(s.femaleBoardPct, "%", period, companyCite(c, "femaleBoard"), {
      display: s.femaleBoardPct !== null ? `${s.femaleBoardPct}%` : undefined,
    }),
    female_leadership_pct: num(s.femaleLeadershipPct, "%", period, companyCite(c, "femaleLeadership"), {
      display: s.femaleLeadershipPct !== null ? `${s.femaleLeadershipPct}%` : undefined,
      note: "“Senior management” definitions vary by entity.",
    }),
    female_workforce_pct: ND("Female workforce share not disclosed in the extracted data."),
    training_hours_per_employee: num(s.trainingHoursPerEmployee, "hrs", period, companyCite(c, "trainingHours"), {
      display: s.trainingHoursPerEmployee !== null ? `${s.trainingHoursPerEmployee} hrs` : undefined,
    }),
    turnover_pct: ND("Employee turnover not disclosed in the extracted data."),
    engagement_pct: num(s.employeeEngagementScore, "%", period, null, {
      display: s.employeeEngagementScore !== null ? `${s.employeeEngagementScore}%` : undefined,
    }),
    safety_rate: num(s.lostTimeInjuryRate, "per million hrs", period, companyCite(c, "injuryRate"), {
      display: s.lostTimeInjuryRate !== null ? `${s.lostTimeInjuryRate.toFixed(2)} /M hrs` : undefined,
      note: s.lostTimeInjuryRateNote || undefined,
    }),
    fatalities: ND("Workplace fatalities not separately extracted."),
    community_investment: num(s.communityInvestmentSGDm, "SGD m", period, companyCite(c, "communityInvestment"), {
      display: s.communityInvestmentSGDm !== null ? `S$${s.communityInvestmentSGDm.toFixed(1)}M` : undefined,
      note: "Annual total, as reported.",
    }),

    independent_directors_pct: num(g.independentDirectorsPct, "%", period, companyCite(c, "independentDirectors"), {
      display: g.independentDirectorsPct !== null ? `${g.independentDirectorsPct.toFixed(0)}%` : undefined,
      note: "The basis of “independent” varies by jurisdiction.",
    }),
    anti_corruption_training_pct: num(g.antiCorruptionTrainingPct, "%", period, companyCite(c, "antiCorruptionTraining"), {
      display: g.antiCorruptionTrainingPct !== null ? `${g.antiCorruptionTrainingPct}%` : undefined,
    }),
    corruption_risk_assessed_pct: ND("Percentage of operations assessed for corruption risk (GRI 205-1) not disclosed."),
    external_assurance: g.externalAssurance
      ? meta(g.externalAssuranceProvider?.split("(")[0].trim() || "Yes", period, src, g.externalAssuranceProvider ?? undefined)
      : ND(g.externalAssuranceProvider ?? "No external assurance obtained."),
    frameworks: meta(g.reportingFrameworks.join(" · "), period, src),
  };

  return {
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    logoInitials: c.logoInitials,
    accentColor: c.accentColor,
    categoryId,
    listing: null,
    countries: ["SG"],
    businessModel: c.sector,
    sectorLabel: c.sector,
    reportingPeriod: period,
    fiscalYearEnd: FISCAL_YEAR_END[c.id] ?? null,
    reportLagNote: null,
    boundaryNote: null,
    status: "populated",
    rationaleCode: null,
    envelope: env,
    source: {
      reportTitle: c.dataSource.reportTitle,
      reportingPeriod: c.dataSource.reportingPeriod,
      url: c.dataSource.url,
      accessDate: c.dataSource.accessDate,
    },
    metrics,
    targets: companyTargets(c, env.baseYearNote),
    frameworks: c.governance.reportingFrameworks,
    dataNotes: c.dataNotes,
    caveatNotes: caveatsFrom(c.dataNotes),
  };
}

/**
 * ktCO₂e history → tCO₂e comparatives, oldest first.
 *
 * The historical table ROUNDS (Singtel FY2025 Scope 1 appears there as 13.2 kt)
 * while the headline field carries the precise figure (13.228 kt). Where the
 * final history row is the current reporting period, the precise headline value
 * is used for it, so the series tail and the displayed figure cannot disagree.
 * Prior years stay exactly as the report presents them.
 */
function histSeries(
  c: Company,
  scope: "scope1" | "scope2" | "scope3",
  currentTonnes: number | null,
): SeriesPoint[] {
  const points: SeriesPoint[] = c.historicalEmissions.map((h) => ({
    year: h.year,
    value: h[scope] === null || h[scope] === undefined ? null : (h[scope] as number) * KT_TO_T,
  }));
  const last = points[points.length - 1];
  if (last && currentTonnes !== null && last.year === c.reportingPeriod) {
    last.value = currentTonnes;
  }
  return points;
}

function companyTargets(c: Company, baseNote: string | null): Target[] {
  const out: Target[] = [];
  if (c.environmental.netZeroTargetYear !== null) {
    out.push({
      objective: "Net zero",
      verbatim: c.strategy,
      scopeCovered: "Scope 1+2",
      basePeriod: c.baselineYear || null,
      targetPeriod: String(c.environmental.netZeroTargetYear),
      value: null,
      unit: null,
      thirdPartyValidated: c.id === "singtel" ? true : null,
      grossOrNet: null,
      usesCarbonCredits: null,
    });
  }
  if (c.environmental.scope1and2ReductionPct !== null) {
    out.push({
      objective: "Scope 1+2 reduction achieved to date",
      verbatim: baseNote ?? c.strategy,
      scopeCovered: "Scope 1+2",
      basePeriod: c.baselineYear || null,
      targetPeriod: null,
      value: c.environmental.scope1and2ReductionPct,
      unit: "%",
      thirdPartyValidated: c.id === "singtel" ? true : null,
      grossOrNet: null,
      usesCarbonCredits: null,
    });
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════
   UTILITIES + BANKS — PeerCompany model. Already tCO₂e.
   ═══════════════════════════════════════════════════════════════════ */

function peerCite(c: PeerCompany): SpineCitation {
  return {
    reportTitle: c.dataSource.reportTitle,
    url: c.dataSource.url,
    page: null, // peer datasets record no page-level citations
    publishedDate: null,
    extractedDate: c.dataSource.accessDate,
  };
}

export function fromPeer(c: PeerCompany, categoryId: string): Entity {
  const env = ENVELOPES[c.id] ?? UNKNOWN_ENVELOPE;
  const period = c.reportingPeriod;
  const cite = peerCite(c);
  const isBank = c.businessModel.startsWith("Universal bank");
  // Not yet read for THIS period → pending, never N/D. See PeerCompany.notExtracted.
  const pend = new Set(c.notExtracted ?? []);
  const naIf = (key: string, cell: Cell): Cell =>
    c.naMetrics.includes(key) ? NA(`Does not apply to this business model (${c.businessModel}).`) : cell;

  const metrics: Record<string, Cell> = {
    business_model: meta(c.businessModel, period, cite),
    reporting_period: meta(c.dataSource.reportingPeriod, period, cite),
    ...envelopeCells(env, period, cite),

    scope1_abs: num(c.scope1, "tCO₂e", period, cite),
    scope2_abs: num(c.scope2, "tCO₂e", period, cite, { note: c.scope2Basis }),
    scope2_location: num(parseAltScope2(c, "location"), "tCO₂e", period, cite, {
      note: env.scope2Method === "dual_reported" ? "Dual-reported alongside the market-based figure." : undefined,
    }),
    scope2_market: num(parseAltScope2(c, "market"), "tCO₂e", period, cite, {
      note: env.scope2Method === "dual_reported" ? "Dual-reported alongside the location-based figure." : undefined,
    }),
    scope1and2_abs: ND("Scope 1 and Scope 2 are reported separately; no combined total is published."),
    scope3_abs: num(c.scope3, "tCO₂e", period, cite, {
      note: isBank ? "OPERATIONAL Scope 3 only — financed emissions are not aggregated into this figure." : undefined,
    }),
    scope3_cat15: isBank
      ? ND("Financed emissions (Cat 15) are tracked by sector but not aggregated into a single figure — see the financed-emissions row.")
      : ND("Category 15 not separately broken out."),

    ...s2GapCells(c.id, cite),
    climate_opportunity: c.sustainableFinanceNative
      ? txt(c.sustainableFinanceNative, period, cite, "Sustainable-finance portfolio — an IFRS S2 ¶29(d) climate-opportunity metric.")
      : ND("Not disclosed in the source report. IFRS S2 ¶29(d) asks for this as a cross-industry metric."),
    exec_remuneration_climate_pct: execPayCellFor(c.id, c.esgLinkedExecComp, cite),

    net_zero_year: num(c.netZeroYear, "year", period, cite, {
      display: c.netZeroYear ? String(c.netZeroYear) : undefined,
    }),
    interim_target: txt(c.reductionTarget || null, period, cite, env.baseYearNote ?? undefined),
    target_validated: txt(
      /SBTi/i.test(c.reductionTarget) || c.frameworks.some((f) => /SBTi/i.test(f)) ? "Yes — SBTi referenced" : null,
      period,
      cite,
      "No third-party target validation stated in the source report.",
    ),

    intensity_reported: num(c.intensityValue, c.intensityUnit, period, cite, {
      display: c.intensityValue !== null ? `${c.intensityValue} ${c.intensityUnit}` : undefined,
      note: "Each entity's own denominator — not cross-comparable.",
    }),
    normalized_intensity_kwh: naIf(
      "normalizedIntensityKgPerKwh",
      num(c.normalizedIntensityKgPerKwh ?? null, "kg CO₂e/kWh", period, cite, {
        display: c.normalizedIntensityKgPerKwh != null ? `${c.normalizedIntensityKgPerKwh} kg CO₂e/kWh` : undefined,
        note: c.normalizedIntensityNote,
      }),
    ),
    sf6_tco2e: naIf("sf6tCO2e", num(c.sf6tCO2e, "tCO₂e", period, cite)),
    system_loss_pct: naIf(
      "systemLossPct",
      num(c.systemLossPct, "%", period, cite, { display: c.systemLossPct !== null ? `${c.systemLossPct}%` : undefined }),
    ),
    renewable_capacity_gw: ND(c.renewableNote),
    renewable_share_pct: ND(c.renewableNote),
    water_m3: ND("Water consumption not extracted for this set."),

    financed_emissions_abs: isBank
      ? ND(
          "No aggregate financed-emissions figure is disclosed. Financed emissions dominate a bank's footprint and IFRS S2's industry-based guidance for commercial banks expects them — this is a disclosure gap, not merely missing data.",
        )
      : NA("Financed emissions apply to financial institutions."),
    financed_emissions_progress: isBank
      ? txt(c.financedEmissionsStatus ?? null, period, cite)
      : NA("Financed emissions apply to financial institutions."),
    sustainable_finance: isBank
      ? txt(c.sustainableFinanceNative ?? null, period, cite)
      : NA("Sustainable-finance portfolio applies to financial institutions."),

    headcount: num(c.headcount, "employees", period, cite, {
      display: c.headcount !== null ? c.headcount.toLocaleString() : undefined,
    }),
    female_board_pct: num(c.femaleBoardPct, "%", period, cite, {
      display: c.femaleBoardPct !== null ? `${c.femaleBoardPct}%` : undefined,
    }),
    female_leadership_pct: num(c.femaleSeniorMgmtPct ?? null, "%", period, cite, {
      display: c.femaleSeniorMgmtPct != null ? `${c.femaleSeniorMgmtPct}%` : undefined,
      note: "“Senior management” definitions vary by entity.",
    }),
    female_workforce_pct: num(c.femaleWorkforcePct, "%", period, cite, {
      display: c.femaleWorkforcePct !== null ? `${c.femaleWorkforcePct}%` : undefined,
    }),
    training_hours_per_employee: num(c.trainingHoursPerEmployee, "hrs", period, cite, {
      display: c.trainingHoursPerEmployee !== null ? `${c.trainingHoursPerEmployee} hrs` : undefined,
    }),
    turnover_pct: num(c.employeeTurnoverPct ?? null, "%", period, cite, {
      display: c.employeeTurnoverPct != null ? `${c.employeeTurnoverPct}%` : undefined,
    }),
    engagement_pct: num(c.employeeEngagementScore ?? null, "%", period, cite, {
      display: c.employeeEngagementScore != null ? `${c.employeeEngagementScore}%` : undefined,
    }),
    safety_rate: naIf(
      "injuryMetricValue",
      num(c.injuryMetricValue, c.injuryMetricUnit, period, cite, {
        display: c.injuryMetricValue !== null ? `${c.injuryMetricValue}` : undefined,
        note: c.injuryMetricUnit,
      }),
    ),
    fatalities: ND("Workplace fatalities not separately extracted for this set."),
    community_investment: txt(
      c.communityInvestmentBasis === "not_disclosed" ? null : c.communityInvestmentNative,
      period,
      cite,
      `${COMMUNITY_BASIS_LABEL[c.communityInvestmentBasis]}. ${c.communityInvestmentNote}`,
    ),

    independent_directors_pct: num(c.independentDirectorsPct, "%", period, cite, {
      display: c.independentDirectorsPct !== null ? `${c.independentDirectorsPct}%` : undefined,
      note: "The basis of “independent” varies by jurisdiction.",
    }),
    anti_corruption_training_pct: num(c.antiCorruptionTrainingPct, "%", period, cite, {
      display: c.antiCorruptionTrainingPct !== null ? `${c.antiCorruptionTrainingPct}%` : undefined,
    }),
    corruption_risk_assessed_pct: ND("Percentage of operations assessed for corruption risk (GRI 205-1) not disclosed."),
    external_assurance:
      c.externalAssurance === null
        ? ND("Assurance status not stated.")
        : c.externalAssurance
          ? meta(c.externalAssuranceProvider?.split("(")[0].split("—")[0].trim() || "Yes", period, cite, c.externalAssuranceProvider ?? undefined)
          : ND(c.externalAssuranceProvider ?? "No external assurance obtained."),
    frameworks: meta(c.frameworks.join(" · "), period, cite),
  };

  pend.forEach((key) => {
    metrics[key] = PENDING;
  });

  return {
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    logoInitials: c.logoInitials,
    accentColor: c.accentColor,
    categoryId,
    listing: null,
    countries: [c.country],
    businessModel: c.businessModel,
    sectorLabel: c.country,
    reportingPeriod: period,
    fiscalYearEnd: FISCAL_YEAR_END[c.id] ?? null,
    reportLagNote: /PCAF lag/i.test(c.dataSource.reportingPeriod)
      ? "Financed-emissions data year lags operational data by one year (standard PCAF lag)."
      : null,
    boundaryNote: c.climateContext,
    status: pend.size > 0 ? "pending_extraction" : "populated",
    rationaleCode: null,
    envelope: env,
    source: {
      reportTitle: c.dataSource.reportTitle,
      reportingPeriod: c.dataSource.reportingPeriod,
      url: c.dataSource.url,
      accessDate: c.dataSource.accessDate,
    },
    metrics,
    targets: peerTargets(c, env.baseYear),
    frameworks: c.frameworks,
    dataNotes: c.dataNotes,
    caveatNotes: caveatsFrom(c.dataNotes),
  };
}

function peerTargets(c: PeerCompany, basePeriod: string | null): Target[] {
  const validated = /SBTi/i.test(c.reductionTarget) || c.frameworks.some((f) => /SBTi/i.test(f)) ? true : null;
  const out: Target[] = [];
  if (c.netZeroYear !== null) {
    out.push({
      objective: "Net zero",
      verbatim: c.reductionTarget,
      scopeCovered: null,
      basePeriod,
      targetPeriod: String(c.netZeroYear),
      value: null,
      unit: null,
      thirdPartyValidated: validated,
      grossOrNet: null,
      usesCarbonCredits: null,
    });
  }
  if (c.reductionTarget) {
    out.push({
      objective: "Interim reduction target",
      verbatim: c.reductionTarget,
      scopeCovered: null,
      basePeriod,
      targetPeriod: null,
      value: null,
      unit: null,
      thirdPartyValidated: validated,
      grossOrNet: null,
      usesCarbonCredits: null,
    });
  }
  return out;
}

/**
 * Pull the alternate-basis Scope 2 figure out of the `scope2Basis` string,
 * which is where the dual-reported number currently lives (e.g. "Market-based
 * (location-based 50,889 tCO₂e also reported)"). Returns null when the report
 * gives only one basis — never a derived or assumed value.
 */
function parseAltScope2(c: PeerCompany, want: "location" | "market"): number | null {
  const stated = c.scope2Basis.toLowerCase();
  const headlineIs = stated.startsWith("market") ? "market" : stated.startsWith("location") ? "location" : null;
  if (headlineIs === want) return c.scope2;
  const re = new RegExp(`${want}-based\\s+([\\d,]+)`, "i");
  const m = c.scope2Basis.match(re);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

/* ═══════════════════════════════════════════════════════════════════
   HEALTHCARE — HealthcareEntity model.
   ═══════════════════════════════════════════════════════════════════ */

function hcCell(mv: HcMetricValue | undefined, unitOverride?: string): Cell {
  if (!mv) return ND();
  const flag = effectiveFlag(mv);
  const hasValue = mv.value !== null || mv.display !== undefined;
  if (!hasValue || flag === "unverified") return ND(mv.note);
  const cite: SpineCitation | null = mv.citation
    ? {
        reportTitle: mv.citation.reportTitle,
        url: mv.citation.url,
        page: mv.citation.page,
        pageNote: mv.citation.pageNote,
        publishedDate: mv.citation.reportDateStamp,
        extractedDate: mv.citation.fy,
      }
    : null;
  const unit = unitOverride ?? mv.unit;
  const display =
    mv.display ?? (mv.value !== null ? `${mv.value.toLocaleString()}${unit ? ` ${unit}` : ""}` : "—");
  return {
    state: "disclosed",
    value: mv.value,
    display,
    unit,
    year: mv.year ?? "—",
    provenance: flag,
    citation: cite,
    note: mv.note,
  };
}

export function fromHealthcare(h: HealthcareEntity, categoryId: string): Entity {
  const env = ENVELOPES[h.id] ?? UNKNOWN_ENVELOPE;
  const period = h.primarySource?.reportingPeriod ?? "—";
  const cite: SpineCitation | null = h.primarySource
    ? {
        reportTitle: h.primarySource.reportTitle,
        url: h.primarySource.url,
        page: null,
        publishedDate: null,
        extractedDate: h.primarySource.accessDate,
      }
    : null;
  const pendingOr = (cell: Cell): Cell => (h.status === "pending_verification" ? PENDING : cell);

  const beds = ["beds_sg", "beds_my", "beds_vn"]
    .map((k) => ({ k, mv: h.metrics[k] }))
    .filter((x) => x.mv?.value != null);

  const metrics: Record<string, Cell> = {
    business_model: meta("Listed healthcare group", period, cite),
    reporting_period: meta(period, period, cite),
    ...envelopeCells(env, period, cite),

    scope1_abs: pendingOr(hcCell(h.metrics.scope1_abs, "tCO₂e")),
    scope2_abs: pendingOr(hcCell(h.metrics.scope2_abs, "tCO₂e")),
    scope2_location: ND("Location-based Scope 2 not separately disclosed."),
    scope2_market: ND("Market-based Scope 2 not separately disclosed."),
    scope1and2_abs: pendingOr(hcCell(h.metrics.scope1and2_abs, "tCO₂e")),
    scope3_abs: pendingOr(hcCell(h.metrics.scope3_abs, "tCO₂e")),
    scope3_cat15: ND("Category 15 not separately broken out."),

    ...s2GapCells(h.id, cite),
    exec_remuneration_climate_pct: execPayCellFor(h.id, null, cite),

    net_zero_year: ND("No dated net-zero year with a citable figure in the source report."),
    interim_target: pendingOr(hcCell(h.metrics.target_2030)),
    target_validated: ND("No third-party target validation stated in the source report."),

    intensity_bed_day: pendingOr(withSeries(hcCell(h.metrics.intensity_2025), hcIntensitySeries(h))),
    intensity_reported: pendingOr(withSeries(hcCell(h.metrics.intensity_2025), hcIntensitySeries(h))),
    renewable_share_pct: ND("Renewable electricity share not disclosed."),
    water_m3: ND("Water consumption not disclosed."),

    beds_licensed: beds.length
      ? txt(
          beds.map((b) => `${b.k.slice(-2).toUpperCase()} ${b.mv!.value!.toLocaleString()}`).join(" · "),
          period,
          cite,
          "Licensed beds by country of operation.",
        )
      : ND("Licensed-bed count not disclosed."),

    headcount: ND("Group headcount not disclosed in the extracted data."),
    female_board_pct: hcCell(h.metrics.women_board_pct, "%"),
    female_leadership_pct: hcCell(h.metrics.women_leadership_pct, "%"),
    female_workforce_pct: hcCell(h.metrics.women_workforce_pct, "%"),
    training_hours_per_employee: ND("Training hours per employee not disclosed."),
    turnover_pct: hcCell(h.metrics.turnover_pct, "%"),
    engagement_pct: ND("Employee engagement score not disclosed."),
    safety_rate: ND("Injury rate not disclosed on a comparable basis."),
    fatalities: hcCell(h.metrics.fatalities),
    community_investment: hcCell(h.metrics.community_donations),

    independent_directors_pct: ND("Independent-director percentage not disclosed in the extracted data."),
    anti_corruption_training_pct: ND(
      "Percentage of employees trained on anti-corruption (GRI 205-2) not disclosed. The entity reports GRI 205-1 (operations assessed) instead — a different disclosure, shown on its own row.",
    ),
    corruption_risk_assessed_pct: hcCell(h.metrics.corruption_ops_pct, "%"),
    external_assurance:
      env.assurance === "none" || env.assurance === "internal_only" || env.assurance === "unknown"
        ? ND(env.assuranceProvider ?? ASSURANCE_LEVEL_LABEL[env.assurance])
        : meta(ASSURANCE_LEVEL_LABEL[env.assurance], period, cite, env.assuranceProvider ?? undefined),
    frameworks: h.frameworks?.length ? meta(h.frameworks.join(" · "), period, cite) : ND("Frameworks not stated."),
  };

  return {
    id: h.id,
    name: h.name,
    shortName: h.shortName,
    logoInitials: h.logoInitials,
    accentColor: h.accentColor,
    categoryId,
    listing: h.listing,
    countries: h.countries,
    businessModel: "Listed healthcare group",
    sectorLabel: h.listing,
    reportingPeriod: period,
    fiscalYearEnd: FISCAL_YEAR_END[h.id] ?? null,
    reportLagNote: null,
    boundaryNote: h.boundaryNote,
    status: h.status,
    rationaleCode: h.rationaleCode,
    envelope: env,
    source: h.primarySource
      ? {
          reportTitle: h.primarySource.reportTitle,
          reportingPeriod: h.primarySource.reportingPeriod,
          url: h.primarySource.url,
          accessDate: h.primarySource.accessDate,
        }
      : null,
    metrics,
    targets: hcTargets(h),
    frameworks: h.frameworks ?? [],
    dataNotes: h.dataNotes,
    caveatNotes: caveatsFrom(h.dataNotes),
  };
}

/**
 * IHH publishes its bed-day intensity for 2022 and 2025 under two separate
 * metric keys — the "year in the key" smell from the review. They are folded
 * into one comparative series here, so adding a future year is data, not a new
 * key plus a component edit.
 */
function hcIntensitySeries(h: HealthcareEntity): SeriesPoint[] {
  return Object.entries(h.metrics)
    .filter(([k, mv]) => /^intensity_\d{4}$/.test(k) && mv.value !== null)
    .map(([k, mv]) => ({ year: k.slice(-4), value: mv.value }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

/** Attach comparatives to an already-built cell (≥2 points, else unchanged). */
function withSeries(cell: Cell, series: SeriesPoint[]): Cell {
  if (cell.state !== "disclosed") return cell;
  if (series.filter((p) => p.value !== null).length < 2) return cell;
  return { ...cell, series };
}

function hcTargets(h: HealthcareEntity): Target[] {
  const mv = h.metrics.target_2030;
  if (!mv || (mv.value === null && mv.display === undefined)) return [];
  return [
    {
      objective: "Interim reduction target",
      verbatim: mv.display ?? String(mv.value),
      scopeCovered: "Scope 1+2",
      basePeriod: ENVELOPES[h.id]?.baseYear ?? null,
      targetPeriod: mv.year,
      value: mv.value,
      unit: mv.unit || "%",
      thirdPartyValidated: null,
      grossOrNet: null,
      usesCarbonCredits: null,
    },
  ];
}
