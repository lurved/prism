"use client";

import { CheckCircle2, XCircle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEmissions, formatNumber, getBestValue } from "@/lib/utils";
import type { Company } from "@/data/types";

interface MetricTableProps {
  companies: Company[];
}

type RowConfig = {
  label: string;
  category: string;
  getValue: (c: Company) => number | null;
  format: (v: number) => string;
  lowerIsBetter: boolean;
  unit?: string;
};

const rows: RowConfig[] = [
  // Environmental
  { label: "Scope 1 Emissions", category: "Environmental", getValue: (c) => c.environmental.scope1Emissions, format: formatEmissions, lowerIsBetter: true },
  { label: "Scope 2 Emissions", category: "Environmental", getValue: (c) => c.environmental.scope2Emissions, format: formatEmissions, lowerIsBetter: true },
  { label: "Scope 3 Emissions", category: "Environmental", getValue: (c) => c.environmental.scope3Emissions, format: formatEmissions, lowerIsBetter: true },
  { label: "Renewable Energy", category: "Environmental", getValue: (c) => c.environmental.renewableEnergyPct, format: (v) => `${v}%`, lowerIsBetter: false },
  { label: "Energy Intensity", category: "Environmental", getValue: (c) => c.environmental.energyIntensity, format: (v) => `${v} GJ/S$M`, lowerIsBetter: true },
  { label: "Carbon Reduction vs Baseline", category: "Environmental", getValue: (c) => c.environmental.carbonReductionVsBaseline, format: (v) => `${v}%`, lowerIsBetter: false },
  { label: "Net-Zero Target", category: "Environmental", getValue: (c) => c.environmental.netZeroTargetYear, format: (v) => String(v), lowerIsBetter: true },
  { label: "Water Consumption", category: "Environmental", getValue: (c) => c.environmental.waterConsumption, format: (v) => `${v}M m³`, lowerIsBetter: true },
  // Social
  { label: "Training Hrs / Employee", category: "Social", getValue: (c) => c.social.trainingHoursPerEmployee, format: (v) => `${v} hrs`, lowerIsBetter: false },
  { label: "Female Board %", category: "Social", getValue: (c) => c.social.femaleBoardPct, format: (v) => `${v}%`, lowerIsBetter: false },
  { label: "Female Leadership %", category: "Social", getValue: (c) => c.social.femaleLeadershipPct, format: (v) => `${v}%`, lowerIsBetter: false },
  { label: "Total Headcount", category: "Social", getValue: (c) => c.social.totalHeadcount, format: (v) => formatNumber(v), lowerIsBetter: false },
  { label: "Employee Engagement", category: "Social", getValue: (c) => c.social.employeeEngagementScore, format: (v) => `${v}%`, lowerIsBetter: false },
  { label: "Lost-Time Injury Rate", category: "Social", getValue: (c) => c.social.lostTimeInjuryRate, format: (v) => v.toFixed(2), lowerIsBetter: true },
  { label: "Community Investment", category: "Social", getValue: (c) => c.social.communityInvestmentSGDm, format: (v) => `S$${v}M`, lowerIsBetter: false },
  // Governance
  { label: "Independent Directors %", category: "Governance", getValue: (c) => c.governance.independentDirectorsPct, format: (v) => `${v}%`, lowerIsBetter: false },
  { label: "Anti-Corruption Training", category: "Governance", getValue: (c) => c.governance.antiCorruptionTrainingPct, format: (v) => `${v}%`, lowerIsBetter: false },
];

export function MetricTable({ companies }: MetricTableProps) {
  const categories = ["Environmental", "Social", "Governance"];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-56">
              Metric
            </th>
            {companies.map((c) => (
              <th key={c.id} className="py-3 px-4 text-center min-w-[140px]">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: c.accentColor }}
                  >
                    {c.logoInitials}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{c.shortName}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const catRows = rows.filter((r) => r.category === cat);
            return [
              <tr key={`cat-${cat}`} className="bg-slate-50/80 border-t border-slate-200">
                <td
                  colSpan={companies.length + 1}
                  className="py-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
                >
                  {cat}
                </td>
              </tr>,
              ...catRows.map((row) => {
                const values = companies.map((c) => row.getValue(c));
                const best = getBestValue(values, row.lowerIsBetter);

                return (
                  <tr key={row.label} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 text-slate-600 font-medium">{row.label}</td>
                    {companies.map((c, i) => {
                      const val = values[i];
                      const isBest = val !== null && val === best;
                      return (
                        <td key={c.id} className="py-2.5 px-4 text-center">
                          {val === null ? (
                            <span className="text-slate-300 text-xs">N/D</span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                isBest ? "text-brand-700" : "text-slate-700"
                              }`}
                            >
                              {isBest && (
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                              )}
                              {row.format(val)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              }),
            ];
          })}

          {/* Boolean rows */}
          <tr className="bg-slate-50/80 border-t border-slate-200">
            <td colSpan={companies.length + 1} className="py-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              Governance — Qualitative
            </td>
          </tr>
          <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
            <td className="py-2.5 px-4 text-slate-600 font-medium">External Assurance</td>
            {companies.map((c) => (
              <td key={c.id} className="py-2.5 px-4 text-center">
                {c.governance.externalAssurance
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                  : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
              </td>
            ))}
          </tr>
          <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
            <td className="py-2.5 px-4 text-slate-600 font-medium">ESG-Linked Exec. Comp.</td>
            {companies.map((c) => (
              <td key={c.id} className="py-2.5 px-4 text-center">
                {c.governance.esgLinkedExecutiveComp
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                  : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
              </td>
            ))}
          </tr>
          <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
            <td className="py-2.5 px-4 text-slate-600 font-medium">Reporting Frameworks</td>
            {companies.map((c) => (
              <td key={c.id} className="py-2.5 px-4">
                <div className="flex flex-wrap justify-center gap-1">
                  {c.governance.reportingFrameworks.map((f) => (
                    <Badge key={f} variant="outline">{f}</Badge>
                  ))}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
