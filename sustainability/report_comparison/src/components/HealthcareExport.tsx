"use client";

import { useState } from "react";
import {
  healthcareEntities,
  healthcareExcluded,
  effectiveFlag,
  type HealthcareEntity,
} from "@/data/healthcareData";

/**
 * CSV/JSON export for the healthcare vertical.
 *  - New fields: sector, intensity_denominator, assurance_status, boundary_note,
 *    rationale_code, plus per-figure source_flag.
 *  - Excluded entities (SGH/TTSH/NUH) only appear when include_excluded=true,
 *    each carrying its rationale_code (mirrors utilities TEPCO handling).
 *  - The MOH 4.1 Mt context banner is a study estimate and NEVER exported as an
 *    entity row.
 */

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function entitySet(includeExcluded: boolean): HealthcareEntity[] {
  return includeExcluded ? [...healthcareEntities, ...healthcareExcluded] : healthcareEntities;
}

function toJSON(includeExcluded: boolean): string {
  const data = entitySet(includeExcluded).map((e) => ({
    id: e.id,
    name: e.name,
    listing: e.listing,
    sector: e.sector,
    status: e.status,
    intensity_denominator: e.intensityDenominator,
    scope2_method: e.scope2Method,
    assurance_status: e.assuranceStatus,
    boundary_note: e.boundaryNote,
    rationale_code: e.rationaleCode,
    countries: e.countries,
    frameworks: e.frameworks,
    metrics: Object.fromEntries(
      Object.entries(e.metrics).map(([k, mv]) => [k, {
        value: mv.value,
        display: mv.display ?? null,
        unit: mv.unit,
        year: mv.year,
        source_flag: effectiveFlag(mv),
        page: mv.citation?.page ?? null,
        source_url: mv.citation?.url ?? null,
      }]),
    ),
  }));
  return JSON.stringify({ sector: "healthcare", generated: new Date().toISOString(), include_excluded: includeExcluded, entities: data }, null, 2);
}

const CSV_COLS = [
  "entity_id", "entity_name", "sector", "status", "listing", "frameworks",
  "intensity_denominator", "scope2_method", "assurance_status", "rationale_code",
  "metric_key", "value", "display", "unit", "year", "source_flag", "page", "source_url", "boundary_note",
];

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV(includeExcluded: boolean): string {
  const lines = [CSV_COLS.join(",")];
  for (const e of entitySet(includeExcluded)) {
    const base = [e.id, e.name, e.sector, e.status, e.listing, e.frameworks?.join("; ") ?? "", e.intensityDenominator, e.scope2Method, e.assuranceStatus, e.rationaleCode];
    const keys = Object.keys(e.metrics);
    if (keys.length === 0) {
      // Entity with no metrics (pending/excluded) still exports one row so its
      // status + rationale_code round-trip.
      lines.push([...base, "", "", "", "", "", "", "", "", e.boundaryNote].map(csvCell).join(","));
      continue;
    }
    for (const k of keys) {
      const mv = e.metrics[k];
      // `display` preserves text metrics (Scope 2 method, target wording, Scope 3
      // coverage) whose numeric `value` is null — otherwise they export blank.
      lines.push([...base, k, mv.value, mv.display ?? "", mv.unit, mv.year, effectiveFlag(mv), mv.citation?.page ?? "", mv.citation?.url ?? "", e.boundaryNote].map(csvCell).join(","));
    }
  }
  return lines.join("\n");
}

export function HealthcareExport() {
  const [includeExcluded, setIncludeExcluded] = useState(false);

  return (
    <div className="border border-hairline rounded-[14px] bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div>
        <div className="font-serif font-semibold text-[15px] text-ink">Export data</div>
        <p className="font-sans text-[12px] text-muted2 mt-1 max-w-[52ch]">
          Includes <span className="font-mono">sector, intensity_denominator, assurance_status, boundary_note,
          rationale_code</span> and per-figure <span className="font-mono">source_flag</span>. The MOH 4.1 Mt study
          estimate is never exported as an entity row.
        </p>
      </div>
      <div className="flex flex-col gap-3 shrink-0">
        <label className="flex items-center gap-2 font-sans text-[12px] text-muted cursor-pointer select-none">
          <input type="checkbox" checked={includeExcluded} onChange={(e) => setIncludeExcluded(e.target.checked)} className="accent-good" />
          include_excluded <span className="font-mono text-[11px] text-muted3">(SGH · TTSH · NUH + codes)</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => download(`healthcare-esg${includeExcluded ? "-with-excluded" : ""}.json`, toJSON(includeExcluded), "application/json")}
            className="font-mono font-medium text-[11px] tracking-[0.04em] uppercase px-[14px] py-[8px] rounded-full bg-ink text-paper hover:opacity-90 transition-opacity">
            JSON
          </button>
          <button
            onClick={() => download(`healthcare-esg${includeExcluded ? "-with-excluded" : ""}.csv`, toCSV(includeExcluded), "text/csv")}
            className="font-mono font-medium text-[11px] tracking-[0.04em] uppercase px-[14px] py-[8px] rounded-full border border-hairline text-muted hover:bg-chip hover:text-ink transition-colors">
            CSV
          </button>
        </div>
      </div>
    </div>
  );
}
