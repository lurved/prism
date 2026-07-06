"use client";

import { useEffect, useState } from "react";
import { companies } from "@/data/esgData";

/* Chart dataset derived directly from the verified esgData — no duplicated or
   rounded figures, so a chart can never drift from the matrix / export. */
const CHART = companies.map((c) => ({
  id: c.id,
  code: c.logoInitials,
  short: c.shortName,
  sector: c.sector,
  color: c.accentColor,
  scope1: c.environmental.scope1Emissions,          // ktCO₂e
  scope2: c.environmental.scope2Emissions,
  scope3: c.environmental.scope3Emissions,          // may be null
  scope3Cat15: c.environmental.scope3Cat15Emissions, // may be null (only where cited)
  reduction: c.environmental.scope1and2ReductionPct, // may be null
}));

type ChartCo = (typeof CHART)[number];

const SCOPE_OPACITY = [1, 0.6, 0.32];

function fmtVal(v: number): string {
  if (v >= 1000) return Math.round(v).toLocaleString();
  if (v >= 100) return String(Math.round(v));
  return v.toFixed(1);
}

type Tab = "bar" | "radar" | "trend";

export function EmissionsPanel() {
  const [tab, setTab] = useState<Tab>("bar");
  const [scale, setScale] = useState<"log" | "linear">("log");
  const [scopes, setScopes] = useState({ s1: true, s2: true, s3: true });
  // §3 Scope 3 view — persisted in the URL (?scope3=excl15) for shareability.
  const [exclCat15, setExclCat15] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("scope3");
    if (p === "excl15") setExclCat15(true);
  }, []);

  const setExcl = (next: boolean) => {
    setExclCat15(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("scope3", "excl15");
    else url.searchParams.delete("scope3");
    window.history.replaceState(null, "", url.toString());
  };

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`font-mono font-semibold text-xs tracking-[0.1em] uppercase px-[14px] py-3 border-b-2 transition-colors ${
        tab === t ? "text-ink border-ink" : "text-muted3 border-transparent hover:text-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="border border-hairline rounded-[14px] bg-card overflow-hidden">
        {/* Card header: tabs + legend */}
        <div className="flex items-center justify-between gap-4 flex-wrap px-6 pt-1.5 border-b border-hairline2">
          <div className="flex">
            {tabBtn("bar", "Emissions")}
            {tabBtn("radar", "ESG Radar")}
            {tabBtn("trend", "Decarbon. Path")}
          </div>
          <div className="flex items-center gap-[18px] pb-2">
            {CHART.map((c) => (
              <span key={c.code} className="inline-flex items-center gap-[7px] font-sans font-medium text-[11px] text-muted">
                <span className="w-[11px] h-[11px] rounded-[3px]" style={{ background: c.color }} />
                {c.short}
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 pt-[26px] pb-[22px]">
          {tab === "bar" && (
            <BarView
              scale={scale} setScale={setScale} scopes={scopes} setScopes={setScopes}
              exclCat15={exclCat15} setExclCat15={setExcl}
            />
          )}
          {tab === "radar" && <RadarView />}
          {tab === "trend" && <TrendView />}
        </div>
      </div>

      {/* Caveat */}
      <div className="flex gap-3 items-start mt-[18px] border-l-2 border-sc pl-4 py-0.5">
        <span className="font-sans font-semibold text-base leading-tight text-sc">⚠</span>
        <p className="font-sans text-[13px] leading-[1.55] text-muted m-0 max-w-[88ch]">
          Sembcorp Scope 3 (15.3M tCO₂e) includes Category 15 Investments — a common energy-company convention that
          inflates Scope 3 relative to telecom and grid peers. Use the <em>Excl. Category 15</em> toggle to remove it
          where a company discloses the breakdown. Scope 2 is market-based throughout.
        </p>
      </div>
    </div>
  );
}

/* ── View A: grouped bar chart ──────────────────────────────────── */
function BarView({
  scale, setScale, scopes, setScopes, exclCat15, setExclCat15,
}: {
  scale: "log" | "linear";
  setScale: (s: "log" | "linear") => void;
  scopes: { s1: boolean; s2: boolean; s3: boolean };
  setScopes: (s: { s1: boolean; s2: boolean; s3: boolean }) => void;
  exclCat15: boolean;
  setExclCat15: (b: boolean) => void;
}) {
  const BASE = 324, PLOT = 300, LEFT = 64, RIGHT = 796;
  const visible: number[] = [];
  if (scopes.s1) visible.push(0);
  if (scopes.s2) visible.push(1);
  if (scopes.s3) visible.push(2);

  const hOf = (v: number) => {
    if (scale === "log") {
      const t = (Math.log10(Math.max(v, 10)) - 1) / (Math.log10(20000) - 1);
      return Math.max(2, t * PLOT);
    }
    return Math.max(2, (v / 16000) * PLOT);
  };

  // Resolve the Scope 3 value for a company under the current view.
  // Excl. Cat 15 is ONLY computed when BOTH the total and Cat 15 are cited.
  const scope3Value = (c: ChartCo): number | null => {
    if (c.scope3 === null) return null;
    if (!exclCat15) return c.scope3;
    if (c.scope3Cat15 === null) return null; // no cited breakdown → drops out
    return c.scope3 - c.scope3Cat15;
  };
  const excludedFromView = exclCat15
    ? CHART.filter((c) => c.scope3 !== null && c.scope3Cat15 === null)
    : [];

  const gridVals = scale === "log" ? [10, 100, 1000, 10000] : [0, 4000, 8000, 12000, 16000];
  const gridLabel = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v));
  const grid = gridVals.map((v) => {
    const y = BASE - hOf(v);
    return { v, y, ty: y + 3, label: gridLabel(v) };
  });

  const groupW = (RIGHT - LEFT) / 3; // 244
  const bars: { x: number; y: number; w: number; h: number; fill: string; op: number; tx: number; vy: number; vlabel: string }[] = [];
  const axis: { x: number; label: string; color: string }[] = [];
  CHART.forEach((c, ci) => {
    const groupLeft = LEFT + ci * groupW;
    // Value per visible scope, dropping N/D scopes entirely (no zero bar).
    const scopeVals = visible.map((idx) => (idx === 2 ? scope3Value(c) : [c.scope1, c.scope2, c.scope3][idx]));
    const drawable = visible.map((idx, k) => ({ idx, v: scopeVals[k] })).filter((s) => s.v !== null) as { idx: number; v: number }[];
    const n = drawable.length;
    if (n > 0) {
      const barW = Math.min(48, (groupW * 0.72) / n - 10);
      const totalW = n * barW + (n - 1) * 14;
      const startX = groupLeft + (groupW - totalW) / 2;
      drawable.forEach((s, k) => {
        const h = hOf(s.v);
        const x = startX + k * (barW + 14);
        bars.push({
          x, y: BASE - h, w: barW, h, fill: c.color, op: SCOPE_OPACITY[s.idx],
          tx: x + barW / 2, vy: BASE - h - 6, vlabel: fmtVal(s.v),
        });
      });
    }
    axis.push({ x: groupLeft + groupW / 2, label: c.short, color: c.color });
  });

  const togglePill = (key: "s1" | "s2" | "s3", label: string, color: string) => {
    const on = scopes[key];
    return (
      <button
        onClick={() => setScopes({ ...scopes, [key]: !on })}
        className={`inline-flex items-center gap-2 font-mono font-medium text-[11px] tracking-[0.04em] px-[11px] py-[6px] rounded-full border transition-colors ${
          on ? "bg-ink text-paper border-ink" : "bg-transparent text-muted border-hairline"
        }`}
        style={on ? { color: "#F6F3EC" } : { color }}
      >
        <span className="w-[9px] h-[9px] rounded-[2px]" style={{ background: "currentColor", opacity: 0.85 }} />
        {label}
      </button>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-[14px]">
        <div className="flex gap-2 flex-wrap">
          {togglePill("s1", "Scope 1", "#5A554B")}
          {togglePill("s2", "Scope 2", "#5A554B")}
          {togglePill("s3", "Scope 3", "#5A554B")}
        </div>
        <div className="flex items-center gap-[14px] flex-wrap">
          {/* §3 Scope 3 view toggle */}
          <div className="flex items-center gap-[9px]">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] uppercase text-muted2">Scope 3</span>
            <div className="flex border border-[#D8D0BF] rounded-[7px] overflow-hidden">
              {([["as", "As reported"], ["excl", "Excl. Cat 15"]] as const).map(([v, label]) => {
                const active = (v === "excl") === exclCat15;
                return (
                  <button
                    key={v}
                    onClick={() => setExclCat15(v === "excl")}
                    className={`font-mono font-semibold text-[10px] tracking-[0.04em] uppercase px-[10px] py-[5px] ${active ? "bg-ink text-paper" : "text-muted"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-[9px]">
            <span className="font-mono font-medium text-[10px] tracking-[0.1em] uppercase text-muted2">Scale</span>
            <div className="flex border border-[#D8D0BF] rounded-[7px] overflow-hidden">
              {(["log", "linear"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`font-mono font-semibold text-[10px] tracking-[0.08em] uppercase px-[10px] py-[5px] ${
                    scale === s ? "bg-ink text-paper" : "text-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <svg viewBox="0 0 820 380" preserveAspectRatio="xMidYMid meet" className="w-full h-auto block">
        {grid.map((g) => (
          <g key={g.v}>
            <line x1={LEFT} y1={g.y} x2={RIGHT} y2={g.y} stroke="#E7E1D3" strokeWidth={1} />
            <text x={56} y={g.ty} textAnchor="end" className="font-mono" style={{ fontSize: 10, fontWeight: 500, fill: "#A8A294" }}>{g.label}</text>
          </g>
        ))}
        <line x1={LEFT} y1={BASE} x2={RIGHT} y2={BASE} stroke="#232019" strokeWidth={1.2} />
        {bars.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={2} style={{ fill: b.fill, opacity: b.op }} />
            <text x={b.tx} y={b.vy} textAnchor="middle" className="font-mono" style={{ fontSize: 10, fontWeight: 500, fill: "#5A554B" }}>{b.vlabel}</text>
          </g>
        ))}
        {axis.map((a, i) => (
          <text key={i} x={a.x} y={348} textAnchor="middle" className="font-sans" style={{ fontSize: 13, fontWeight: 600, fill: a.color }}>{a.label}</text>
        ))}
      </svg>

      {exclCat15 && excludedFromView.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {excludedFromView.map((c) => (
            <p key={c.id} className="font-sans text-[12px] leading-[1.5] text-sc m-0">
              {c.short}: Cat 15 breakdown not disclosed — excluded from this view.
            </p>
          ))}
        </div>
      )}

      <p className="font-sans text-xs leading-[1.5] text-muted2 mt-1.5 border-t border-hairline2 pt-3">
        Bar opacity denotes scope (solid = Scope 1). On a log scale every bar is visible; switch to linear to see
        Sembcorp&apos;s true energy-utility dominance. {exclCat15
          ? "Excl. Cat 15 subtracts each company's cited Category 15 (investments) figure — shown only where both the total and the Cat 15 breakdown are individually disclosed."
          : ""}
      </p>
    </div>
  );
}

/* ── View B: ESG radar ──────────────────────────────────────────── */
/* Values sourced from esgData; `null` = N/D and is never plotted as zero. */
const RADAR_AXES: { label: string; get: (c: (typeof companies)[number]) => number | null; max: number }[] = [
  { label: "Female Board",      get: (c) => c.social.femaleBoardPct, max: 40 },
  { label: "Female Leadership", get: (c) => c.social.femaleLeadershipPct, max: 40 },
  { label: "Training Hrs",      get: (c) => c.social.trainingHoursPerEmployee, max: 70 },
  { label: "Net-Zero (sooner)", get: (c) => 2055 - c.environmental.netZeroTargetYear, max: 12 },
  { label: "S1+2 Reduction",    get: (c) => c.environmental.scope1and2ReductionPct, max: 50 },
  { label: "Indep. Directors",  get: (c) => c.governance.independentDirectorsPct, max: 100 },
];

function RadarView() {
  const cx = 270, cy = 185, R = 120;
  const angle = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (i: number, r: number) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];

  const rings = [0.25, 0.5, 0.75, 1].map((f) =>
    RADAR_AXES.map((_, i) => pt(i, R * f).map((n) => n.toFixed(1)).join(",")).join(" ")
  );
  const spokes = RADAR_AXES.map((_, i) => { const [x, y] = pt(i, R); return { x1: cx, y1: cy, x2: x, y2: y }; });

  // Per company: build open polylines that SKIP N/D axes (no zero-fill, no line
  // drawn across the gap). A missing vertex is marked with a hollow "N/D" tick.
  const shapes = companies.map((c) => {
    const verts = RADAR_AXES.map((ax, i) => {
      const raw = ax.get(c);
      if (raw === null) return null;
      const [x, y] = pt(i, R * Math.min(Math.max(raw, 0) / ax.max, 1));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const allPresent = verts.every((v) => v !== null);
    // Split into contiguous runs so gaps break the outline.
    const runs: string[][] = [];
    let cur: string[] = [];
    verts.forEach((v) => {
      if (v === null) { if (cur.length) { runs.push(cur); cur = []; } }
      else cur.push(v);
    });
    if (cur.length) runs.push(cur);
    return { color: c.accentColor, allPresent, verts: verts.filter(Boolean) as string[], runs };
  });

  const labels = RADAR_AXES.map((ax, i) => {
    const [x, y] = pt(i, R + 20);
    const cos = Math.cos(angle(i));
    const anchor: "middle" | "start" | "end" = Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
    return { x: x.toFixed(1), y: (y + 4).toFixed(1), anchor, label: ax.label };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 items-center">
      <svg viewBox="0 0 560 380" preserveAspectRatio="xMidYMid meet" className="w-full h-auto block">
        {rings.map((p, i) => <polygon key={i} points={p} style={{ fill: "none", stroke: "#E2DBCC", strokeWidth: 1 }} />)}
        {spokes.map((s, i) => <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#E2DBCC" strokeWidth={1} />)}
        {shapes.map((s, i) =>
          s.allPresent ? (
            <polygon key={i} points={s.verts.join(" ")} style={{ fill: s.color, fillOpacity: 0.1, stroke: s.color, strokeWidth: 2, strokeLinejoin: "round" }} />
          ) : (
            // open outline (gaps not bridged) when a company has an N/D axis
            s.runs.map((run, ri) => (
              <polyline key={`${i}-${ri}`} points={run.join(" ")} style={{ fill: "none", stroke: s.color, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }} />
            ))
          )
        )}
        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} textAnchor={l.anchor} className="font-sans" style={{ fontSize: 11, fontWeight: 600, fill: "#6B665C" }}>{l.label}</text>
        ))}
      </svg>
      <div>
        <div className="font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 mb-[14px]">Higher = stronger</div>
        {companies.map((c) => {
          const missing = RADAR_AXES.filter((ax) => ax.get(c) === null).map((ax) => ax.label);
          return (
            <div key={c.id} className="flex items-start gap-[10px] mb-3">
              <span className="w-[13px] h-[13px] rounded-[3px] mt-0.5" style={{ background: c.accentColor }} />
              <div>
                <div className="font-sans font-semibold text-[13px] text-ink leading-tight">{c.shortName}</div>
                <div className="font-sans text-[11px] text-muted2 mt-0.5">{c.sector}</div>
                {missing.length > 0 && (
                  <div className="font-mono text-[10px] text-muted3 mt-0.5">N/D: {missing.join(", ")}</div>
                )}
              </div>
            </div>
          );
        })}
        <div className="font-sans text-[11px] leading-[1.5] text-muted3 mt-[14px] border-t border-hairline2 pt-3">
          Six normalised ESG axes. Where a company does not disclose an axis, its outline breaks at that spoke — N/D
          is never plotted as zero.
        </div>
      </div>
    </div>
  );
}

/* ── View C: decarbonisation pathway ────────────────────────────── */
/* Derived from each company's stated baseline year, reduction-to-date, and
   published net-zero target — the dashed segment is a cited target trajectory. */
const PATHS = companies.map((c) => {
  const baseYear = parseInt(c.baselineYear.replace(/\D/g, ""), 10) || 2010;
  const red = c.environmental.scope1and2ReductionPct;
  return {
    color: c.accentColor,
    base: [baseYear, 100] as [number, number],
    now: [2025, red !== null ? 100 - red : 100] as [number, number],
    target: [c.environmental.netZeroTargetYear, 0] as [number, number],
    reductionKnown: red !== null,
  };
});

function TrendView() {
  const X = (year: number) => 52 + ((year - 2009) / 43) * 740;
  const Y = (idx: number) => 292 - (idx / 110) * 266;

  const yticks = [
    { idx: 0, label: "Net-zero" },
    { idx: 50, label: "−50%" },
    { idx: 100, label: "Baseline" },
  ].map((t) => ({ y: Y(t.idx), ty: Y(t.idx) + 3, label: t.label }));
  const xticks = [2010, 2020, 2030, 2040, 2050].map((yr) => ({ x: X(yr), y: 320, label: String(yr) }));

  const lines = PATHS.map((p) => ({
    color: p.color,
    solid: `${X(p.base[0])},${Y(p.base[1])} ${X(p.now[0])},${Y(p.now[1])}`,
    dash: `${X(p.now[0])},${Y(p.now[1])} ${X(p.target[0])},${Y(p.target[1])}`,
    nowx: X(p.now[0]), nowy: Y(p.now[1]),
    tgtx: X(p.target[0]), tgty: Y(p.target[1]), tgtty: Y(p.target[1]) + 18, tgtyear: String(p.target[0]),
  }));

  return (
    <div>
      <svg viewBox="0 0 840 340" preserveAspectRatio="xMidYMid meet" className="w-full h-auto block">
        {yticks.map((y, i) => (
          <g key={i}>
            <line x1={52} y1={y.y} x2={792} y2={y.y} stroke="#E7E1D3" strokeWidth={1} />
            <text x={46} y={y.ty} textAnchor="end" className="font-mono" style={{ fontSize: 10, fontWeight: 500, fill: "#A8A294" }}>{y.label}</text>
          </g>
        ))}
        {xticks.map((x, i) => (
          <text key={i} x={x.x} y={x.y} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fontWeight: 500, fill: "#9A9489" }}>{x.label}</text>
        ))}
        {lines.map((l, i) => (
          <g key={i}>
            <polyline points={l.dash} style={{ fill: "none", stroke: l.color, strokeWidth: 2, strokeDasharray: "2 6", strokeLinecap: "round", opacity: 0.65 }} />
            <polyline points={l.solid} style={{ fill: "none", stroke: l.color, strokeWidth: 2.5, strokeLinecap: "round" }} />
            <circle cx={l.tgtx} cy={l.tgty} r={4} style={{ fill: "#F6F3EC", stroke: l.color, strokeWidth: 2 }} />
            <circle cx={l.nowx} cy={l.nowy} r={4.5} style={{ fill: l.color }} />
            <text x={l.tgtx} y={l.tgtty} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fontWeight: 600, fill: l.color }}>{l.tgtyear}</text>
          </g>
        ))}
      </svg>
      <p className="font-sans text-xs leading-[1.5] text-muted2 mt-1.5 border-t border-hairline2 pt-3">
        Indexed decarbonisation pathways (baseline = 100). Filled dot = reduction achieved to date; hollow dot = net-zero target year. SMRT&apos;s emissions have risen with network expansion, so no reduction is yet booked against baseline.
      </p>
    </div>
  );
}
