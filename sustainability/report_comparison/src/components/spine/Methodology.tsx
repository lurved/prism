/**
 * Methodology + legend — ONE component, identical on every category page.
 *
 * Previously the methodology block existed on the Temasek page only, so the
 * rigour behind the whole site was invisible on three pages out of four. It
 * also now states the framework basis of each tier, which is a considerably
 * stronger claim than "we don't estimate".
 */

export function Legend() {
  return (
    <div className="border border-hairline rounded-[12px] bg-card px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[10px] text-muted2">
      <span className="text-good">✅ confirmed — page recorded</span>
      <span className="text-muted2">• reported — from the report, no page</span>
      <span className="text-sc">⚠️ estimated — third-party, never ranked</span>
      <span className="text-nd">❌ / N/D — not disclosed</span>
      <span className="text-nd">N/A — does not apply</span>
      <span className="text-muted3 italic">pending — report not yet read</span>
      <span className="inline-flex items-center gap-1">
        <span className="w-[7px] h-[7px] rounded-full bg-good" />
        best performer — envelopes agree
      </span>
    </div>
  );
}

const ITEMS: { title: string; body: React.ReactNode }[] = [
  {
    title: "No value is inferred",
    body: (
      <>
        Every figure comes from an entity&apos;s own latest published report and carries a citation. Nothing is
        estimated, interpolated or filled: a metric the report does not disclose is <span className="font-mono">N/D</span>{" "}
        — never zero, never a computed substitute. A metric that cannot apply to a business model is{" "}
        <span className="font-mono">N/A</span> with a stated reason, which is a different fact from a disclosure gap.
      </>
    ),
  },
  {
    title: "What the rows are, and whose standard they answer to",
    body: (
      <>
        Tier 1 is <strong className="font-semibold">IFRS S2&apos;s cross-industry metric categories</strong> (¶29 a–g)
        plus its target disclosures — not our own selection. Tier 2 is <strong className="font-semibold">GRI</strong>
        -anchored, because IFRS S2 is climate-only and does not cover the social and governance rows. Tier 3 is the
        industry pack, following S2&apos;s industry-based guidance. Every row is labelled with the standard it answers
        to, and rows marked <span className="font-mono">House</span> are our own construct.
      </>
    ),
  },
  {
    title: "Emissions accounting follows the GHG Protocol",
    body: (
      <>
        Each entity carries its accounting basis — organizational boundary (equity share vs control), Scope 2 method
        (the 2015 guidance expects both location- and market-based), which of the 15 Scope 3 categories are included,
        base year and recalculation notes, and assurance level. All emissions are stored in tCO₂e.
      </>
    ),
  },
  {
    title: "Comparability is derived, not asserted",
    body: (
      <>
        Two figures may be compared only when their accounting bases agree. The <em>Comparable</em> view withholds a row
        whose entities report on different boundaries or Scope 2 methods, and states which field differs — so a missing
        badge is explained rather than merely absent. Ranking a single entity is never a comparison.
      </>
    ),
  },
];

export function Methodology() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 max-w-[96ch]">
        {ITEMS.map((it) => (
          <div key={it.title}>
            <h3 className="font-sans font-semibold text-[14px] text-ink mb-1.5">{it.title}</h3>
            <p className="font-sans text-[13px] leading-[1.6] text-muted m-0 [text-wrap:pretty]">{it.body}</p>
          </div>
        ))}
      </div>
      <p className="font-sans text-[11px] leading-[1.55] text-muted3 mt-5 max-w-[96ch] [text-wrap:pretty]">
        Framework references are recorded so the basis of each row is traceable. They should be checked against the
        current text of the standards before being relied on.
      </p>
    </div>
  );
}
