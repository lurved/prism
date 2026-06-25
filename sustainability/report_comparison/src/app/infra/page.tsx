import { PeerComparison } from "@/components/PeerComparison";
import { PeerSnapshot } from "@/components/PeerSnapshot";
import { PeerEmissionsChart } from "@/components/PeerEmissionsChart";
import { PeerCompanyCard } from "@/components/PeerCompanyCard";
import { SectionHead } from "@/components/SectionHead";
import { RequestFooter } from "@/components/RequestCta";
import { peerCompanies } from "@/data/peerData";

export const metadata = {
  title: "Electricity Utility — ESG Comparison",
  description: "ESG comparison of electricity utilities: Meralco, CLP, and National Grid.",
};

export default function InfraPage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 sm:pt-[74px] pb-13">
        <div className="font-mono font-medium text-[11px] tracking-[0.18em] uppercase text-sm mb-6">Electricity Utilities · June 2026</div>
        <h1 className="font-serif font-semibold text-ink m-0 mb-2 tracking-[-0.02em] max-w-[16ch] leading-[1.0] text-[clamp(40px,6.4vw,72px)]">
          Wires &amp; watts, side&nbsp;by&nbsp;side.
        </h1>
        <div className="font-serif italic text-[22px] leading-[1.3] text-[#8A8478] mb-[38px]">Meralco · CLP · National Grid — three grids, one lens.</div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-8 lg:gap-[52px] items-start">
          <p className="font-sans text-[18px] leading-[1.65] text-ink2 m-0 max-w-[62ch] [text-wrap:pretty]">
            Environmental, social, and governance data for electricity utilities — <strong className="font-semibold">Meralco</strong> (FY2024),{" "}
            <strong className="font-semibold">CLP</strong> (FY2025) and <strong className="font-semibold">National Grid</strong> (FY2025/26).
            Every figure is taken only from each company&apos;s latest official report.{" "}
            <span className="font-mono text-[14px] text-muted2">N/D = not disclosed · N/A = not applicable.</span>
          </p>
          <aside className="border-l-2 border-sm pl-[18px] py-1 font-sans text-[13px] leading-[1.6] text-muted [text-wrap:pretty]">
            <span className="block font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-sm mb-[9px]">Read with care</span>
            These differ sharply in business model and scale — Meralco (PH distribution + MGen generation), CLP (Asia-equity group)
            and National Grid (a ~10× larger UK + US T&amp;D group). Absolute emissions are not directly comparable.
          </aside>
        </div>
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-6 pb-2">
        <SectionHead index="01" title="Snapshot" descriptor="Portfolio totals & averages" />
        <PeerSnapshot companies={peerCompanies} groupNoun="Utilities" />
        <p className="font-sans text-[11px] text-muted2 mt-2">Combined Scope 1+2 spans different reporting boundaries — shown for context only, never as a like-for-like total.</p>
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="02" title="Emissions" descriptor="Operational GHG, as reported" />
        <PeerEmissionsChart companies={peerCompanies} />
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="03" title="Comparison Matrix" descriptor="Two views: as-reported & normalised" />
        <PeerComparison companies={peerCompanies} groupLabel="electricity utilities" />
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="04" title="Company Profiles" descriptor="Business model & headline figures" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {peerCompanies.map((c) => <PeerCompanyCard key={c.id} company={c} />)}
        </div>
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="05" title="Sources & Caveats" descriptor="Where every figure comes from" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {peerCompanies.map((c) => (
            <a key={c.id} href={c.dataSource.url} target="_blank" rel="noopener noreferrer"
              className="block border border-hairline rounded-[12px] bg-card p-5 hover:bg-[#F4F0E6] transition-colors">
              <div className="font-serif font-semibold text-[16px] text-ink">{c.name}</div>
              <div className="font-mono font-medium text-[10px] text-muted2 mt-1.5 tracking-[0.04em] uppercase">{c.dataSource.reportingPeriod}</div>
              <div className="font-mono text-[11px] mt-4" style={{ color: c.accentColor }}>View report →</div>
            </a>
          ))}
        </div>
        <p className="font-sans text-[12px] text-muted2 mt-4">All figures from official company reports only — no estimated or third-party data. Per-company notes &amp; caveats are in the Company Profiles section above.</p>
      </section>

      <RequestFooter />
    </div>
  );
}
