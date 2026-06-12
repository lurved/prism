"use client";

import { useState } from "react";
import { companies } from "@/data/esgData";
import { MetricTable } from "@/components/MetricTable";
import { EsgChart } from "@/components/EsgChart";
import { SourcesFooter } from "@/components/SourcesFooter";
import type { Company } from "@/data/types";

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(companies.map((c) => c.id));

  const toggleCompany = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev; // keep minimum 2
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const selected: Company[] = companies.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">ESG Comparison Matrix</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Side-by-Side Comparison</h1>
        <p className="text-sm text-slate-500">
          Select 2–3 companies to compare all ESG metrics. Green dot highlights the best performer per metric.
        </p>
      </div>

      {/* Company Selector */}
      <div className="flex flex-wrap gap-3 mb-8">
        {companies.map((c) => {
          const active = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleCompany(c.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                active
                  ? "border-transparent text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
              style={active ? { backgroundColor: c.accentColor, borderColor: c.accentColor } : {}}
            >
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  active ? "bg-white/20 text-white" : "text-white"
                }`}
                style={!active ? { backgroundColor: c.accentColor } : {}}
              >
                {c.logoInitials}
              </span>
              {c.shortName}
              {active && selectedIds.length > 2 && (
                <span className="text-white/70 text-xs ml-1">✕</span>
              )}
            </button>
          );
        })}
        <div className="flex items-center text-xs text-slate-400 ml-2">
          {selectedIds.length} of {companies.length} selected
        </div>
      </div>

      {/* Chart comparison */}
      <div className="mb-8">
        <EsgChart companies={selected} />
      </div>

      {/* Metric Table */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Full Metric Breakdown
        </p>
        <MetricTable companies={selected} />
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />
        Green dot = best performer for that metric
        <span className="mx-2">·</span>
        N/D = not disclosed in public report
      </div>

      <SourcesFooter />
    </div>
  );
}
