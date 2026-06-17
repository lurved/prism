"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { peerCompanies } from "@/data/peerData";

function fmtT(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M tCO₂e`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k tCO₂e`;
  return `${v.toLocaleString()} tCO₂e`;
}

export function PeerEmissionsChart() {
  const data = [
    { metric: "Scope 1", ...Object.fromEntries(peerCompanies.map((c) => [c.shortName, c.scope1 ?? 0])) },
    { metric: "Scope 2", ...Object.fromEntries(peerCompanies.map((c) => [c.shortName, c.scope2 ?? 0])) },
    { metric: "Scope 3", ...Object.fromEntries(peerCompanies.map((c) => [c.shortName, c.scope3 ?? 0])) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emissions &amp; ESG Visualisation</CardTitle>
        <p className="text-xs text-slate-400 mt-1">Absolute GHG emissions (tCO₂e) as reported in each utility&apos;s latest official report.</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="metric" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => fmtT(v as number)} />
              <Tooltip
                formatter={(value: number, name: string) => [fmtT(value), name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {peerCompanies.map((c) => (
                <Bar key={c.id} dataKey={c.shortName} fill={c.accentColor} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-800">
            <span className="font-semibold">Not a like-for-like comparison.</span> The three utilities differ in scope and
            scale — Meralco (Philippines, incl. MGen generation), CLP (Asia-equity group) and National Grid (a much larger
            UK + US T&amp;D group whose Scope 3 is ~53% sold gas). Different boundaries mean larger ≠ worse — use only to
            read each company&apos;s own footprint.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
