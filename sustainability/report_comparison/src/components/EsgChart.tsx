"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEmissions } from "@/lib/utils";
import type { Company } from "@/data/types";

interface EsgChartProps {
  companies: Company[];
}

type ChartMode = "bar" | "radar" | "trend";

const COMPANY_COLORS = ["#259466", "#1e6fb5", "#e05a1e"];

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

  const radarData = [
    {
      subject: "Renewable %",
      ...Object.fromEntries(companies.map((c) => [c.shortName, c.environmental.renewableEnergyPct])),
      fullMark: 100,
    },
    {
      subject: "Female Board %",
      ...Object.fromEntries(companies.map((c) => [c.shortName, c.social.femaleBoardPct])),
      fullMark: 100,
    },
    {
      subject: "Female Leadership",
      ...Object.fromEntries(companies.map((c) => [c.shortName, c.social.femaleLeadershipPct])),
      fullMark: 100,
    },
    {
      subject: "Indep. Directors",
      ...Object.fromEntries(companies.map((c) => [c.shortName, c.governance.independentDirectorsPct])),
      fullMark: 100,
    },
    {
      subject: "Training hrs (÷10)",
      ...Object.fromEntries(companies.map((c) => [c.shortName, c.social.trainingHoursPerEmployee * 10 / 100 * 100 / 10])),
      fullMark: 100,
    },
    {
      subject: "Carbon Reduction",
      ...Object.fromEntries(companies.map((c) => [c.shortName, c.environmental.carbonReductionVsBaseline])),
      fullMark: 100,
    },
  ];

  // Build trend data aligned by position
  const maxLen = Math.max(...companies.map((c) => c.historicalEmissions.length));
  const trendData = Array.from({ length: maxLen }, (_, i) => {
    const entry: Record<string, string | number> = {};
    companies.forEach((c) => {
      const row = c.historicalEmissions[i];
      if (row) {
        if (!entry.year) entry.year = row.year.replace("FY", "");
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
          <CardTitle>Emissions &amp; ESG Visualisation</CardTitle>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["bar", "radar", "trend"] as ChartMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                  mode === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
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
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => formatEmissions(v as number)}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [formatEmissions(value), name]}
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
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#cbd5e1" }} />
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
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              </RadarChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => formatEmissions(v as number)}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [formatEmissions(value), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {companies.flatMap((c, i) => [
                  <Bar key={`${c.id}-s1`} dataKey={`${c.shortName} S1`} fill={COMPANY_COLORS[i]} fillOpacity={0.9} radius={[2,2,0,0]} stackId={c.shortName} />,
                  <Bar key={`${c.id}-s2`} dataKey={`${c.shortName} S2`} fill={COMPANY_COLORS[i]} fillOpacity={0.5} radius={[2,2,0,0]} stackId={c.shortName} />,
                ])}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-400 mt-3 text-center">
          {mode === "bar" && "All emissions in thousands of tCO₂e. Scope 3 shown as 0 where not disclosed."}
          {mode === "radar" && "Normalised scores across six ESG dimensions (higher = better)."}
          {mode === "trend" && "Stacked S1 + S2 emissions by year. Lighter shade = Scope 2."}
        </p>
      </CardContent>
    </Card>
  );
}
