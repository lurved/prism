/**
 * THE PAGE CONTRACT.
 *
 * Every category renders these sections, in this order, with this numbering —
 * including empty states, which is what keeps the numbering stable across
 * tabs. Previously each page had its own section inventory: methodology
 * appeared on one page of four, export on two, and the numbering shifted
 * between tabs, so a reader had to relearn the page each time.
 *
 * A category is now a config object (see data/spine/categories.tsx), not a
 * bespoke file. Category-specific richness that predates the template — the
 * emissions panel, the healthcare context banner — is passed through as a
 * slot rather than being lost.
 */
import { SectionHead } from "@/components/SectionHead";
import { RequestFooter } from "@/components/RequestCta";
import { ComparisonMatrix } from "./ComparisonMatrix";
import { CoveragePanel } from "./CoveragePanel";
import { AnalystBrief } from "./AnalystBrief";
import { Legend, Methodology } from "./Methodology";
import { SpineExport } from "./SpineExport";
import { EntityProfiles } from "./EntityProfiles";
import { ExcludedTable } from "./ExcludedTable";
import type { CategoryConfig } from "@/data/spine/categories";

export function CategoryPage({ config }: { config: CategoryConfig }) {
  const { hero, entities, excluded = [], pack } = config;

  return (
    <div>
      {/* ── Hero ── */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 sm:pt-[74px] pb-13">
        <div className="font-mono font-medium text-[11px] tracking-[0.18em] uppercase text-sm mb-6">
          {config.eyebrow} · {config.asOf}
        </div>
        <h1 className="font-serif font-semibold text-ink m-0 mb-2 tracking-[-0.02em] max-w-[16ch] leading-[1.0] text-[clamp(40px,6.4vw,72px)]">
          {hero.title}
        </h1>
        <div className="font-serif italic text-[22px] leading-[1.3] text-muted2 mb-[38px]">{hero.standfirst}</div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-8 lg:gap-[52px] items-start">
          <p className="font-sans text-[18px] leading-[1.65] text-ink2 m-0 max-w-[62ch] [text-wrap:pretty]">
            {hero.intro}
          </p>
          <aside className="border-l-2 border-sm pl-[18px] py-1 font-sans text-[13px] leading-[1.6] text-muted [text-wrap:pretty]">
            <span className="block font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-sm mb-[9px]">
              {hero.aside.title}
            </span>
            {hero.aside.body}
          </aside>
        </div>
        <div className="mt-8">
          <Legend />
        </div>
      </section>

      {/* ── Optional category-specific banner (kept as a slot) ── */}
      {config.slots?.contextBanner && (
        <section className="max-w-page mx-auto px-5 sm:px-8 pb-2">{config.slots.contextBanner}</section>
      )}

      {/* ── 01 Disclosure coverage — IFRS S2 ¶29 ── */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-6 pb-2">
        <SectionHead index="01" title="Disclosure Coverage" descriptor="Against the IFRS S2 cross-industry metric set" />
        <CoveragePanel entities={entities} />
      </section>

      {/* ── 02 Analyst brief — can these numbers be used, and what to ask ── */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="02" title="Analyst Brief" descriptor="Decision-usefulness, currency & open questions" />
        <AnalystBrief entities={entities} pack={pack} />
      </section>

      {/* ── 03 Emissions ── */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="03" title="Emissions" descriptor="Absolute gross GHG, as reported · GHG Protocol basis" />
        {config.slots?.emissions ?? (
          <p className="font-sans text-[13px] text-muted2 border border-hairline rounded-[12px] bg-card p-5 m-0">
            No multi-year emissions series is available for this category — the entities publish single-year figures.
            Absolute emissions for the latest year are in the comparison matrix below.
          </p>
        )}
      </section>

      {/* ── 03 Comparison matrix ── */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="04" title="Comparison Matrix" descriptor="Two views: as-reported & comparable" />
        <ComparisonMatrix
          entities={entities}
          pack={pack}
          groupLabel={config.groupLabel}
          caveats={config.caveats}
        />
      </section>

      {/* ── 04 Entity profiles ── */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="05" title="Entity Profiles" descriptor="Boundary, accounting basis & data notes" />
        <EntityProfiles entities={entities} />
      </section>

      {/* ── 05 Excluded & pending — always present, "None" when empty ── */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="06" title="Excluded & Pending" descriptor="With rationale codes" />
        <ExcludedTable excluded={excluded} entities={entities} />
      </section>

      {/* ── 06 Methodology — identical on every page ── */}
      <section id="methodology" className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2 scroll-mt-24">
        <SectionHead index="07" title="Methodology" descriptor="How to read this comparison" />
        <Methodology />
      </section>

      {/* ── 07 Export ── */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="08" title="Export" descriptor="One CSV/JSON schema across all categories" />
        <SpineExport entities={entities} pack={pack} categoryId={config.id} />
      </section>

      {/* ── 08 Sources ── */}
      <section className="max-w-page mx-auto px-5 sm:px-8 pt-14 pb-2">
        <SectionHead index="09" title="Sources & Caveats" descriptor="Where every figure comes from" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entities
            .filter((e) => e.source)
            .map((e) => {
              const s = e.source!;
              const inner = (
                <>
                  <div className="font-serif font-semibold text-[16px] text-ink">{e.name}</div>
                  <div className="font-mono font-medium text-[10px] text-muted2 mt-1.5 tracking-[0.04em] uppercase">
                    {s.reportingPeriod}
                  </div>
                  <div className="font-sans text-[11px] text-muted mt-2 leading-[1.5]">{s.reportTitle}</div>
                  {s.url ? (
                    <div className="font-mono text-[11px] mt-3" style={{ color: e.accentColor }}>
                      View report →
                    </div>
                  ) : (
                    <div className="font-mono text-[11px] mt-3 text-muted3">URL not recorded</div>
                  )}
                </>
              );
              return s.url ? (
                <a
                  key={e.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-hairline rounded-[12px] bg-card p-5 hover:bg-card transition-colors"
                >
                  {inner}
                </a>
              ) : (
                <div key={e.id} className="block border border-hairline rounded-[12px] bg-card p-5">
                  {inner}
                </div>
              );
            })}
        </div>
        <p className="font-sans text-[12px] text-muted2 mt-4 max-w-[92ch] [text-wrap:pretty]">
          All figures come from each entity&apos;s own latest official report — no estimated or third-party data in
          entity rows. Per-entity notes and caveats are in the Entity Profiles section above.
        </p>
      </section>

      <RequestFooter />
    </div>
  );
}
