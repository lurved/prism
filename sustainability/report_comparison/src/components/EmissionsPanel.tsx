"use client";

import { useState } from "react";

/* Canonical chart dataset (ktCO₂e) — matches the design handoff. */
const COMPANIES = [
  { code: "SC", short: "Sembcorp", sector: "Energy",    color: "#B4722E", scope1: 7400,  scope2: 282.9, scope3: 15300, reduction: 47.5 },
  { code: "SM", short: "SMRT",     sector: "Transport", color: "#B0473D", scope1: 129.2, scope2: 372.2, scope3: 209.8, reduction: 0 },
  { code: "ST", short: "Singtel",  sector: "Telecom",   color: "#2D6E87", scope1: 13.2,  scope2: 342.5, scope3: 2300,  reduction: 19.3 },
];

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
            {COMPANIES.map((c) => (
              <span key={c.code} className="inline-flex items-center gap-[7px] font-sans font-medium text-[11px] text-muted">
                <span className="w-[11px] h-[11px] rounded-[3px]" style={{ background: c.color }} />
                {c.short}
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 pt-[26px] pb-[22px]">
          {tab === "bar" && <BarView scale={scale} setScale={setScale} scopes={scopes} setScopes={setScopes} />}
          {tab === "radar" && <RadarView />}
          {tab === "trend" && <TrendView />}
        </div>
      </div>

      {/* Caveat */}
      <div className="flex gap-3 items-start mt-[18px] border-l-2 border-sc pl-4 py-0.5">
        <span className="font-sans font-semibold text-base leading-tight text-sc">⚠</span>
        <p className="font-sans text-[13px] leading-[1.55] text-muted m-0 max-w-[88ch]">
          Sembcorp Scope 3 (15.3M tCO₂e) includes Category 15 Investments — a common energy-company convention that
          inflates Scope 3 relative to telecom and grid peers. Scope 2 is market-based throughout.
        </p>
      </div>
    </div>
  );
}

/* ── View A: grouped bar chart ──────────────────────────────────── */
function BarView({
  scale, setScale, scopes, setScopes,
}: {
  scale: "log" | "linear";
  setScale: (s: "log" | "linear") => void;
  scopes: { s1: boolean; s2: boolean; s3: boolean };
  setScopes: (s: { s1: boolean; s2: boolean; s3: boolean }) => void;
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

  const gridVals = scale === "log" ? [10, 100, 1000, 10000] : [0, 4000, 8000, 12000, 16000];
  const gridLabel = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v));
  const grid = gridVals.map((v) => {
    const y = BASE - hOf(v);
    return { v, y, ty: y + 3, label: gridLabel(v) };
  });

  const groupW = (RIGHT - LEFT) / 3; // 244
  const bars: { x: number; y: number; w: number; h: number; fill: string; op: number; tx: number; vy: number; vlabel: string }[] = [];
  const axis: { x: number; label: string; color: string }[] = [];
  COMPANIES.forEach((c, ci) => {
    const groupLeft = LEFT + ci * groupW;
    const n = visible.length;
    if (n > 0) {
      const barW = Math.min(48, (groupW * 0.72) / n - 10);
      const totalW = n * barW + (n - 1) * 14;
      const startX = groupLeft + (groupW - totalW) / 2;
      visible.forEach((scopeIdx, k) => {
        const v = [c.scope1, c.scope2, c.scope3][scopeIdx];
        const h = hOf(v);
        const x = startX + k * (barW + 14);
        bars.push({
          x, y: BASE - h, w: barW, h, fill: c.color, op: SCOPE_OPACITY[scopeIdx],
          tx: x + barW / 2, vy: BASE - h - 6, vlabel: fmtVal(v),
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
        <div className="flex gap-2">
          {togglePill("s1", "Scope 1", "#5A554B")}
          {togglePill("s2", "Scope 2", "#5A554B")}
          {togglePill("s3", "Scope 3", "#5A554B")}
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
      <p className="font-sans text-xs leading-[1.5] text-muted2 mt-1.5 border-t border-hairline2 pt-3">
        Bar opacity denotes scope (solid = Scope 1). On a log scale every bar is visible; switch to linear to see Sembcorp&apos;s true energy-utility dominance.
      </p>
    </div>
  );
}

/* ── View B: ESG radar ──────────────────────────────────────────── */
const RADAR_AXES = [
  { label: "Female Board",      vals: [20, 25, 36],     max: 40 },
  { label: "Female Leadership", vals: [16, 24.1, 31],   max: 40 },
  { label: "Training Hrs",      vals: [26.5, 65.8, 39.1], max: 70 },
  { label: "Net-Zero",          vals: [2, 2, 7],        max: 7 },
  { label: "S1+2 Reduction",    vals: [47.5, 0, 19.3],  max: 50 },
  { label: "Indep. Directors",  vals: [0, 83, 82],      max: 100 },
];

function RadarView() {
  const cx = 270, cy = 185, R = 120;
  const angle = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (i: number, r: number) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];

  const rings = [0.25, 0.5, 0.75, 1].map((f) =>
    RADAR_AXES.map((_, i) => pt(i, R * f).map((n) => n.toFixed(1)).join(",")).join(" ")
  );
  const spokes = RADAR_AXES.map((_, i) => { const [x, y] = pt(i, R); return { x1: cx, y1: cy, x2: x, y2: y }; });
  const polys = COMPANIES.map((c, ci) => ({
    color: c.color,
    points: RADAR_AXES.map((ax, i) => pt(i, R * Math.min(ax.vals[ci] / ax.max, 1)).map((n) => n.toFixed(1)).join(",")).join(" "),
  }));
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
        {polys.map((p, i) => <polygon key={i} points={p.points} style={{ fill: p.color, fillOpacity: 0.1, stroke: p.color, strokeWidth: 2, strokeLinejoin: "round" }} />)}
        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} textAnchor={l.anchor} className="font-sans" style={{ fontSize: 11, fontWeight: 600, fill: "#6B665C" }}>{l.label}</text>
        ))}
      </svg>
      <div>
        <div className="font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 mb-[14px]">Higher = stronger</div>
        {COMPANIES.map((c) => (
          <div key={c.code} className="flex items-center gap-[10px] mb-3">
            <span className="w-[13px] h-[13px] rounded-[3px]" style={{ background: c.color }} />
            <div>
              <div className="font-sans font-semibold text-[13px] text-ink leading-tight">{c.short}</div>
              <div className="font-sans text-[11px] text-muted2 mt-0.5">{c.sector}</div>
            </div>
          </div>
        ))}
        <div className="font-sans text-[11px] leading-[1.5] text-muted3 mt-[14px] border-t border-hairline2 pt-3">
          Six normalised ESG axes. Not-disclosed values are plotted as zero.
        </div>
      </div>
    </div>
  );
}

/* ── View C: decarbonisation pathway ────────────────────────────── */
const PATHS = [
  { color: "#B4722E", base: [2010, 100], now: [2025, 52.5], target: [2050, 0] },
  { color: "#B0473D", base: [2022, 100], now: [2025, 100],  target: [2050, 0] },
  { color: "#2D6E87", base: [2023, 100], now: [2025, 80.7], target: [2045, 0] },
];

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
