"use client";

import { useState } from "react";
import { getBestValue } from "@/lib/utils";
import { METRIC_DEFS, buildMetricValue, type MetricCategory } from "@/lib/metrics";
import { CitedValue } from "./CitedValue";
import { Sparkline } from "./Sparkline";
import { TrendChart } from "./TrendChart";
import type { Company } from "@/data/types";

interface MetricTableProps {
  companies: Company[];
}

const HEADER_TINT: Record<string, string> = { sembcorp: "#D69A60", smrt: "#D98276", singtel: "#6FAFC6" };

/** Emissions metrics that have a multi-year historical series → sparkline + expandable trend. */
const TREND_SCOPE: Record<string, "scope1" | "scope2" | "scope3"> = {
  scope1: "scope1",
  scope2: "scope2",
  scope3: "scope3",
};

function BadgeDot() {
  return <span className="inline-block ml-[7px] w-[6px] h-[6px] rounded-full bg-good align-middle" title="Best performer (comparable metric)" />;
}

/** Qualitative rows keep their own render but route badges through the same `comparable` gate. */
function QualRow({
  companies, label, sub, comparable, render,
}: {
  companies: Company[]; label: string; sub: string; comparable: boolean;
  render: (c: Company, comparable: boolean) => React.ReactNode;
}) {
  return (
    <tr className="border-t border-hairline2 hover:bg-[#F4F0E6] transition-colors">
      <td className="py-[13px] px-5 align-top">
        <div className="font-sans font-medium text-[14px] text-ink leading-[1.25]">{label}</div>
        <div className="font-sans text-[11px] text-muted3 mt-[3px]">{sub}</div>
      </td>
      {companies.map((c) => (
        <td key={c.id} className="py-[13px] px-4 text-right align-top font-mono text-[13px]">{render(c, comparable)}</td>
      ))}
    </tr>
  );
}

export function MetricTable({ companies }: MetricTableProps) {
  const categories: MetricCategory[] = ["Environmental", "Social", "Governance"];
  const [expanded, setExpanded] = useState<"scope1" | "scope2" | "scope3" | null>(null);

  return (
    <div className="overflow-x-auto border border-hairline rounded-[14px] bg-card">
      <table className="w-full min-w-[740px] border-collapse">
        <thead>
          <tr className="bg-ink">
            <th className="text-left py-4 px-5 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2">Metric</th>
            {companies.map((c) => (
              <th key={c.id} className="text-right py-[14px] px-4">
                <div className="font-sans font-semibold text-[14px] text-paper leading-[1.1]">{c.shortName}</div>
                <div className="font-mono font-medium text-[10px] mt-1 tracking-[0.06em] uppercase" style={{ color: HEADER_TINT[c.id] ?? c.accentColor }}>
                  {c.sector} · {c.reportingPeriod}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const catDefs = METRIC_DEFS.filter((d) => d.category === cat);
            return [
              <tr key={`cat-${cat}`}>
                <td colSpan={companies.length + 1} className="pt-5 pb-[7px] px-5 font-mono font-semibold text-[10px] tracking-[0.18em] uppercase text-sm">{cat}</td>
              </tr>,
              ...catDefs.flatMap((def) => {
                const mvs = companies.map((c) => buildMetricValue(c, def));
                const values = mvs.map((m) => m.value);
                // §4: badge only when the metric is comparable across sectors.
                const best = def.comparable ? getBestValue(values, def.lowerIsBetter) : null;
                const scope = TREND_SCOPE[def.metricId];
                const isExpanded = scope && expanded === scope;

                const mainRow = (
                  <tr key={def.metricId} className="border-t border-hairline2 hover:bg-[#F4F0E6] transition-colors">
                    <td className="py-[13px] px-5 align-top">
                      <div className="font-sans font-medium text-[14px] text-ink leading-[1.25]">{def.label}</div>
                      {def.sublabel && <div className="font-sans text-[11px] text-muted3 mt-[3px]">{def.sublabel}</div>}
                    </td>
                    {companies.map((c, i) => {
                      const mv = mvs[i];
                      const isBest =
                        def.comparable && mv.value !== null && mv.value === best &&
                        values.filter((v) => v === best).length < values.length;
                      const spark = scope
                        ? c.historicalEmissions.map((e) => e[scope] ?? null)
                        : null;
                      return (
                        <td key={c.id} className="py-[13px] px-4 text-right align-top">
                          <span className="inline-flex items-center gap-2 justify-end">
                            {spark && spark.filter((v) => v !== null).length >= 2 && (
                              <button
                                type="button"
                                onClick={() => setExpanded(isExpanded ? null : scope!)}
                                aria-label={`Show ${def.label} multi-year trend`}
                                aria-expanded={!!isExpanded}
                                className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Sparkline values={spark} color={c.accentColor} />
                              </button>
                            )}
                            <CitedValue mv={mv} display={mv.value !== null ? def.format(mv.value, c) : undefined} emphasis={isBest} />
                          </span>
                          {isBest && <BadgeDot />}
                        </td>
                      );
                    })}
                  </tr>
                );

                if (isExpanded) {
                  return [
                    mainRow,
                    <tr key={`${def.metricId}-trend`}>
                      <td colSpan={companies.length + 1} className="px-5 pb-4 bg-[#FBF8F1]">
                        <TrendChart companies={companies} scope={scope!} />
                      </td>
                    </tr>,
                  ];
                }
                return [mainRow];
              }),
            ];
          })}

          <tr><td colSpan={companies.length + 1} className="pt-5 pb-[7px] px-5 font-mono font-semibold text-[10px] tracking-[0.18em] uppercase text-sm">Governance — Qualitative</td></tr>

          {/* External assurance IS on the comparability allowlist (§4) → badge eligible. */}
          <QualRow companies={companies} label="External Assurance" sub="Third-party verified" comparable={true}
            render={(c, comparable) => c.governance.externalAssurance
              ? <span className="text-ink font-semibold">{c.governance.externalAssuranceProvider?.split("(")[0].trim().replace(/—.*/, "").trim() || "Yes"}{comparable && <BadgeDot />}</span>
              : <span className="text-nd">None</span>} />

          {/* Not comparable → no badge path at all. */}
          <QualRow companies={companies} label="ESG-Linked Exec. Pay" sub="Compensation tied to ESG" comparable={false}
            render={(c) => c.governance.esgLinkedExecutiveComp == null
              ? <span className="text-nd">N/D</span>
              : <span className="text-ink2">{c.governance.esgLinkedExecutiveComp ? "Yes" : "No"}</span>} />

          <QualRow companies={companies} label="Reporting Frameworks" sub="Standards adopted" comparable={false}
            render={(c) => (
              <span className="inline-flex flex-wrap gap-[5px] justify-end">
                {c.governance.reportingFrameworks.map((f) => (
                  <span key={f} className="font-mono font-medium text-[10px] text-muted bg-chip rounded-[5px] px-2 py-[3px]">{f}</span>
                ))}
              </span>
            )} />
        </tbody>
      </table>

      <div className="px-5 py-3 border-t border-hairline2">
        <p className="font-mono font-medium text-[10px] tracking-[0.08em] uppercase text-muted2 mb-1">GHG intensity units differ by sector — not comparable</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {companies.map((c) => (
            <span key={c.id} className="font-sans text-[11px] text-muted">
              <span className="font-semibold text-muted">{c.shortName}:</span> {c.environmental.ghgIntensityValue} {c.environmental.ghgIntensityUnit}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
