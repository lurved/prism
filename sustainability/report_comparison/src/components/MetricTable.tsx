"use client";

import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, getBestValue } from "@/lib/utils";
import type { Company } from "@/data/types";

interface MetricTableProps {
  companies: Company[];
}

function fmtEmissions(ktCO2e: number | null): string {
  if (ktCO2e === null) return "N/D";
  if (ktCO2e >= 1_000) return `${(ktCO2e / 1_000).toFixed(1)}M tCO₂e`;
  if (ktCO2e >= 1) return `${ktCO2e.toFixed(1)}k tCO₂e`;
  return `${(ktCO2e * 1000).toFixed(0)} tCO₂e`;
}

type RowConfig = {
  label: string;
  sublabel?: string;
  category: string;
  getValue: (c: Company) => number | null;
  format: (v: number) => string;
  lowerIsBetter: boolean;
};

const rows: RowConfig[] = [
  // ── Environmental ──────────────────────────────────────────────
  {
    label: "Scope 1 Emissions",
    sublabel: "Direct GHG",
    category: "Environmental",
    getValue: (c) => c.environmental.scope1Emissions,
    format: fmtEmissions,
    lowerIsBetter: true,
  },
  {
    label: "Scope 2 Emissions",
    sublabel: "Market-based",
    category: "Environmental",
    getValue: (c) => c.environmental.scope2Emissions,
    format: fmtEmissions,
    lowerIsBetter: true,
  },
  {
    label: "Scope 3 Emissions",
    sublabel: "Indirect GHG",
    category: "Environmental",
    getValue: (c) => c.environmental.scope3Emissions,
    format: (v) => fmtEmissions(v),
    lowerIsBetter: true,
  },
  {
    label: "GHG Intensity",
    sublabel: "Per activity unit",
    category: "Environmental",
    getValue: (c) => c.environmental.ghgIntensityValue,
    format: (v) => `${v}`,
    lowerIsBetter: true,
  },
  {
    label: "Renewable Capacity",
    sublabel: "GW installed",
    category: "Environmental",
    getValue: (c) => c.environmental.renewableCapacityGW,
    format: (v) => `${v} GW`,
    lowerIsBetter: false,
  },
  {
    label: "Renewable Energy %",
    sublabel: "% of electricity",
    category: "Environmental",
    getValue: (c) => c.environmental.renewableEnergyPct,
    format: (v) => `${v}%`,
    lowerIsBetter: false,
  },
  {
    label: "Net-Zero Target",
    sublabel: "Year (Scope 1+2)",
    category: "Environmental",
    getValue: (c) => c.environmental.netZeroTargetYear,
    format: (v) => String(v),
    lowerIsBetter: true,
  },
  {
    label: "S1+S2 Reduction",
    sublabel: "vs. baseline year",
    category: "Environmental",
    getValue: (c) => c.environmental.scope1and2ReductionPct,
    format: (v) => `${v.toFixed(1)}%`,
    lowerIsBetter: false,
  },
  {
    label: "Water Consumption",
    sublabel: "Potable (m³)",
    category: "Environmental",
    getValue: (c) => c.environmental.waterConsumptionM3,
    format: (v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(2)}M m³` : `${formatNumber(v)} m³`,
    lowerIsBetter: true,
  },
  // ── Social ────────────────────────────────────────────────────
  {
    label: "Training Hrs/Employee",
    sublabel: "Per year",
    category: "Social",
    getValue: (c) => c.social.trainingHoursPerEmployee,
    format: (v) => `${v} hrs`,
    lowerIsBetter: false,
  },
  {
    label: "Female Board %",
    sublabel: "Board diversity",
    category: "Social",
    getValue: (c) => c.social.femaleBoardPct,
    format: (v) => `${v}%`,
    lowerIsBetter: false,
  },
  {
    label: "Female Leadership %",
    sublabel: "Senior mgmt",
    category: "Social",
    getValue: (c) => c.social.femaleLeadershipPct,
    format: (v) => `${v}%`,
    lowerIsBetter: false,
  },
  {
    label: "Total Headcount",
    sublabel: "Employees",
    category: "Social",
    getValue: (c) => c.social.totalHeadcount,
    format: (v) => formatNumber(v),
    lowerIsBetter: false,
  },
  {
    label: "Employee Engagement",
    sublabel: "Score / %",
    category: "Social",
    getValue: (c) => c.social.employeeEngagementScore,
    format: (v) => `${v}%`,
    lowerIsBetter: false,
  },
  {
    label: "Injury Rate (LTIR)",
    sublabel: "Per million hrs",
    category: "Social",
    getValue: (c) => c.social.lostTimeInjuryRate,
    format: (v) => v.toFixed(2),
    lowerIsBetter: true,
  },
  {
    label: "Community Investment",
    sublabel: "SGD millions",
    category: "Social",
    getValue: (c) => c.social.communityInvestmentSGDm,
    format: (v) => `S$${v.toFixed(1)}M`,
    lowerIsBetter: false,
  },
  // ── Governance ───────────────────────────────────────────────
  {
    label: "Independent Directors",
    sublabel: "% of board",
    category: "Governance",
    getValue: (c) => c.governance.independentDirectorsPct,
    format: (v) => `${v.toFixed(0)}%`,
    lowerIsBetter: false,
  },
  {
    label: "Anti-Corruption Training",
    sublabel: "% employees trained",
    category: "Governance",
    getValue: (c) => c.governance.antiCorruptionTrainingPct,
    format: (v) => `${v}%`,
    lowerIsBetter: false,
  },
];

export function MetricTable({ companies }: MetricTableProps) {
  const categories = ["Environmental", "Social", "Governance"];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-52">
              Metric
            </th>
            {companies.map((c) => (
              <th key={c.id} className="py-3 px-4 text-center min-w-[148px]">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: c.accentColor }}
                  >
                    {c.logoInitials}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{c.shortName}</span>
                  <span className="text-[10px] text-slate-400">{c.reportingPeriod}</span>
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
                    <td className="py-2.5 px-4">
                      <p className="text-slate-700 font-medium text-xs">{row.label}</p>
                      {row.sublabel && <p className="text-slate-400 text-[10px]">{row.sublabel}</p>}
                    </td>
                    {companies.map((c, i) => {
                      const val = values[i];
                      const isBest = val !== null && val === best && values.filter(v => v === best).length < values.length;
                      return (
                        <td key={c.id} className="py-2.5 px-4 text-center">
                          {val === null ? (
                            <span className="inline-flex items-center gap-1 text-slate-300 text-xs">
                              <HelpCircle className="w-3 h-3" /> N/D
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 font-medium text-xs ${
                                isBest ? "text-emerald-700" : "text-slate-700"
                              }`}
                            >
                              {isBest && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
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

          {/* Boolean / qualitative rows */}
          <tr className="bg-slate-50/80 border-t border-slate-200">
            <td colSpan={companies.length + 1} className="py-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              Governance — Qualitative
            </td>
          </tr>

          {/* External assurance */}
          <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
            <td className="py-2.5 px-4">
              <p className="text-slate-700 font-medium text-xs">External Assurance</p>
              <p className="text-slate-400 text-[10px]">Third-party verified</p>
            </td>
            {companies.map((c) => (
              <td key={c.id} className="py-2.5 px-4 text-center">
                <div className="flex flex-col items-center gap-0.5">
                  {c.governance.externalAssurance
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  {c.governance.externalAssuranceProvider && (
                    <span className="text-[9px] text-slate-400 leading-tight text-center max-w-[100px]">
                      {c.governance.externalAssuranceProvider.split("(")[0].trim()}
                    </span>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* ESG-linked exec comp */}
          <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
            <td className="py-2.5 px-4">
              <p className="text-slate-700 font-medium text-xs">ESG-Linked Exec. Pay</p>
              <p className="text-slate-400 text-[10px]">Compensation tied to ESG</p>
            </td>
            {companies.map((c) => (
              <td key={c.id} className="py-2.5 px-4 text-center">
                {c.governance.esgLinkedExecutiveComp === null ? (
                  <span className="inline-flex items-center gap-1 text-slate-300 text-xs">
                    <HelpCircle className="w-3 h-3" /> N/D
                  </span>
                ) : c.governance.esgLinkedExecutiveComp ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                )}
              </td>
            ))}
          </tr>

          {/* Reporting frameworks */}
          <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
            <td className="py-2.5 px-4">
              <p className="text-slate-700 font-medium text-xs">Reporting Frameworks</p>
              <p className="text-slate-400 text-[10px]">Standards adopted</p>
            </td>
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

      {/* GHG intensity unit disclosure */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">GHG Intensity units differ by sector</p>
        <div className="flex flex-wrap gap-3">
          {companies.map((c) => (
            <span key={c.id} className="text-[10px] text-slate-500">
              <span className="font-medium">{c.shortName}:</span> {c.environmental.ghgIntensityValue} {c.environmental.ghgIntensityUnit}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Best performer for that metric
        </span>
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3 h-3" />
          N/D = not disclosed in published report
        </span>
        <span className="flex items-center gap-1.5">
          Emissions in thousands of tCO₂e (ktCO₂e)
        </span>
      </div>
    </div>
  );
}
