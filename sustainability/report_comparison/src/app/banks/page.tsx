import { PeerComparison } from "@/components/PeerComparison";
import { PeerSnapshot } from "@/components/PeerSnapshot";
import { PeerEmissionsChart } from "@/components/PeerEmissionsChart";
import { PeerCompanyCard } from "@/components/PeerCompanyCard";
import { SectionHead } from "@/components/SectionHead";
import { RequestFooter } from "@/components/RequestCta";
import { bankCompanies } from "@/data/bankData";

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
    <span className="font-semibold">Carbon-intensity units differ</span> (per-income, per-ft², per-m²) and are not
    cross-comparable. The social &amp; governance metrics below (headcount, board %, training, independent directors)
    <em> are</em> broadly comparable.
  </>
);

export default function BanksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 sm:pt-[74px] pb-13">
        <div className="font-mono font-medium text-[11px] tracking-[0.18em] uppercase text-sm mb-6">Singapore Banks · June 2026</div>
        <h1 className="font-serif font-semibold text-ink m-0 mb-2 tracking-[-0.02em] max-w-[15ch] leading-[1.0] text-[clamp(40px,6.4vw,72px)]">
          The big three, side&nbsp;by&nbsp;side.
        </h1>
        <div className="font-serif italic text-[22px] leading-[1.3] text-[#8A8478] mb-[38px]">DBS · OCBC · UOB — three banks, one lens.</div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-8 lg:gap-[52px] items-start">
          <p className="font-sans text-[18px] leading-[1.65] text-ink2 m-0 max-w-[62ch] [text-wrap:pretty]">
            Environmental, social, and governance data for Singapore&apos;s three largest banks — <strong className="font-semibold">DBS</strong>,{" "}
            <strong className="font-semibold">OCBC</strong> and <strong className="font-semibold">UOB</strong> (all FY2024). Every figure is taken
            only from each bank&apos;s latest official Sustainability or Annual Report.{" "}
            <span className="font-mono text-[14px] text-muted2">N/D = not disclosed · N/A = not applicable.</span>
          </p>
          <aside className="border-l-2 border-sm pl-[18px] py-1 font-sans text-[13px] leading-[1.6] text-muted [text-wrap:pretty]">
            <span className="block font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-sm mb-[9px]">What matters for a bank</span>
            Operational Scope 1/2 emissions are negligible — the material impact is <em>financed emissions</em> and
            sustainable financing mobilised. None disclose a single aggregate financed-emissions figure, so that detail is in each bank&apos;s profile.
          </aside>
        </div>
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-6 pb-2">
        <SectionHead index="01" title="Snapshot" descriptor="Portfolio totals & averages" />
        <PeerSnapshot companies={bankCompanies} groupNoun="Banks" />
        <p className="font-sans text-[11px] text-muted2 mt-2">Combined Scope 1+2 is operational only and immaterial for banks — shown for context, not as a meaningful total.</p>
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="02" title="Emissions" descriptor="Operational GHG only" />
        <PeerEmissionsChart
          companies={bankCompanies}
          subtitle="Operational GHG emissions (tCO₂e), FY2024. Financed emissions are not shown (not aggregated by the banks)."
          caveat={
            <>
              <span className="font-semibold">Operational emissions only.</span> For a bank these are a rounding error next
              to financed emissions (Scope 3 Cat 15), which dominate but aren&apos;t aggregated. Don&apos;t read these bars as a bank&apos;s climate impact.
            </>
          }
        />
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="03" title="Comparison Matrix" descriptor="Two views: as-reported & comparable" />
        <PeerComparison companies={bankCompanies} groupLabel="banks" absoluteCaveat={absoluteCaveat} normalizedCaveat={normalizedCaveat} />
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="04" title="Company Profiles" descriptor="Business model & headline figures" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {bankCompanies.map((c) => <PeerCompanyCard key={c.id} company={c} />)}
        </div>
      </section>

      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="05" title="Sources & Caveats" descriptor="Where every figure comes from" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankCompanies.map((c) => (
            <a key={c.id} href={c.dataSource.url} target="_blank" rel="noopener noreferrer"
              className="block border border-hairline rounded-[12px] bg-card p-5 hover:bg-[#F4F0E6] transition-colors">
              <div className="font-serif font-semibold text-[16px] text-ink">{c.name}</div>
              <div className="font-mono font-medium text-[10px] text-muted2 mt-1.5 tracking-[0.04em] uppercase">{c.dataSource.reportingPeriod}</div>
              <div className="font-mono text-[11px] mt-4" style={{ color: c.accentColor }}>View report →</div>
            </a>
          ))}
        </div>
        <p className="font-sans text-[12px] text-muted2 mt-4">All figures from official bank reports only — no estimated or third-party data. Financed-emissions, green-financing and per-company caveats are in the Company Profiles section above.</p>
      </section>

      <RequestFooter />
    </div>
  );
}
