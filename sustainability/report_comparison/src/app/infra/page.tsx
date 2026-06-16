import { PeerComparison } from "@/components/PeerComparison";
import { PeerSnapshot } from "@/components/PeerSnapshot";
import { PeerEmissionsChart } from "@/components/PeerEmissionsChart";
import { PeerCompanyCard } from "@/components/PeerCompanyCard";
import { SectionHeading } from "@/components/ui/section";
import { RequestCta } from "@/components/RequestCta";
import { peerCompanies } from "@/data/peerData";
import { ExternalLink, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Electricity Utility — ESG Comparison",
  description: "ESG comparison of dense-city Asian electricity utilities: Meralco and CLP.",
};

export default function InfraPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* 1 — Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Dense-City Electricity Utilities · ESG Intelligence
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Electricity Utility</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Environmental, social, and governance data for electricity utilities serving dense, tropical/subtropical Asian
          cities — Meralco (FY2024) and CLP (FY2025). All figures are taken only from each company&apos;s latest official
          report. <span className="font-medium text-slate-700">N/D = not disclosed; N/A = not applicable.</span>
        </p>
      </div>

      {/* Accuracy notice */}
      <div className="mb-8 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <span className="font-semibold">Data source note:</span> these utilities differ in scope and scale — Meralco is
          Philippines-only and consolidates MGen generation; CLP is a multinational group reported on an equity basis
          (incl. Australia, India, Mainland China). Absolute emissions are <span className="font-semibold">not directly
          comparable</span>; carbon-intensity units differ (per-GWh vs. per-kWh). Both are <span className="font-semibold">
          vertically integrated</span>, so Scope 1 includes power generation.
        </div>
      </div>

      {/* 2 — Snapshot */}
      <section className="mb-8">
        <SectionHeading>Snapshot</SectionHeading>
        <PeerSnapshot />
        <p className="text-[10px] text-slate-400 mt-2">
          *Carbon intensity: Meralco 0.13 (134 tCO₂e/GWh = 0.134 kg CO₂e/kWh) · CLP 0.50 kg CO₂e/kWh. Combined S1+S2 spans
          different reporting boundaries — shown for context only, not as a like-for-like total.
        </p>
      </section>

      {/* 3 — Emissions Visualisation */}
      <section className="mb-8">
        <SectionHeading>Emissions Visualisation</SectionHeading>
        <PeerEmissionsChart />
      </section>

      {/* 4 — Comparison Matrix */}
      <section className="mb-8">
        <SectionHeading>Comparison Matrix</SectionHeading>
        <PeerComparison />
      </section>

      {/* 5 — Company Profiles */}
      <section className="mb-8">
        <SectionHeading>Company Profiles</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {peerCompanies.map((c) => (
            <PeerCompanyCard key={c.id} company={c} />
          ))}
        </div>
      </section>

      {/* 6 — Sources & Caveats */}
      <section>
        <SectionHeading>Sources &amp; Caveats</SectionHeading>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden mb-3">
          {peerCompanies.map((c) => (
            <div key={c.id} className="flex gap-4 p-4 bg-white">
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: c.accentColor }}>{c.logoInitials}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.dataSource.reportTitle}</p>
                  </div>
                  <a href={c.dataSource.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 flex-shrink-0">
                    View report <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Period: <span className="font-medium text-slate-600">{c.dataSource.reportingPeriod}</span> · Accessed{" "}
                  <span className="font-medium text-slate-600">{c.dataSource.accessDate}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 text-[11px] text-slate-400">
          <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>All figures from official company reports only — no estimated or third-party data. Per-company data
          notes &amp; caveats are in the Company Profiles section above. Verify against source documents before use.</span>
        </div>
      </section>

      {/* CTA */}
      <RequestCta />

      <footer className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-400 flex flex-wrap gap-4 justify-between">
        <span>Output generated with AI assistance — independently verify all figures before use in decision-making, reporting, or publication.</span>
        <span>Built for pris.la · ESG Tracker</span>
      </footer>
    </div>
  );
}
