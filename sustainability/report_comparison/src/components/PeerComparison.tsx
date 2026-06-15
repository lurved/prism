"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, AlertTriangle, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { peerCompanies, CLP_PENDING_NOTE, type PeerCompany } from "@/data/peerData";

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
  { key: "intensity", label: "Carbon intensity", sublabel: "own denominator", view: "normalized",
    render: (c) => c.intensityValue === null
      ? { text: "N/D", nd: true }
      : { text: `${c.intensityValue} ${c.intensityUnit}` } },
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
  { key: "training", label: "Training hrs / employee", view: "normalized",
    render: (c) => ({ text: c.trainingHoursPerEmployee === null ? "N/D" : `${c.trainingHoursPerEmployee} hrs`, nd: c.trainingHoursPerEmployee === null }) },
  { key: "injury", label: "Injury rate", sublabel: "basis differs", view: "normalized",
    render: (c) => c.injuryMetricValue === null
      ? { text: "N/D", nd: true }
      : { text: `${c.injuryMetricValue} (${c.injuryMetricUnit})` } },
  { key: "community", label: "Community investment", view: "normalized",
    render: (c) => ({ text: c.communityInvestmentNative }) },
  { key: "indepDir", label: "Independent directors %", view: "normalized",
    render: (c) => ({ text: fmtNum(c.independentDirectorsPct, "%"), nd: c.independentDirectorsPct === null }) },
];

export function PeerComparison() {
  const [view, setView] = useState<View>("absolute");
  const companies = peerCompanies;
  const visibleRows = rows.filter((r) => r.view === view || r.view === "both");

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView("absolute")}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "absolute" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            As-Reported (Absolute)
          </button>
          <button
            onClick={() => setView("normalized")}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "normalized" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Normalized &amp; Comparable
          </button>
        </div>
        <span className="text-[11px] text-slate-400">{companies.length} of 3 operators · CLP pending</span>
      </div>

      {/* View-specific caveat */}
      {view === "absolute" ? (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-800">
            <span className="font-semibold">Do not rank these absolute numbers against each other.</span> A mass-transit
            operator (SMRT) and an integrated electric utility (Meralco) have completely different emission boundaries —
            Meralco&apos;s Scope 1 is dominated by power <em>generation</em> it owns; SMRT has no generation. Larger
            ≠ worse. Use these only to understand each company&apos;s own footprint.
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-semibold">Carbon-intensity denominators differ by business model</span> (per-revenue
            for transit vs. per-GWh for a utility) and are <span className="font-semibold">not cross-comparable</span>.
            The social &amp; governance metrics below (headcount, board %, training, independent directors) <em>are</em>
            broadly comparable.
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">Metric</th>
              {companies.map((c) => (
                <th key={c.id} className="py-3 px-4 text-center min-w-[200px]">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: c.accentColor }}>{c.logoInitials}</div>
                    <span className="text-xs font-semibold text-slate-700">{c.shortName}</span>
                    <span className="text-[10px] text-slate-400">{c.country}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.key} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-4">
                  <p className="text-slate-700 font-medium text-xs">{row.label}</p>
                  {row.sublabel && <p className="text-slate-400 text-[10px]">{row.sublabel}</p>}
                </td>
                {companies.map((c) => {
                  const { text, na, nd } = row.render(c);
                  return (
                    <td key={c.id} className="py-2.5 px-4 text-center">
                      {na ? (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-xs" title="Not applicable to this business model">
                          <Ban className="w-3 h-3" /> N/A
                        </span>
                      ) : nd ? (
                        <span className="inline-flex items-center gap-1 text-slate-300 text-xs" title="Not disclosed in official report">
                          <HelpCircle className="w-3 h-3" /> N/D
                        </span>
                      ) : (
                        <span className="text-slate-700 text-xs font-medium">{text}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* External assurance + frameworks (always shown) */}
            <tr className="bg-slate-50/80 border-t border-slate-200">
              <td colSpan={companies.length + 1} className="py-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Reporting &amp; Assurance
              </td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="py-2.5 px-4 text-slate-700 font-medium text-xs">External assurance</td>
              {companies.map((c) => (
                <td key={c.id} className="py-2.5 px-4 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    {c.externalAssurance === null
                      ? <span className="text-slate-300 text-xs">N/D</span>
                      : c.externalAssurance
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <XCircle className="w-4 h-4 text-slate-300" />}
                    {c.externalAssuranceProvider && (
                      <span className="text-[9px] text-slate-400 leading-tight max-w-[170px]">{c.externalAssuranceProvider}</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>
            <tr className="border-t border-slate-100">
              <td className="py-2.5 px-4 text-slate-700 font-medium text-xs">Reporting frameworks</td>
              {companies.map((c) => (
                <td key={c.id} className="py-2.5 px-4">
                  <div className="flex flex-wrap justify-center gap-1">
                    {c.frameworks.map((f) => <Badge key={f} variant="outline">{f}</Badge>)}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5"><HelpCircle className="w-3 h-3" /> N/D = not disclosed in official report</span>
          <span className="flex items-center gap-1.5"><Ban className="w-3 h-3" /> N/A = not applicable to this business model</span>
          <span>Emissions in tCO₂e, as reported.</span>
        </div>
      </div>

      {/* CLP pending */}
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2.5">
        <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">{CLP_PENDING_NOTE}</p>
      </div>

      {/* Per-company data notes */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {companies.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-[10px]"
                  style={{ backgroundColor: c.accentColor }}>{c.logoInitials}</div>
                <span className="text-xs font-semibold text-slate-700">{c.name}</span>
              </div>
              <ul className="space-y-1.5">
                {c.dataNotes.map((n, i) => (
                  <li key={i} className="text-[11px] text-slate-500 pl-3 border-l-2 border-slate-200 leading-snug">{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
