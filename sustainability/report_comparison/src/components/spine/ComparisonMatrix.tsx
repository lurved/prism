"use client";

/**
 * THE comparison matrix — one component, every category.
 *
 * Replaces three divergent tables (MetricTable, PeerComparison,
 * HealthcareComparison), each of which defined its own rows inline. Rows now
 * come from the spine; the only per-category input is which industry pack to
 * append and two caveat paragraphs.
 *
 * The two views are not cosmetic:
 *   As-reported  every figure as the entity published it
 *   Comparable   only figures whose GHG Protocol envelopes AGREE — and when a
 *                row is withheld, the reason is stated in framework terms
 *                rather than a hand-written caveat.
 */
import { useState } from "react";
import { Fragment } from "react";
import {
  assessComparability,
  bestPerformer,
  rowsForPack,
  vintageSpread,
  AUTHORITY_LABEL,
  type Entity,
  type PackId,
  type SpineRow,
  type View,
} from "@/data/spine";
import { SpineCell } from "./SpineCell";
import { resolveFrameworks } from "@/data/spine/frameworks";
import { assessUsability } from "@/data/spine/usability";

const AUTHORITY_TONE: Record<string, string> = {
  "IFRS S2": "text-good bg-[rgba(63,122,82,0.10)]",
  "IFRS S1": "text-good bg-[rgba(63,122,82,0.10)]",
  "GHG Protocol": "text-sc bg-[rgba(227,154,77,0.12)]",
  GRI: "text-muted bg-chip",
  house: "text-muted3 bg-chip",
};

function AuthorityChip({ row }: { row: SpineRow }) {
  return (
    <span
      className={`inline-block font-mono text-[9px] tracking-[0.03em] rounded-[4px] px-[5px] py-[1px] ${AUTHORITY_TONE[row.authority]}`}
      title={row.authorityRef ? `${AUTHORITY_LABEL[row.authority]} — ${row.authorityRef}` : AUTHORITY_LABEL[row.authority]}
    >
      {AUTHORITY_LABEL[row.authority]}
    </span>
  );
}

interface Props {
  entities: Entity[];
  pack: PackId;
  groupLabel: string;
  caveats: { asReported: React.ReactNode; comparable: React.ReactNode };
}

export function ComparisonMatrix({ entities, pack, groupLabel, caveats }: Props) {
  const [view, setView] = useState<View>("as_reported");
  const rows = rowsForPack(pack).filter((r) => r.views.includes(view));
  const vintage = vintageSpread(entities);

  // Rows the Comparable view withholds, with the framework reason why.
  const suppressed = rowsForPack(pack)
    .filter((r) => r.comparabilityKeys?.length)
    .map((r) => ({ row: r, verdict: assessComparability(r, entities) }))
    .filter((x) => x.verdict.blockedReason);

  let currentGroup: string | undefined;

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex border border-hairline rounded-full overflow-hidden">
          {(
            [
              ["as_reported", "As-Reported"],
              ["comparable", "Comparable"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`font-mono font-medium text-[11px] tracking-[0.06em] uppercase px-[14px] py-[7px] transition-colors ${
                view === v ? "bg-ink text-paper" : "text-muted hover:bg-chip"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted2">
          {entities.length} {groupLabel}
        </span>
      </div>

      {/* View-specific caveat */}
      <div className={`mb-4 border-l-2 ${view === "as_reported" ? "border-sm" : "border-sc"} pl-4 py-0.5`}>
        <p className="font-sans text-[12px] leading-[1.55] text-muted m-0 [text-wrap:pretty]">
          {view === "as_reported" ? caveats.asReported : caveats.comparable}
        </p>
      </div>

      {/* IFRS S1 comparability of periods — derived, not hand-written */}
      {vintage && (
        <div className="mb-4 border-l-2 border-hairline pl-4 py-0.5">
          <p className="font-sans text-[12px] leading-[1.55] text-muted2 m-0">
            <span className="font-semibold">Reporting periods differ.</span> {vintage}
          </p>
        </div>
      )}

      {/* What the Comparable view withholds, and why (framework terms) */}
      {view === "comparable" && suppressed.length > 0 && (
        <div className="mb-4 border border-hairline rounded-[12px] bg-card p-4">
          <div className="font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 mb-2">
            Comparability audit
          </div>
          <ul className="space-y-1.5">
            {suppressed.map(({ row, verdict }) => (
              <li key={row.key} className="font-sans text-[11px] leading-[1.5] text-muted">
                <span className="font-semibold text-ink2">{row.label}:</span> {verdict.blockedReason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto border border-hairline rounded-[14px] bg-card">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-card">
              <th className="text-left py-4 px-5 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 w-60">
                Metric
              </th>
              {entities.map((e) => (
                <th key={e.id} className="text-right py-[14px] px-4 min-w-[180px]">
                  <div className="font-sans font-semibold text-[14px] text-ink leading-[1.1]">{e.shortName}</div>
                  <div className="font-mono font-medium text-[10px] mt-1 tracking-[0.06em] uppercase" style={{ color: e.accentColor }}>
                    {e.sectorLabel} · {e.reportingPeriod}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const showGroup = row.group !== currentGroup;
              currentGroup = row.group;
              const { winnerId, reason } = bestPerformer(row, entities);
              return (
                <Fragment key={row.key}>
                  {showGroup && (
                    <tr>
                      <td
                        colSpan={entities.length + 1}
                        className="pt-5 pb-[7px] px-5 font-mono font-semibold text-[10px] tracking-[0.18em] uppercase text-sm"
                      >
                        {row.group}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-hairline2 hover:bg-card transition-colors">
                    <td className="py-[13px] px-5 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-medium text-[14px] text-ink leading-[1.25]">{row.label}</span>
                        <AuthorityChip row={row} />
                      </div>
                      {row.sublabel && <div className="font-sans text-[11px] text-muted3 mt-[3px]">{row.sublabel}</div>}
                      {row.rankable && reason && (
                        <div className="font-sans text-[10px] text-muted3 mt-[4px] [text-wrap:pretty]">{reason}</div>
                      )}
                    </td>
                    {entities.map((e) =>
                      row.key === "frameworks" ? (
                        // Rendered through the controlled vocabulary so "GRI 2021"
                        // and "GRI" are one chip, and a filter is possible.
                        <td key={e.id} className="py-[13px] px-4 text-right align-top">
                          <span className="inline-flex flex-wrap gap-[5px] justify-end">
                            {resolveFrameworks(e.frameworks).map((f) => (
                              <span
                                key={f.canonical}
                                title={f.qualifier ? `${f.raw} — ${f.qualifier}` : f.raw}
                                className="font-mono font-medium text-[10px] text-muted bg-chip rounded-[5px] px-2 py-[3px]"
                              >
                                {f.canonical}
                              </span>
                            ))}
                          </span>
                        </td>
                      ) : (
                        <td key={e.id} className="py-[13px] px-4 text-right align-top">
                          <SpineCell
                            cell={e.metrics[row.key]}
                            isWinner={winnerId === e.id}
                            usability={assessUsability(e.metrics[row.key], row, e)}
                          />
                        </td>
                      ),
                    )}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
