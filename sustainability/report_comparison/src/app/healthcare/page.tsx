import { SectionHead } from "@/components/SectionHead";
import { RequestFooter } from "@/components/RequestCta";
import { HealthcareComparison } from "@/components/HealthcareComparison";
import { HealthcareExport } from "@/components/HealthcareExport";
import {
  healthcareEntities,
  healthcareExcluded,
  mohContextBanner,
  ASSURANCE_LABEL,
  type HealthcareEntity,
} from "@/data/healthcareData";

export const metadata = {
  title: "Healthcare — ESG Comparison",
  description:
    "ESG comparison of listed healthcare groups: IHH Healthcare, Thomson Medical, Raffles Medical. Entity-level GHG only — no interpolation.",
};

function StatusLine({ e }: { e: HealthcareEntity }) {
  const map: Record<HealthcareEntity["status"], string> = {
    populated: "Fully populated",
    pending_extraction: "Beds confirmed · emissions pending extraction",
    pending_verification: "Pending verification — nothing seeded",
    excluded: "Excluded — no entity-level inventory",
  };
  return <span>{map[e.status]}</span>;
}

export default function HealthcarePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 sm:pt-[74px] pb-13">
        <div className="font-mono font-medium text-[11px] tracking-[0.18em] uppercase text-sm mb-6">Healthcare · July 2026</div>
        <h1 className="font-serif font-semibold text-ink m-0 mb-2 tracking-[-0.02em] max-w-[16ch] leading-[1.0] text-[clamp(40px,6.4vw,72px)]">
          Listed care groups, side&nbsp;by&nbsp;side.
        </h1>
        <div className="font-serif italic text-[22px] leading-[1.3] text-[#8A8478] mb-[38px]">IHH · Thomson Medical · Raffles Medical — one lens, no guesses.</div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-8 lg:gap-[52px] items-start">
          <p className="font-sans text-[18px] leading-[1.65] text-ink2 m-0 max-w-[62ch] [text-wrap:pretty]">
            Entity-level GHG for listed healthcare groups — <strong className="font-semibold">IHH Healthcare</strong> (Scope 1+2 &amp; intensity),{" "}
            <strong className="font-semibold">Raffles Medical</strong> (Scope 1 &amp; 2, no Scope 3) and{" "}
            <strong className="font-semibold">Thomson Medical</strong> (beds + revenue-basis intensity; absolutes pending). The boundary is the listed group
            reporting entity, not individual hospital campuses. Every figure carries a source flag.{" "}
            <span className="font-mono text-[14px] text-muted2">✅ Confirmed · ⚠️ Estimated · ❌ Unverified.</span>
          </p>
          <aside className="border-l-2 border-sm pl-[18px] py-1 font-sans text-[13px] leading-[1.6] text-muted [text-wrap:pretty]">
            <span className="block font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-sm mb-[9px]">No interpolation</span>
            Blank beats guessed. Intensity uses each group&apos;s own published kg&nbsp;CO₂e/patient-bed-day — never a ratio we
            compute. Singapore public hospitals publish no entity-level inventory and are excluded, not estimated.
          </aside>
        </div>
      </section>

      {/* Context banner — MOH study estimate (never a comparison row) */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-2 pb-2">
        <div className="border border-hairline rounded-[14px] bg-[#FBF6EA] p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="shrink-0">
            <div className="font-serif font-medium text-[34px] leading-[1] text-ink tracking-[-0.01em]">{mohContextBanner.value}</div>
            <span className="inline-block mt-2 font-mono text-[10px] tracking-[0.04em] rounded-full px-2 py-[3px] text-sc bg-[rgba(180,114,46,0.12)]">⚠️ {mohContextBanner.flagLabel}</span>
          </div>
          <div className="sm:border-l sm:border-hairline sm:pl-5">
            <div className="font-sans font-semibold text-[13px] text-ink2">{mohContextBanner.title}</div>
            <p className="font-sans text-[12px] leading-[1.55] text-muted mt-1 m-0 max-w-[68ch]">{mohContextBanner.body}</p>
            <a href={mohContextBanner.source.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 font-mono text-[10px] text-good">{mohContextBanner.source.title} →</a>
          </div>
        </div>
      </section>

      {/* Comparison matrix */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="01" title="Comparison Matrix" descriptor="Entity-level GHG, every figure flagged & cited" />
        <HealthcareComparison entities={healthcareEntities} />
      </section>

      {/* Entity profiles */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="02" title="Entity Profiles" descriptor="Boundary, assurance & data notes" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {healthcareEntities.map((e) => (
            <article key={e.id} className="border border-hairline rounded-[14px] bg-card overflow-hidden flex flex-col">
              <div className="h-1" style={{ background: e.accentColor }} />
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-[38px] h-[38px] rounded-[9px] text-white font-mono font-semibold text-[13px] text-center leading-[38px]" style={{ background: e.accentColor }}>{e.logoInitials}</span>
                  <div>
                    <div className="font-serif font-semibold text-[16px] text-ink leading-[1.1]">{e.name}</div>
                    <div className="font-mono font-medium text-[10px] text-muted2 mt-1 tracking-[0.04em] uppercase">{e.listing} · {e.countries.join(" ")}</div>
                  </div>
                </div>

                <div className="font-sans text-[12px] text-body mb-3">
                  <span className="font-semibold text-ink2">Status: </span><StatusLine e={e} />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-[12px] mb-[18px]">
                  <div>
                    <div className="font-mono font-medium text-[9px] text-muted3 tracking-[0.08em] uppercase">Assurance</div>
                    <div className="font-sans text-[13px] text-ink leading-[1.2] mt-[4px]">{ASSURANCE_LABEL[e.assuranceStatus]}</div>
                  </div>
                  <div>
                    <div className="font-mono font-medium text-[9px] text-muted3 tracking-[0.08em] uppercase">Intensity denom.</div>
                    <div className="font-sans text-[13px] text-ink leading-[1.2] mt-[4px]">{e.intensityDenominator === "patient_bed_day" ? "patient-bed-day" : "—"}</div>
                  </div>
                </div>

                {e.boundaryNote && (
                  <div className="mb-3 border-l-2 border-hairline pl-3">
                    <div className="font-mono font-medium text-[9px] text-muted3 tracking-[0.08em] uppercase mb-1">Boundary note</div>
                    <p className="font-sans text-[11px] leading-[1.5] text-muted m-0">{e.boundaryNote}</p>
                  </div>
                )}

                <details className="mt-auto">
                  <summary className="font-mono text-[11px] text-muted3 cursor-pointer hover:text-muted select-none">
                    {e.dataNotes.length} data note{e.dataNotes.length > 1 ? "s" : ""} & caveats ▾
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {e.dataNotes.map((n, i) => (
                      <li key={i} className="font-sans text-[11px] text-muted leading-snug pl-3 border-l-2 border-hairline">{n}</li>
                    ))}
                  </ul>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Excluded entities */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="03" title="Excluded" descriptor="No entity-level inventory — with rationale codes" />
        <div className="border border-hairline rounded-[14px] bg-card overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-ink">
                <th className="text-left py-3 px-5 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2">Entity</th>
                <th className="text-left py-3 px-4 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2">Rationale code</th>
                <th className="text-left py-3 px-4 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 hidden sm:table-cell">Why</th>
              </tr>
            </thead>
            <tbody>
              {healthcareExcluded.map((e) => (
                <tr key={e.id} className="border-t border-hairline2">
                  <td className="py-3 px-5 font-sans font-medium text-[13px] text-ink">{e.name}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-sc">{e.rationaleCode}</td>
                  <td className="py-3 px-4 font-sans text-[11px] text-muted hidden sm:table-cell">{e.dataNotes[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-sans text-[12px] text-muted2 mt-3">
          Excluded entities never enter rankings. They are exportable via <span className="font-mono">include_excluded=true</span>,
          carrying their rationale codes — mirroring the utilities TEPCO handling.
        </p>
      </section>

      {/* Export */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="04" title="Export" descriptor="CSV / JSON with new fields" />
        <HealthcareExport />
      </section>

      {/* Sources */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="05" title="Sources & Caveats" descriptor="Where every figure comes from" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {healthcareEntities.filter((e) => e.primarySource).map((e) => (
            <div key={e.id} className="block border border-hairline rounded-[12px] bg-card p-5">
              <div className="font-serif font-semibold text-[16px] text-ink">{e.name}</div>
              <div className="font-mono font-medium text-[10px] text-muted2 mt-1.5 tracking-[0.04em] uppercase">{e.primarySource!.reportingPeriod}</div>
              <div className="font-sans text-[11px] text-muted mt-2 leading-[1.5]">{e.primarySource!.reportTitle}</div>
              {e.primarySource!.url
                ? <a href={e.primarySource!.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] mt-3 inline-block" style={{ color: e.accentColor }}>View report →</a>
                : <span className="font-mono text-[11px] mt-3 inline-block text-muted3">URL pending (Job H2)</span>}
            </div>
          ))}
        </div>
        <p className="font-sans text-[12px] text-muted2 mt-4">
          All figures come from each group&apos;s own latest official report — no estimated or third-party data in entity rows.
          Where the source spec confirmed a figure without quoting an exact page, the page is shown as “not specified” rather than
          invented. Per-entity notes &amp; caveats are in the Entity Profiles section above.
        </p>
      </section>

      <RequestFooter />
    </div>
  );
}
