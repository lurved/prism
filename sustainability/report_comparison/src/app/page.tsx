import { companies, aggregateTotals } from "@/data/esgData";
import { CompanyCard } from "@/components/CompanyCard";
import { EmissionsPanel } from "@/components/EmissionsPanel";
import { MetricTable } from "@/components/MetricTable";
import { SourcesFooter } from "@/components/SourcesFooter";
import { SectionHead } from "@/components/SectionHead";
import { RequestFooter } from "@/components/RequestCta";

function fmtM(ktCO2e: number): string {
  if (ktCO2e >= 1000) return `${(ktCO2e / 1000).toFixed(1)}M`;
  return `${Math.round(ktCO2e)}k`;
}

export default function TemasekPage() {
  const { totalScope1ktCO2e, totalScope2ktCO2e, totalHeadcount, avgFemaleBoard, earliestNetZero } = aggregateTotals;

  const snapshot = [
    { value: fmtM(totalScope1ktCO2e), unit: "tCO₂e", label: "Combined Scope 1", sub: "3 companies" },
    { value: fmtM(totalScope2ktCO2e), unit: "tCO₂e", label: "Combined Scope 2", sub: "Market-based" },
    { value: totalHeadcount.toLocaleString(), unit: "", label: "Combined Workforce", sub: "Total employees" },
    { value: `${avgFemaleBoard}%`, unit: "", label: "Avg Female Board", sub: "Portfolio average" },
    { value: String(earliestNetZero), unit: "", label: "Earliest Net-Zero", sub: "Singtel — all scopes" },
    { value: "2 / 3", unit: "", label: "External Assurance", sub: "Sembcorp & Singtel" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 sm:pt-[74px] pb-13">
        <div className="font-mono font-medium text-[11px] tracking-[0.18em] uppercase text-sm mb-6">ESG Intelligence · June 2026</div>
        <h1 className="font-serif font-semibold text-ink m-0 mb-2 tracking-[-0.02em] max-w-[15ch] leading-[1.0] text-[clamp(40px,6.4vw,72px)]">
          Temasek Portfolio, side&nbsp;by&nbsp;side.
        </h1>
        <div className="font-serif italic text-[22px] leading-[1.3] text-[#8A8478] mb-[38px]">
          Sembcorp · SMRT · Singtel — three sectors, one lens.
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-8 lg:gap-[52px] items-start">
          <p className="font-sans text-[18px] leading-[1.65] text-ink2 m-0 max-w-[62ch] [text-wrap:pretty]">
            Environmental, social, and governance data sourced directly from the latest published reports of{" "}
            <strong className="font-semibold">Sembcorp Industries</strong> (FY2025),{" "}
            <strong className="font-semibold">SMRT Corporation</strong> (FY2024/25), and{" "}
            <strong className="font-semibold">Singtel Group</strong> (FY2025). Every figure is verified against source.{" "}
            <span className="font-mono text-[14px] text-muted2">N/D = not disclosed in official report.</span>
          </p>
          <aside className="border-l-2 border-sm pl-[18px] py-1 font-sans text-[13px] leading-[1.6] text-muted [text-wrap:pretty]">
            <span className="block font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-sm mb-[9px]">Read with care</span>
            These companies span different sectors and fiscal years. Emissions metrics are <em>not</em> directly comparable
            across sectors — Sembcorp operates at energy-utility scale, while SMRT&apos;s footprint is dominated by Scope 2
            traction electricity.
          </aside>
        </div>
        {/* Company chips */}
        <div className="flex flex-wrap gap-[13px] mt-[46px]">
          {companies.map((c) => (
            <div key={c.id} className="flex items-center gap-[13px] border border-hairline bg-card rounded-[12px] px-[17px] py-[13px]">
              <span className="w-[34px] h-[34px] rounded-[8px] text-white font-mono font-semibold text-xs text-center leading-[34px] tracking-[0.02em]"
                style={{ background: c.accentColor }}>{c.logoInitials}</span>
              <div>
                <div className="font-sans font-semibold text-[14px] text-ink leading-[1.1]">{c.name}</div>
                <div className="font-mono font-medium text-[11px] text-muted2 mt-1 tracking-[0.04em] uppercase">{c.sector} · {c.reportingPeriod}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 01 Snapshot */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-6 pb-2">
        <SectionHead index="01" title="Snapshot" descriptor="Portfolio totals & averages" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-hairline border border-hairline rounded-[12px] overflow-hidden">
          {snapshot.map((s) => (
            <div key={s.label} className="bg-card px-5 py-[22px]">
              <div className="font-serif font-medium text-[40px] leading-[1] text-ink tracking-[-0.01em]">
                {s.value}{s.unit && <span className="font-mono font-medium text-[14px] text-muted2 ml-[5px]">{s.unit}</span>}
              </div>
              <div className="font-sans font-semibold text-[12px] leading-[1.3] text-ink2 mt-[13px]">{s.label}</div>
              <div className="font-sans text-[11px] leading-[1.3] text-muted2 mt-[3px]">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 02 Emissions & ESG */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="02" title="Emissions & ESG" descriptor="All emissions in ktCO₂e (thousands of tonnes)" />
        <EmissionsPanel />
      </section>

      {/* 03 Comparison Matrix */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="03" title="Comparison Matrix" descriptor="Metric by metric, across the three reports" />
        <div className="flex items-center gap-[18px] mb-[18px] flex-wrap">
          <span className="inline-flex items-center gap-2 font-sans font-medium text-[12px] text-muted">
            <span className="w-[7px] h-[7px] rounded-full bg-good" />Best performer for that metric
          </span>
          <span className="font-mono font-medium text-[12px] text-muted3">N/D = not disclosed</span>
        </div>
        <MetricTable companies={companies} />
      </section>

      {/* 04 Company Profiles */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="04" title="Company Profiles" descriptor="Strategy & headline figures" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {companies.map((c) => <CompanyCard key={c.id} company={c} />)}
        </div>
      </section>

      {/* 05 Sources & Caveats */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="05" title="Sources & Caveats" descriptor="Where every figure comes from" />
        <SourcesFooter />
      </section>

      <RequestFooter />
    </div>
  );
}
