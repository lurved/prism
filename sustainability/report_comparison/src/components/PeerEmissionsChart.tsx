"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { peerCompanies, type PeerCompany } from "@/data/peerData";

function fmtT(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M tCO₂e`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k tCO₂e`;
  return `${v.toLocaleString()} tCO₂e`;
}

interface PeerEmissionsChartProps {
  companies?: PeerCompany[];
  subtitle?: string;
  caveat?: React.ReactNode;
}

const defaultCaveat = (
  <>
    <span className="font-semibold">Not a like-for-like comparison.</span> The three utilities differ in scope and
    scale — Meralco (Philippines, incl. MGen generation), CLP (Asia-equity group) and National Grid (a much larger
    UK + US T&amp;D group whose Scope 3 is ~53% sold gas). Different boundaries mean larger ≠ worse — use only to
    read each company&apos;s own footprint.
  </>
);

export function PeerEmissionsChart({
  companies = peerCompanies,
  subtitle = "Absolute GHG emissions (tCO₂e) as reported in each utility's latest official report.",
  caveat = defaultCaveat,
}: PeerEmissionsChartProps) {
  const data = [
    { metric: "Scope 1", ...Object.fromEntries(companies.map((c) => [c.shortName, c.scope1 ?? 0])) },
    { metric: "Scope 2", ...Object.fromEntries(companies.map((c) => [c.shortName, c.scope2 ?? 0])) },
    { metric: "Scope 3", ...Object.fromEntries(companies.map((c) => [c.shortName, c.scope3 ?? 0])) },
  ];

  return (
    <div className="border border-hairline rounded-[14px] bg-card overflow-hidden">
      <div className="px-6 pt-5">
        <div className="font-mono font-semibold text-xs tracking-[0.1em] uppercase text-ink">Emissions Visualisation</div>
        <p className="font-sans text-xs text-muted2 mt-1">{subtitle}</p>
      </div>
      <div className="px-6 pt-4 pb-5">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D3" />
              <XAxis dataKey="metric" tick={{ fontSize: 12, fill: "#6B665C" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9A9489" }} tickFormatter={(v) => fmtT(v as number)} />
              <Tooltip
                formatter={(value: number, name: string) => [fmtT(value), name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4DECF", background: "#FCFAF5" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {companies.map((c) => (
                <Bar key={c.id} dataKey={c.shortName} fill={c.accentColor} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 border-l-2 border-sm pl-4 py-0.5">
          <p className="font-sans text-[11px] leading-[1.55] text-muted m-0">{caveat}</p>
        </div>
      </div>
    </div>
  );
}
