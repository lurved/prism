"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Company } from "@/data/types";

interface EsgChartProps {
  companies: Company[];
}

type ChartMode = "bar" | "radar" | "trend";

const COMPANY_COLORS = ["#1a7a4a", "#1e6fb5", "#e05a1e"];

function fmtKt(v: number): string {
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}M tCO₂e`;
  return `${v.toFixed(0)}k tCO₂e`;
}

export function EsgChart({ companies }: EsgChartProps) {
  const [mode, setMode] = useState<ChartMode>("bar");

  const barData = [
    {
      metric: "Scope 1",
      ...Object.fromEntries(companies.map((c) => [c.shortName, c.environmental.scope1Emissions])),
    },
    {
      metric: "Scope 2",
      ...Object.fromEntries(companies.map((c) => [c.shortName, c.environmental.scope2Emissions])),
    },
    {
      metric: "Scope 3",
      ...Object.fromEntries(
        companies.map((c) => [c.shortName, c.environmental.scope3Emissions ?? 0])
      ),
    },
  ];

  // Radar: normalise each metric 0–100 with best = 100
  const radarMetrics = [
    { label: "Female Board %",     key: "femaleBoardPct",      max: 50,  get: (c: Company) => c.social.femaleBoardPct },
    { label: "Training Hours",     key: "training",            max: 60,  get: (c: Company) => c.social.trainingHoursPerEmployee },
    { label: "S1+S2 Reduction %",  key: "reduction",           max: 50,  get: (c: Company) => c.environmental.scope1and2ReductionPct ?? 0 },
    { label: "Community Invest.",  key: "community",           max: 40,  get: (c: Company) => c.social.communityInvestmentSGDm },
    { label: "Indep. Directors %", key: "indepDir",            max: 100, get: (c: Company) => c.governance.independentDirectorsPct ?? 0 },
    { label: "Injury Rate (inv.)", key: "safetyInv",           max: 2,   get: (c: Company) => c.social.lostTimeInjuryRate === null ? 0 : Math.max(0, 2 - c.social.lostTimeInjuryRate) }, // inverted: lower = better; 0 if not comparable
  ];

  const radarData = radarMetrics.map((m) => ({
    subject: m.label,
    ...Object.fromEntries(
      companies.map((c) => [c.shortName, Math.min(100, (m.get(c) / m.max) * 100)])
    ),
    fullMark: 100,
  }));

  const maxHistLen = Math.max(...companies.map((c) => c.historicalEmissions.length));
  const trendData = Array.from({ length: maxHistLen }, (_, i) => {
    const entry: Record<string, string | number> = {};
    companies.forEach((c) => {
      const row = c.historicalEmissions[i];
      if (row) {
        if (!entry.year) entry.year = row.year.replace(/FY/, "");
        entry[`${c.shortName} S1`] = row.scope1;
        entry[`${c.shortName} S2`] = row.scope2;
      }
    });
    return entry;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Emissions &amp; ESG Visualisation</CardTitle>
            <p className="text-xs text-slate-400 mt-1">All emissions in ktCO₂e (thousands of tonnes CO₂e). Data from latest official sustainability reports.</p>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["bar", "radar", "trend"] as ChartMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                  mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "bar" ? "Emissions Bar" : m === "radar" ? "ESG Radar" : "Trend"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {mode === "bar" ? (
              <BarChart data={barData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="metric" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => fmtKt(v as number)} />
                <Tooltip
                  formatter={(value: number, name: string) => [fmtKt(value), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {companies.map((c, i) => (
                  <Bar key={c.id} dataKey={c.shortName} fill={COMPANY_COLORS[i]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            ) : mode === "radar" ? (
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#cbd5e1" }} />
                {companies.map((c, i) => (
                  <Radar
                    key={c.id}
                    name={c.shortName}
                    dataKey={c.shortName}
                    stroke={COMPANY_COLORS[i]}
                    fill={COMPANY_COLORS[i]}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(v: number) => [`${v.toFixed(0)} / 100`, ""]} />
              </RadarChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => fmtKt(v as number)} />
                <Tooltip
                  formatter={(value: number, name: string) => [fmtKt(value), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {companies.flatMap((c, i) => [
                  <Bar key={`${c.id}-s1`} dataKey={`${c.shortName} S1`} fill={COMPANY_COLORS[i]} fillOpacity={0.9} radius={[2,2,0,0]} stackId={c.shortName} />,
                  <Bar key={`${c.id}-s2`} dataKey={`${c.shortName} S2`} fill={COMPANY_COLORS[i]} fillOpacity={0.45} radius={[2,2,0,0]} stackId={c.shortName} />,
                ])}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="mt-3 space-y-1">
          {mode === "bar" && (
            <>
              <p className="text-xs text-slate-400 text-center">Scope 2 = market-based. Scope 3 = 0 where not disclosed. Note: Sembcorp operates at energy utility scale — its emissions are orders of magnitude larger than SMRT and Singtel.</p>
              <p className="text-xs text-amber-600 text-center font-medium">⚠ Sembcorp Scope 3 (15.3M tCO₂e) includes Category 15 Investments — a common energy company reporting convention that inflates Scope 3 vs telecom/grid peers.</p>
            </>
          )}
          {mode === "radar" && (
            <p className="text-xs text-slate-400 text-center">Normalised scores (0–100) across six ESG dimensions based on verified report data. Higher = better. Injury Rate is inverted (lower rate = higher score).</p>
          )}
          {mode === "trend" && (
            <p className="text-xs text-slate-400 text-center">Stacked Scope 1 (solid) + Scope 2 market-based (faded) by reporting year. Note: Singtel FY2025 Scope 1 spike reflects expanded reporting scope, not actual increase.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
