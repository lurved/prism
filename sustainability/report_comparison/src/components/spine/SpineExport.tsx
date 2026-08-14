"use client";

/**
 * ONE export schema for every category.
 *
 * Previously: two incompatible exports on two of four pages. Now every
 * category exports the same columns, including the GHG Protocol envelope, so
 * rows from different categories concatenate into one table without a
 * conversion step — the thing three units-at-rest and two schemas made
 * impossible.
 *
 * Cell state round-trips explicitly: a value cell is never empty-because-zero,
 * and N/D, N/A, out-of-scope and pending are distinguishable in the `state`
 * column — a consumer must be able to tell a gap in the entity's reporting
 * from a boundary in ours.
 */
import { useState } from "react";
import { rowsForPack, type Entity, type PackId } from "@/data/spine";
import { assessUsability, engagementQuestions, isStale } from "@/data/spine/usability";

const DISCLAIMER =
  "As reported by each entity; no estimation or interpolation. state=disclosed|nd|na|out_of_scope|pending. An empty value is never a zero. Emissions in tCO2e. Tier 1 = IFRS S2 cross-industry metrics; Tier 2 = GRI; Tier 3 = industry pack.";

const COLS = [
  "entity_id", "entity_name", "category", "status", "listing", "countries",
  "reporting_period", "fiscal_year_end", "consolidation", "scope2_method",
  "scope3_categories", "base_year", "gwp_source", "assurance_level",
  "metric_key", "metric_label", "tier", "authority", "authority_ref",
  "state", "value", "display", "unit", "year", "provenance",
  "report_title", "page", "source_url", "note", "na_or_scope_reason",
  "usability", "usability_limitations", "row_is_current",
];

function esc(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowsFor(entities: Entity[], pack: PackId) {
  const spine = rowsForPack(pack);
  const out: (string | number | null)[][] = [];
  for (const e of entities) {
    const env = e.envelope;
    const base = [
      e.id, e.name, e.categoryId, e.status, e.listing ?? "", e.countries.join(" "),
      e.reportingPeriod, e.fiscalYearEnd ?? "", env.consolidation, env.scope2Method,
      env.scope3Categories ? env.scope3Categories.join(" ") : "", env.baseYear ?? "",
      env.gwpSource, env.assurance,
    ];
    const current = !isStale(e);
    for (const row of spine) {
      const cell = e.metrics[row.key];
      if (!cell) continue;
      const u = assessUsability(cell, row, e);
      const grade = [u.grade, u.limitations.join(" | "), String(current)];
      const meta = [row.key, row.label, row.tier, row.authority, row.authorityRef ?? ""];
      if (cell.state === "disclosed") {
        out.push([...base, ...meta, "disclosed", cell.value ?? "", cell.display, cell.unit, cell.year,
          cell.provenance, cell.citation?.reportTitle ?? "", cell.citation?.page ?? "",
          cell.citation?.url ?? "", cell.note ?? "", "", ...grade]);
      } else if (cell.state === "na") {
        out.push([...base, ...meta, "na", "", "N/A", "", "", "", "", "", "", "", cell.reason, ...grade]);
      } else if (cell.state === "out_of_scope") {
        out.push([...base, ...meta, "out_of_scope", "", "out of scope", "", "", "", "", "", "", "", cell.reason, ...grade]);
      } else if (cell.state === "nd") {
        out.push([...base, ...meta, "nd", "", "N/D", "", "", "unverified", "", "", "", cell.note ?? "", "", ...grade]);
      } else {
        out.push([...base, ...meta, "pending", "", "pending", "", "", "", "", "", "", "", "", ...grade]);
      }
    }
  }
  return out;
}

function toCSV(entities: Entity[], pack: PackId): string {
  const lines = [`# ${DISCLAIMER}`, COLS.join(",")];
  for (const r of rowsFor(entities, pack)) lines.push(r.map(esc).join(","));
  return lines.join("\n");
}

function toJSON(entities: Entity[], pack: PackId): string {
  const spine = rowsForPack(pack);
  return JSON.stringify(
    {
      _README: DISCLAIMER,
      generatedAt: new Date().toISOString(),
      spine: spine.map((r) => ({ key: r.key, label: r.label, tier: r.tier, authority: r.authority, authorityRef: r.authorityRef ?? null, unit: r.unit })),
      entities: entities.map((e) => ({
        id: e.id, name: e.name, category: e.categoryId, status: e.status,
        listing: e.listing, countries: e.countries, businessModel: e.businessModel,
        reportingPeriod: e.reportingPeriod, fiscalYearEnd: e.fiscalYearEnd,
        boundaryNote: e.boundaryNote, rationaleCode: e.rationaleCode,
        envelope: e.envelope, source: e.source,
        metrics: Object.fromEntries(spine.map((r) => [r.key, e.metrics[r.key] ?? null])),
        targets: e.targets, dataNotes: e.dataNotes, caveatNotes: e.caveatNotes,
        isCurrent: !isStale(e),
        engagementQuestions: engagementQuestions(e),
      })),
    },
    null,
    2,
  );
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SpineExport({ entities, pack, categoryId }: { entities: Entity[]; pack: PackId; categoryId: string }) {
  const [done, setDone] = useState<"csv" | "json" | null>(null);
  const flash = (k: "csv" | "json") => {
    setDone(k);
    setTimeout(() => setDone(null), 1600);
  };
  const btn =
    "inline-flex items-center gap-2 font-mono font-semibold text-[11px] tracking-[0.06em] uppercase px-[14px] py-[9px] rounded-full border border-hairline bg-card text-ink2 hover:bg-card transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        className={btn}
        onClick={() => {
          download(`esg-${categoryId}.csv`, toCSV(entities, pack), "text/csv;charset=utf-8");
          flash("csv");
        }}
      >
        {done === "csv" ? "✓ Downloaded" : "↓ Download CSV"}
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => {
          download(`esg-${categoryId}.json`, toJSON(entities, pack), "application/json");
          flash("json");
        }}
      >
        {done === "json" ? "✓ Downloaded" : "↓ Download JSON"}
      </button>
      <span className="font-sans text-[11px] text-muted2 max-w-[52ch]">
        Same schema for every category, including the GHG Protocol envelope — rows from different categories
        concatenate directly. N/D, N/A, out-of-scope and pending stay distinguishable.
      </span>
    </div>
  );
}
