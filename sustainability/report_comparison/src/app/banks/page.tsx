import { PeerComparison } from "@/components/PeerComparison";
import { PeerSnapshot } from "@/components/PeerSnapshot";
import { PeerEmissionsChart } from "@/components/PeerEmissionsChart";
import { PeerCompanyCard } from "@/components/PeerCompanyCard";
import { SectionHeading } from "@/components/ui/section";
import { RequestCta } from "@/components/RequestCta";
import { bankCompanies } from "@/data/bankData";
import { ExternalLink, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Banks — ESG Comparison",
  description: "ESG comparison of Singapore's three largest banks: DBS, OCBC, and UOB.",
};

const absoluteCaveat = (
  <>
    <span className="font-semibold">These are operational emissions only — and tiny for a bank.</span> A bank&apos;s real
    climate footprint is its <span className="font-semibold">financed emissions</span> (Scope 3, Category 15), which DBS,
    OCBC and UOB all track by sector but none aggregate into a single figure. The Scope 3 shown here is operational only,
    so totals understate true impact and should not be ranked.
  </>
);
const normalizedCaveat = (
  <>
    <span className="font-semibold">Carbon-intensity units differ</span> (per-income, per-ft², per-m²) and are
    <span className="font-semibold"> not cross-comparable</span>. The social &amp; governance metrics below (headcount,
    board %, training) <em>are</em> broadly comparable. Independent-director % sits in each bank&apos;s Annual Report, not
    its Sustainability Report, so it shows N/D.
  </>
);

export default function BanksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* 1 — Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Singapore Banks · ESG Intelligence
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Banks</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Environmental, social, and governance data for Singapore&apos;s three largest banks — DBS, OCBC and UOB
          (all FY2024). All figures are taken only from each bank&apos;s latest official Sustainability Report.
          <span className="font-medium text-slate-700"> N/D = not disclosed; N/A = not applicable.</span>
        </p>
      </div>

      {/* Accuracy notice */}
      <div className="mb-8 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <span className="font-semibold">What matters for a bank:</span> operational Scope 1/2 emissions are negligible —
          the material impact is <span className="font-semibold">financed emissions</span> (the carbon of who they lend to)
          and <span className="font-semibold">sustainable financing</span> mobilised. None of the three disclose a single
          aggregate financed-emissions figure (they report per-sector targets, with a one-year PCAF data lag), so those
          details — plus green-financing totals — are in each bank&apos;s profile notes below.
        </div>
      </div>

      {/* 2 — Snapshot */}
      <section className="mb-8">
        <SectionHeading>Snapshot</SectionHeading>
        <PeerSnapshot companies={bankCompanies} groupNoun="Banks" />
        <p className="text-[10px] text-slate-400 mt-2">
          Combined Scope 1+2 is operational only and immaterial for banks — shown for context, not as a meaningful total.
          Female-board range covers DBS (20%) and OCBC (40%); UOB discloses board gender only in its Annual Report.
        </p>
      </section>

      {/* 3 — Emissions Visualisation */}
      <section className="mb-8">
        <SectionHeading>Emissions Visualisation</SectionHeading>
        <PeerEmissionsChart
          companies={bankCompanies}
          subtitle="Operational GHG emissions (tCO₂e) as reported in each bank's FY2024 Sustainability Report. Financed emissions are not shown (not aggregated by the banks)."
          caveat={
            <>
              <span className="font-semibold">Operational emissions only.</span> For a bank these are a rounding error next
              to financed emissions (Scope 3 Cat 15), which dominate but aren&apos;t aggregated into a single figure. Scope 2
              shown is market-based; Scope 3 here is operational (e.g. business travel), not financed. Don&apos;t read these
              bars as a bank&apos;s climate impact.
            </>
          }
        />
      </section>

      {/* 4 — Comparison Matrix */}
      <section className="mb-8">
        <SectionHeading>Comparison Matrix</SectionHeading>
        <PeerComparison
          companies={bankCompanies}
          groupLabel="banks"
          absoluteCaveat={absoluteCaveat}
          normalizedCaveat={normalizedCaveat}
        />
      </section>

      {/* 5 — Company Profiles */}
      <section className="mb-8">
        <SectionHeading>Company Profiles</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankCompanies.map((c) => (
            <PeerCompanyCard key={c.id} company={c} />
          ))}
        </div>
      </section>

      {/* 6 — Sources & Caveats */}
      <section>
        <SectionHeading>Sources &amp; Caveats</SectionHeading>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden mb-3">
          {bankCompanies.map((c) => (
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
          <span>All figures from official bank Sustainability Reports only — no estimated or third-party data. Financed-emissions,
          green-financing and per-company caveats are in the Company Profiles section above. Verify against source documents before use.</span>
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
