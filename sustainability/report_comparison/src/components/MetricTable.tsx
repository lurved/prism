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
  format: (v: number, c: Company) => string;
  lowerIsBetter: boolean;
  noBest?: boolean; // skip best-performer highlighting (e.g. when units differ across companies)
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
    sublabel: "different units — not comparable",
    category: "Environmental",
    getValue: (c) => c.environmental.ghgIntensityValue,
    format: (v, c) => `${v} ${c.environmental.ghgIntensityUnit}`,
    lowerIsBetter: true,
    noBest: true,
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

const HEADER_TINT: Record<string, string> = { sembcorp: "#D69A60", smrt: "#D98276", singtel: "#6FAFC6" };

function QualRow({ companies, label, sub, render }: {
  companies: Company[]; label: string; sub: string; render: (c: Company) => React.ReactNode;
}) {
  return (
    <tr className="border-t border-hairline2 hover:bg-[#F4F0E6] transition-colors">
      <td className="py-[13px] px-5 align-top">
        <div className="font-sans font-medium text-[14px] text-ink leading-[1.25]">{label}</div>
        <div className="font-sans text-[11px] text-muted3 mt-[3px]">{sub}</div>
      </td>
      {companies.map((c) => (
        <td key={c.id} className="py-[13px] px-4 text-right align-top font-mono text-[13px]">{render(c)}</td>
      ))}
    </tr>
  );
}

export function MetricTable({ companies }: MetricTableProps) {
  const categories = ["Environmental", "Social", "Governance"];

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
            const catRows = rows.filter((r) => r.category === cat);
            return [
              <tr key={`cat-${cat}`}>
                <td colSpan={companies.length + 1} className="pt-5 pb-[7px] px-5 font-mono font-semibold text-[10px] tracking-[0.18em] uppercase text-sm">{cat}</td>
              </tr>,
              ...catRows.map((row) => {
                const values = companies.map((c) => row.getValue(c));
                const best = getBestValue(values, row.lowerIsBetter);
                return (
                  <tr key={row.label} className="border-t border-hairline2 hover:bg-[#F4F0E6] transition-colors">
                    <td className="py-[13px] px-5 align-top">
                      <div className="font-sans font-medium text-[14px] text-ink leading-[1.25]">{row.label}</div>
                      {row.sublabel && <div className="font-sans text-[11px] text-muted3 mt-[3px]">{row.sublabel}</div>}
                    </td>
                    {companies.map((c, i) => {
                      const val = values[i];
                      const isBest = !row.noBest && val !== null && val === best && values.filter((v) => v === best).length < values.length;
                      return (
                        <td key={c.id} className="py-[13px] px-4 text-right align-top">
                          <span className={`font-mono text-[13px] tracking-[-0.01em] ${val === null ? "text-nd" : isBest ? "text-ink font-semibold" : "text-ink2"}`}>
                            {val === null ? "N/D" : row.format(val, c)}
                          </span>
                          {isBest && <span className="inline-block ml-[7px] w-[6px] h-[6px] rounded-full bg-good align-middle" />}
                        </td>
                      );
                    })}
                  </tr>
                );
              }),
            ];
          })}

          <tr><td colSpan={companies.length + 1} className="pt-5 pb-[7px] px-5 font-mono font-semibold text-[10px] tracking-[0.18em] uppercase text-sm">Governance — Qualitative</td></tr>

          <QualRow companies={companies} label="External Assurance" sub="Third-party verified"
            render={(c) => c.governance.externalAssurance
              ? <span className="text-ink font-semibold">{c.governance.externalAssuranceProvider?.split("(")[0].trim().replace(/—.*/, "").trim() || "Yes"}<span className="inline-block ml-[7px] w-[6px] h-[6px] rounded-full bg-good align-middle" /></span>
              : <span className="text-nd">None</span>} />

          <QualRow companies={companies} label="ESG-Linked Exec. Pay" sub="Compensation tied to ESG"
            render={(c) => c.governance.esgLinkedExecutiveComp == null
              ? <span className="text-nd">N/D</span>
              : <span className="text-ink2">{c.governance.esgLinkedExecutiveComp ? "Yes" : "No"}</span>} />

          <QualRow companies={companies} label="Reporting Frameworks" sub="Standards adopted"
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
