import { Fragment } from "react";
import {
  healthcareEntities,
  effectiveFlag,
  FLAG_META,
  ASSURANCE_LABEL,
  SCOPE2_LABEL,
  type HealthcareEntity,
  type MetricValue,
  type SourceFlag,
} from "@/data/healthcareData";

/* ── Source-flag pill ── */
function FlagBadge({ flag }: { flag: SourceFlag }) {
  const meta = FLAG_META[flag];
  const tone =
    flag === "confirmed" ? "text-good"
    : flag === "estimated" ? "text-sc"
    : "text-nd";
  return (
    <span className={`font-mono text-[11px] ${tone} align-middle`} title={meta.label} aria-label={meta.label}>
      {meta.icon}
    </span>
  );
}

/* ── Per-figure citation popover (pure CSS hover/focus; SSR-safe) ── */
function Citation({ mv }: { mv: MetricValue }) {
  const c = mv.citation;
  if (!c) {
    return (
      <span className="relative inline-block group align-middle">
        <button type="button" className="font-mono text-[10px] text-muted3 border-b border-dotted border-muted3 cursor-help focus:outline-none">
          no source
        </button>
        <span className="pointer-events-none invisible group-hover:visible group-focus-within:visible absolute z-40 right-0 top-full mt-1 w-64 rounded-[10px] border border-hairline bg-card p-3 text-left shadow-lg">
          <span className="block font-sans text-[11px] leading-[1.5] text-muted">
            {mv.note ?? "No page-level citation — renders unverified (❌) per no-interpolation rule."}
          </span>
        </span>
      </span>
    );
  }
  return (
    <span className="relative inline-block group align-middle">
      <button type="button" className="font-mono text-[10px] text-muted2 border-b border-dotted border-muted2 cursor-help focus:outline-none">
        cite
      </button>
      <span className="pointer-events-none invisible group-hover:visible group-focus-within:visible absolute z-40 right-0 top-full mt-1 w-72 rounded-[10px] border border-hairline bg-card p-3 text-left shadow-lg">
        <span className="block font-serif font-semibold text-[12px] text-ink leading-[1.2]">{c.reportTitle}</span>
        <span className="block font-mono text-[10px] text-muted2 mt-1">{c.fy}</span>
        <dl className="mt-2 space-y-[3px] font-sans text-[11px] text-muted">
          <div className="flex justify-between gap-3"><dt>Page</dt><dd className="text-ink2">{c.page ?? c.pageNote ?? "not specified"}</dd></div>
          <div className="flex justify-between gap-3"><dt>Assurance</dt><dd className="text-ink2">{ASSURANCE_LABEL[c.assuranceStatus]}</dd></div>
          <div className="flex justify-between gap-3"><dt>Scope 2 method</dt><dd className="text-ink2">{c.scope2Method ? SCOPE2_LABEL[c.scope2Method] : "—"}</dd></div>
          {c.reportDateStamp && <div className="flex justify-between gap-3"><dt>Filed</dt><dd className="text-ink2">{c.reportDateStamp}</dd></div>}
        </dl>
        {c.url && (
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="block mt-2 font-mono text-[10px] text-good">View source →</a>
        )}
      </span>
    </span>
  );
}

/* ── Comparison rows ── */
type Cell =
  | { kind: "metric"; mv: MetricValue | undefined }
  | { kind: "text"; text: string; muted?: boolean }
  | { kind: "pending" }; // entity hasn't been fetched — not a zero, not N/D

interface Row {
  key: string;
  label: string;
  sublabel?: string;
  group?: string;
  /** metric keys that participate in best-performer ranking */
  rankable?: boolean;
  render: (e: HealthcareEntity) => Cell;
}

function metricCell(key: string): (e: HealthcareEntity) => Cell {
  return (e) => {
    if (e.status === "pending_verification") return { kind: "pending" };
    return { kind: "metric", mv: e.metrics[key] };
  };
}

const ROWS: Row[] = [
  { key: "listing", label: "Listing", group: "Entity", render: (e) => ({ kind: "text", text: e.listing }) },
  { key: "countries", label: "Reporting countries", group: "Entity",
    render: (e) => ({ kind: "text", text: e.countries.join(" · ") }) },
  { key: "denominator", label: "Intensity denominator", group: "Entity",
    render: (e) => ({ kind: "text", text: e.intensityDenominator === "patient_bed_day" ? "patient-bed-day" : e.intensityDenominator ?? "—", muted: !e.intensityDenominator }) },
  { key: "frameworks", label: "Reporting frameworks", group: "Entity",
    render: (e) => ({ kind: "text", text: e.frameworks?.length ? e.frameworks.join(" · ") : "—", muted: !e.frameworks?.length }) },

  { key: "intensity_2022", label: "Scope 1+2 intensity", sublabel: "2022 · kg CO₂e/bed-day", group: "Carbon intensity (published)", render: metricCell("intensity_2022") },
  { key: "intensity_2025", label: "Scope 1+2 intensity", sublabel: "2025 · kg CO₂e/bed-day", group: "Carbon intensity (published)", rankable: true, render: metricCell("intensity_2025") },
  { key: "scope2_method", label: "Scope 2 method", group: "Carbon intensity (published)", render: metricCell("scope2_method") },

  { key: "scope1and2_abs", label: "Scope 1+2 absolute", sublabel: "tCO₂e · combined", group: "Absolute emissions", render: metricCell("scope1and2_abs") },
  { key: "scope1_abs", label: "Scope 1 absolute", sublabel: "tCO₂e", group: "Absolute emissions", render: metricCell("scope1_abs") },
  { key: "scope2_abs", label: "Scope 2 absolute", sublabel: "tCO₂e", group: "Absolute emissions", render: metricCell("scope2_abs") },
  { key: "scope3_abs", label: "Scope 3 absolute", sublabel: "tCO₂e", group: "Absolute emissions", render: metricCell("scope3_abs") },
  { key: "scope3_coverage", label: "Scope 3 coverage", group: "Absolute emissions", render: metricCell("scope3_coverage") },

  { key: "target_2030", label: "2030 target", group: "Targets & assurance", render: metricCell("target_2030") },
  { key: "assurance", label: "Assurance status", group: "Targets & assurance",
    render: (e) => ({ kind: "text", text: ASSURANCE_LABEL[e.assuranceStatus], muted: e.assuranceStatus === "unknown" || e.assuranceStatus === "none" }) },

  { key: "beds_sg", label: "Licensed beds — SG", group: "Capacity", render: metricCell("beds_sg") },
  { key: "beds_my", label: "Licensed beds — MY", group: "Capacity", render: metricCell("beds_my") },
  { key: "beds_vn", label: "Licensed beds — VN", group: "Capacity", render: metricCell("beds_vn") },
];

/**
 * Comparability audit for a rankable row. Returns the winning entity id, or a
 * suppression reason. A "best performer" requires ≥2 entities each publishing a
 * CONFIRMED value on the SAME intensity denominator and SAME Scope 2 method.
 * n<2 ⇒ no comparison ⇒ no badge (never rank a lone entity).
 */
function bestPerformer(row: Row, entities: HealthcareEntity[]): { winnerId: string | null; note: string | null } {
  if (!row.rankable) return { winnerId: null, note: null };
  const qualifying = entities.filter((e) => {
    const mv = e.metrics[row.key];
    return mv && mv.value !== null && effectiveFlag(mv) === "confirmed";
  });
  if (qualifying.length < 2) {
    return { winnerId: null, note: qualifying.length === 1 ? "n = 1 — not a comparison; no best-performer badge." : null };
  }
  const denomSet = new Set(qualifying.map((e) => e.intensityDenominator));
  const methodSet = new Set(qualifying.map((e) => e.scope2Method));
  if (denomSet.size > 1) return { winnerId: null, note: "Denominator mismatch — badge suppressed." };
  if (methodSet.size > 1) return { winnerId: null, note: "Scope 2 methodology mismatch — badge suppressed." };
  // Lower intensity is better.
  const winner = qualifying.reduce((a, b) => ((a.metrics[row.key]!.value! <= b.metrics[row.key]!.value!) ? a : b));
  const assuranceParity = new Set(qualifying.map((e) => e.assuranceStatus)).size === 1;
  return { winnerId: winner.id, note: assuranceParity ? null : "⚠️ assurance levels differ" };
}

const STATUS_PILL: Record<HealthcareEntity["status"], { label: string; cls: string }> = {
  populated: { label: "Populated", cls: "text-good bg-[rgba(63,122,82,0.10)]" },
  pending_extraction: { label: "Beds ✓ · emissions pending", cls: "text-sc bg-[rgba(180,114,46,0.10)]" },
  pending_verification: { label: "Pending verification", cls: "text-muted bg-chip" },
  excluded: { label: "Excluded", cls: "text-nd bg-chip" },
};

export function HealthcareComparison({ entities = healthcareEntities }: { entities?: HealthcareEntity[] }) {
  let currentGroup: string | undefined;
  const rankNotes = ROWS.map((r) => bestPerformer(r, entities)).filter((b) => b.note).map((b) => b.note!);

  return (
    <div>
      {/* Comparability audit banner */}
      <div className="mb-5 border-l-2 border-sc pl-4 py-0.5">
        <p className="font-sans text-[12px] leading-[1.55] text-muted m-0">
          <span className="font-semibold">Comparability audit.</span> A “best performer” badge requires ≥2 entities each
          publishing a <span className="font-semibold">confirmed</span> value on the <span className="font-semibold">same
          intensity denominator</span> (patient-bed-day) and <span className="font-semibold">same Scope 2 method</span>.
          IHH and RMG report confirmed absolute emissions, but only IHH publishes the patient-bed-day intensity used for
          ranking (RMG and TMG report on different denominators), so <span className="font-semibold">no best-performer badge
          renders</span> (n = 1 on the comparable denominator is not a comparison).
          {rankNotes.length > 0 && <span className="block mt-1 text-muted2">{rankNotes.join(" · ")}</span>}
        </p>
      </div>

      <div className="overflow-x-auto border border-hairline rounded-[14px] bg-card">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-ink">
              <th className="text-left py-4 px-5 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 w-56">Metric</th>
              {entities.map((e) => (
                <th key={e.id} className="text-right py-[14px] px-4 min-w-[180px]">
                  <div className="font-sans font-semibold text-[14px] text-paper leading-[1.1]">{e.shortName}</div>
                  <div className="font-mono font-medium text-[10px] text-muted2 mt-1 tracking-[0.06em] uppercase">{e.listing}</div>
                  <span className={`inline-block mt-[6px] font-mono text-[9px] tracking-[0.04em] rounded-full px-2 py-[2px] ${STATUS_PILL[e.status].cls}`}>{STATUS_PILL[e.status].label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const showGroup = row.group && row.group !== currentGroup;
              if (row.group) currentGroup = row.group;
              const { winnerId } = bestPerformer(row, entities);
              return (
                <Fragment key={row.key}>
                  {showGroup && (
                    <tr>
                      <td colSpan={entities.length + 1} className="pt-5 pb-[7px] px-5 font-mono font-semibold text-[10px] tracking-[0.18em] uppercase text-sm">{row.group}</td>
                    </tr>
                  )}
                  <tr className="border-t border-hairline2 hover:bg-[#F4F0E6] transition-colors">
                    <td className="py-[13px] px-5 align-top">
                      <div className="font-sans font-medium text-[14px] text-ink leading-[1.25]">{row.label}</div>
                      {row.sublabel && <div className="font-sans text-[11px] text-muted3 mt-[3px]">{row.sublabel}</div>}
                    </td>
                    {entities.map((e) => {
                      const cell = row.render(e);
                      return (
                        <td key={e.id} className="py-[13px] px-4 text-right align-top">
                          {renderCell(cell, winnerId === e.id)}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-hairline2 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] text-muted2">
          <span>✅ Confirmed</span>
          <span>⚠️ Estimated</span>
          <span>❌ Unverified / not yet extracted</span>
          <span>“pending” = report not yet fetched (not a zero)</span>
          <span className="inline-flex items-center gap-1"><span className="w-[7px] h-[7px] rounded-full bg-good" />best performer</span>
        </div>
      </div>
    </div>
  );
}

function renderCell(cell: Cell, isWinner: boolean) {
  if (cell.kind === "pending") {
    return <span className="font-mono text-[12px] text-muted3 italic">pending</span>;
  }
  if (cell.kind === "text") {
    return <span className={`font-mono text-[13px] ${cell.muted ? "text-nd" : "text-ink2"}`}>{cell.text}</span>;
  }
  const mv = cell.mv;
  if (!mv) return <span className="font-mono text-[13px] text-nd">—</span>;
  const flag = effectiveFlag(mv);
  const hasValue = mv.value !== null || mv.display !== undefined;
  const text = mv.display ?? (mv.value !== null ? `${mv.value.toLocaleString()}${mv.unit && !mv.unit.startsWith("%") ? " " + mv.unit : mv.unit}` : "—");
  return (
    <div className="flex items-start justify-end gap-2">
      <div className="text-right">
        <div className="flex items-center justify-end gap-[6px]">
          {isWinner && <span className="w-[7px] h-[7px] rounded-full bg-good" title="Best performer" />}
          <span className={`font-mono text-[13px] ${hasValue ? "text-ink2" : "text-nd"}`}>{hasValue ? text : "blank"}</span>
          <FlagBadge flag={flag} />
        </div>
        <div className="mt-[3px]"><Citation mv={mv} /></div>
      </div>
    </div>
  );
}
