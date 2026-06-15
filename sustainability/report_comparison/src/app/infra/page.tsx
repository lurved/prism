import { PeerComparison } from "@/components/PeerComparison";
import { peerCompanies } from "@/data/peerData";
import { ExternalLink, FileText, Info } from "lucide-react";

export const metadata = {
  title: "Dense-City Operators — ESG Comparison",
  description: "ESG comparison of dense-city Asian electricity utilities: Meralco and CLP.",
};

export default function PeersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Dense-City Electricity Utilities · ESG Comparison</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Dense-City Electricity Utilities</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          A comparison of electricity utilities serving dense, tropical/subtropical Asian cities. Data is taken only from each
          company&apos;s latest official report; anything not disclosed is marked <span className="font-medium text-slate-700">N/D</span>,
          and metrics that don&apos;t apply to a business model are marked <span className="font-medium text-slate-700">N/A</span>.
        </p>
      </div>

      {/* Methodology note */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2.5">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <span className="font-semibold">Why two views?</span> These utilities have different reporting scopes and scales, so their
          carbon figures are not directly comparable. The <span className="font-semibold">As-Reported</span> view shows
          absolute emissions exactly as published (do not rank them). The <span className="font-semibold">Normalized &amp;
          Comparable</span> view focuses on per-unit and social/governance metrics, flagging where denominators differ.
          Accuracy is prioritized over completeness — gaps are shown honestly rather than filled with estimates.
        </div>
      </div>

      <PeerComparison />

      {/* Sources */}
      <section className="mt-10">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" /> Primary Sources — Official Reports
        </h2>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
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
      </section>

      <footer className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-400 flex flex-wrap gap-4 justify-between">
        <span>All figures from official company reports only. No estimated or third-party data. Verify against source documents.</span>
        <span>Built for pris.la · Dense-City Operator ESG</span>
      </footer>
    </div>
  );
}
