"use client";

/**
 * Expanded multi-year line chart for an emissions scope (§2).
 *
 * - `connectNulls={false}` — a missing year is a visible break, never a line
 *   drawn through an inferred point.
 * - Absolute emissions are NOT comparable across sectors (this page says so
 *   repeatedly), so each company keeps its own line and the exact figure +
 *   fiscal year is shown on hover. The shared x-axis is positional ("each
 *   company's own recent reporting years"), not a single calendar period.
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { Company } from "@/data/types";

type Scope = "scope1" | "scope2" | "scope3";

const SCOPE_LABEL: Record<Scope, string> = {
  scope1: "Scope 1",
  scope2: "Scope 2",
  scope3: "Scope 3",
};

function fmtK(v: number): string {
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}M`;
  if (v >= 1) return `${v.toFixed(1)}k`;
  return `${(v * 1000).toFixed(0)}`;
}

export function TrendChart({ companies, scope }: { companies: Company[]; scope: Scope }) {
  // Positional index over the 3 most recent reporting years each company has.
  const maxLen = Math.max(...companies.map((c) => c.historicalEmissions.length));
  const rows = Array.from({ length: maxLen }, (_, i) => {
    const row: Record<string, number | null | string> = { idx: i };
    companies.forEach((c) => {
      const from = c.historicalEmissions.length - maxLen;
      const entry = c.historicalEmissions[i + from];
      const v = entry ? entry[scope] : null;
      row[c.shortName] = v ?? null; // null → gap (connectNulls false)
      row[`${c.shortName}__fy`] = entry ? entry.year : "";
    });
    return row;
  });

  const tickLabels = ["3rd latest", "2nd latest", "Latest"].slice(-maxLen);

  return (
    <div className="bg-[#FBF8F1] border border-hairline2 rounded-[10px] p-4 mt-2">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="font-sans font-semibold text-[13px] text-ink">{SCOPE_LABEL[scope]} — multi-year trend</div>
        <div className="font-mono text-[10px] text-muted2">ktCO₂e · gaps = not disclosed</div>
      </div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 10, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="#E7E1D3" strokeDasharray="2 3" vertical={false} />
            <XAxis
              dataKey="idx"
              tickFormatter={(i: number) => tickLabels[i] ?? ""}
              tick={{ fontSize: 10, fill: "#9A9489", fontFamily: "IBM Plex Mono" }}
              axisLine={{ stroke: "#D8D0BF" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => fmtK(v)}
              tick={{ fontSize: 10, fill: "#A8A294", fontFamily: "IBM Plex Mono" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              contentStyle={{
                background: "#232019", border: "none", borderRadius: 8,
                fontFamily: "Archivo", fontSize: 12, color: "#F6F3EC",
              }}
              labelFormatter={(i) => tickLabels[i as number] ?? ""}
              formatter={(value, name) => [value === null ? "N/D" : `${fmtK(value as number)} tCO₂e`, name as string]}
            />
            <Legend wrapperStyle={{ fontFamily: "Archivo", fontSize: 12 }} />
            {companies.map((c) => (
              <Line
                key={c.id}
                type="linear"
                dataKey={c.shortName}
                stroke={c.accentColor}
                strokeWidth={2}
                dot={{ r: 3, fill: c.accentColor }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="font-sans text-[11px] leading-[1.5] text-muted2 mt-2 mb-0">
        Positional axis — each company&apos;s own three most recent reporting years (fiscal periods differ). Absolute
        emissions are not comparable across sectors; shape of each line reflects that company&apos;s own trajectory.
      </p>
    </div>
  );
}
