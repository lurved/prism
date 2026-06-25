"use client";

import { useState } from "react";
import { peerCompanies, type PeerCompany } from "@/data/peerData";

type View = "absolute" | "normalized";

function fmtT(v: number | null): string {
  if (v === null) return "N/D";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M tCO₂e`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k tCO₂e`;
  return `${v.toLocaleString()} tCO₂e`;
}
function fmtNum(v: number | null, suffix = ""): string {
  if (v === null) return "N/D";
  return `${v.toLocaleString()}${suffix}`;
}

type Row = {
  key: string;
  label: string;
  sublabel?: string;
  view: View | "both";
  render: (c: PeerCompany) => { text: string; na?: boolean; nd?: boolean };
};

const rows: Row[] = [
  // ── Context (both views) ──
  {
    key: "businessModel", label: "Business model", view: "both",
    render: (c) => ({ text: c.businessModel }),
  },
  {
    key: "city", label: "City / climate", view: "both",
    render: (c) => ({ text: `${c.city} — ${c.climateContext}` }),
  },
  {
    key: "period", label: "Reporting period", view: "both",
    render: (c) => ({ text: c.reportingPeriod }),
  },

  // ── Absolute carbon ──
  { key: "s1", label: "Scope 1", sublabel: "Direct", view: "absolute",
    render: (c) => ({ text: fmtT(c.scope1), nd: c.scope1 === null }) },
  { key: "s2", label: "Scope 2", sublabel: "Energy indirect", view: "absolute",
    render: (c) => ({ text: fmtT(c.scope2), nd: c.scope2 === null }) },
  { key: "s2basis", label: "Scope 2 basis", view: "absolute",
    render: (c) => ({ text: c.scope2Basis, nd: c.scope2Basis === "N/D" }) },
  { key: "s3", label: "Scope 3", sublabel: "Value chain", view: "absolute",
    render: (c) => ({ text: fmtT(c.scope3), nd: c.scope3 === null }) },
  { key: "total", label: "Total GHG", view: "absolute",
    render: (c) => ({ text: fmtT(c.totalGHG), nd: c.totalGHG === null }) },
  { key: "sf6", label: "SF₆ emissions", sublabel: "Switchgear gas", view: "absolute",
    render: (c) => c.naMetrics.includes("sf6tCO2e")
      ? { text: "N/A", na: true }
      : { text: fmtT(c.sf6tCO2e), nd: c.sf6tCO2e === null } },

  // ── Normalized / comparable ──
  { key: "intensity", label: "Carbon intensity", sublabel: "as reported — own unit", view: "normalized",
    render: (c) => c.intensityValue === null
      ? { text: "N/D", nd: true }
      : { text: `${c.intensityValue} ${c.intensityUnit}` } },
  { key: "normIntensity", label: "Normalised intensity", sublabel: "kg CO₂e/kWh (S1+2) — comparable", view: "normalized",
    render: (c) => c.naMetrics.includes("normalizedIntensityKgPerKwh")
      ? { text: "N/A", na: true }
      : c.normalizedIntensityKgPerKwh == null
        ? { text: "N/D", nd: true }
        : { text: `${c.normalizedIntensityKgPerKwh} kg CO₂e/kWh` } },
  { key: "systemLoss", label: "System / T&D loss", view: "normalized",
    render: (c) => c.naMetrics.includes("systemLossPct")
      ? { text: "N/A", na: true }
      : { text: fmtNum(c.systemLossPct, "%"), nd: c.systemLossPct === null } },
  { key: "netzero", label: "Net-zero target", view: "normalized",
    render: (c) => ({ text: c.netZeroYear === null ? "N/D" : String(c.netZeroYear), nd: c.netZeroYear === null }) },
  { key: "headcount", label: "Headcount", view: "normalized",
    render: (c) => ({ text: fmtNum(c.headcount), nd: c.headcount === null }) },
  { key: "femaleBoard", label: "Female board %", view: "normalized",
    render: (c) => ({ text: fmtNum(c.femaleBoardPct, "%"), nd: c.femaleBoardPct === null }) },
  { key: "femaleWorkforce", label: "Female workforce %", view: "normalized",
    render: (c) => ({ text: fmtNum(c.femaleWorkforcePct, "%"), nd: c.femaleWorkforcePct === null }) },
  { key: "femaleSeniorMgmt", label: "Female senior mgmt %", sublabel: "definitions vary", view: "normalized",
    render: (c) => ({ text: fmtNum(c.femaleSeniorMgmtPct ?? null, "%"), nd: c.femaleSeniorMgmtPct == null }) },
  { key: "training", label: "Training hrs / employee", view: "normalized",
    render: (c) => ({ text: c.trainingHoursPerEmployee === null ? "N/D" : `${c.trainingHoursPerEmployee} hrs`, nd: c.trainingHoursPerEmployee === null }) },
  { key: "turnover", label: "Employee turnover %", view: "normalized",
    render: (c) => ({ text: fmtNum(c.employeeTurnoverPct ?? null, "%"), nd: c.employeeTurnoverPct == null }) },
  { key: "engagement", label: "Employee engagement", view: "normalized",
    render: (c) => ({ text: fmtNum(c.employeeEngagementScore ?? null, "%"), nd: c.employeeEngagementScore == null }) },
  { key: "injury", label: "Injury rate", sublabel: "basis differs", view: "normalized",
    render: (c) => c.naMetrics.includes("injuryMetricValue")
      ? { text: "N/A", na: true }
      : c.injuryMetricValue === null
        ? { text: "N/D", nd: true }
        : { text: `${c.injuryMetricValue} (${c.injuryMetricUnit})` } },
  { key: "community", label: "Community investment", view: "normalized",
    render: (c) => ({ text: c.communityInvestmentNative }) },
  { key: "indepDir", label: "Independent directors %", view: "normalized",
    render: (c) => ({ text: fmtNum(c.independentDirectorsPct, "%"), nd: c.independentDirectorsPct === null }) },
  { key: "esgPay", label: "ESG-linked exec pay", view: "normalized",
    render: (c) => c.esgLinkedExecComp == null
      ? { text: "N/D", nd: true }
      : { text: c.esgLinkedExecComp ? "Yes" : "No" } },
];

interface PeerComparisonProps {
  companies?: PeerCompany[];
  groupLabel?: string;       // e.g. "electricity utilities" / "banks"
  absoluteCaveat?: React.ReactNode;
  normalizedCaveat?: React.ReactNode;
}

const defaultAbsoluteCaveat = (
  <>
    <span className="font-semibold">Do not rank these absolute numbers against each other.</span> Meralco
    (Philippines distribution + MGen generation), CLP (Asia-centric vertically integrated group, equity basis)
    and National Grid (a much larger UK + US T&amp;D group) have very different reporting boundaries and scales —
    larger ≠ worse. Use these only to understand each company&apos;s own footprint.
  </>
);
const defaultNormalizedCaveat = (
  <>
    <span className="font-semibold">Reported carbon-intensity units differ</span> (tCO₂e/GWh, kg CO₂e/kWh, tCO₂e/£M revenue),
    so that row is <span className="font-semibold">not cross-comparable</span>. The <span className="font-semibold">Normalised
    intensity</span> row converts to <span className="font-semibold">kg CO₂e/kWh (Scope 1+2)</span> where it&apos;s directly
    disclosed or an exact conversion — comparable for Meralco (0.134) and CLP (0.58); National Grid is N/D (a T&amp;D operator
    that doesn&apos;t disclose total electricity throughput, so a per-kWh value can&apos;t be derived without inventing the
    denominator). Social &amp; governance metrics below <em>are</em> broadly comparable.
  </>
);

export function PeerComparison({
  companies = peerCompanies,
  groupLabel = "electricity utilities",
  absoluteCaveat = defaultAbsoluteCaveat,
  normalizedCaveat = defaultNormalizedCaveat,
}: PeerComparisonProps) {
  const [view, setView] = useState<View>("absolute");
  const visibleRows = rows.filter((r) => r.view === view || r.view === "both");

  const caveat = view === "absolute" ? absoluteCaveat : normalizedCaveat;
  const caveatBorder = view === "absolute" ? "border-sm" : "border-sc";

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex border border-hairline rounded-full overflow-hidden">
          {([["absolute", "As-Reported"], ["normalized", "Normalised"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`font-mono font-medium text-[11px] tracking-[0.06em] uppercase px-[14px] py-[7px] transition-colors ${
                view === v ? "bg-ink text-paper" : "text-muted hover:bg-chip"
              }`}>
              {label}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted2">{companies.length} {groupLabel}</span>
      </div>

      {/* View-specific caveat */}
      <div className={`mb-5 border-l-2 ${caveatBorder} pl-4 py-0.5`}>
        <p className="font-sans text-[12px] leading-[1.55] text-muted m-0">{caveat}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-hairline rounded-[14px] bg-card">
        <table className="w-full min-w-[740px] border-collapse">
          <thead>
            <tr className="bg-ink">
              <th className="text-left py-4 px-5 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 w-48">Metric</th>
              {companies.map((c) => (
                <th key={c.id} className="text-right py-[14px] px-4 min-w-[180px]">
                  <div className="font-sans font-semibold text-[14px] text-paper leading-[1.1]">{c.shortName}</div>
                  <div className="font-mono font-medium text-[10px] text-muted2 mt-1 tracking-[0.06em] uppercase">{c.country} · {c.reportingPeriod}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.key} className="border-t border-hairline2 hover:bg-[#F4F0E6] transition-colors">
                <td className="py-[13px] px-5 align-top">
                  <div className="font-sans font-medium text-[14px] text-ink leading-[1.25]">{row.label}</div>
                  {row.sublabel && <div className="font-sans text-[11px] text-muted3 mt-[3px]">{row.sublabel}</div>}
                </td>
                {companies.map((c) => {
                  const { text, na, nd } = row.render(c);
                  return (
                    <td key={c.id} className="py-[13px] px-4 text-right align-top">
                      <span className={`font-mono text-[13px] ${na || nd ? "text-nd" : "text-ink2"}`}>{na ? "N/A" : nd ? "N/D" : text}</span>
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr><td colSpan={companies.length + 1} className="pt-5 pb-[7px] px-5 font-mono font-semibold text-[10px] tracking-[0.18em] uppercase text-sm">Reporting &amp; Assurance</td></tr>

            <tr className="border-t border-hairline2">
              <td className="py-[13px] px-5 font-sans font-medium text-[14px] text-ink align-top">External assurance</td>
              {companies.map((c) => (
                <td key={c.id} className="py-[13px] px-4 text-right align-top">
                  {c.externalAssurance === null
                    ? <span className="font-mono text-[13px] text-nd">N/D</span>
                    : c.externalAssurance
                      ? <span className="font-mono text-[12px] text-ink2">{c.externalAssuranceProvider?.split("(")[0].split("—")[0].trim() || "Yes"}<span className="inline-block ml-[7px] w-[6px] h-[6px] rounded-full bg-good align-middle" /></span>
                      : <span className="font-mono text-[13px] text-nd">None</span>}
                </td>
              ))}
            </tr>

            <tr className="border-t border-hairline2">
              <td className="py-[13px] px-5 font-sans font-medium text-[14px] text-ink align-top">Reporting frameworks</td>
              {companies.map((c) => (
                <td key={c.id} className="py-[13px] px-4 text-right align-top">
                  <span className="inline-flex flex-wrap gap-[5px] justify-end">
                    {c.frameworks.map((f) => (
                      <span key={f} className="font-mono font-medium text-[10px] text-muted bg-chip rounded-[5px] px-2 py-[3px]">{f}</span>
                    ))}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-hairline2 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] text-muted2">
          <span>N/D = not disclosed</span>
          <span>N/A = not applicable to this business model</span>
          <span>Emissions in tCO₂e, as reported.</span>
        </div>
      </div>
    </div>
  );
}
