/**
 * IFRS S2 cross-industry disclosure coverage.
 *
 * Counts what each entity itself discloses against the seven S2 ¶29
 * cross-industry metric categories. It estimates nothing — which is why it can
 * be a headline on a site whose governing constraint is "no interpolation",
 * where a combined cross-sector emissions total (correctly demoted to "context
 * only") cannot.
 *
 * A low score is a finding about the DISCLOSURE, not a judgement about the
 * entity's climate performance. The panel says so.
 */
import { S2_COVERAGE, s2Coverage, type Entity } from "@/data/spine";

export function CoveragePanel({ entities }: { entities: Entity[] }) {
  const results = entities.map(s2Coverage);

  return (
    <div>
      <div className="overflow-x-auto border border-hairline rounded-[14px] bg-card">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="text-left py-4 px-5 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 w-72">
                S2 ¶29 cross-industry metric
              </th>
              {results.map((r) => (
                <th key={r.entityId} className="text-center py-[14px] px-3 font-sans font-semibold text-[13px] text-ink">
                  {r.shortName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {S2_COVERAGE.map((cat) => (
              <tr key={cat.id} className="border-t border-hairline2">
                <td className="py-[11px] px-5 align-top">
                  <div className="font-sans font-medium text-[13px] text-ink leading-[1.25]">
                    ({cat.id}) {cat.label}
                  </div>
                  <div className="font-mono text-[10px] text-muted3 mt-[2px]">{cat.ref}</div>
                </td>
                {results.map((r) => {
                  const covered = r.covered.includes(cat.id);
                  return (
                    <td key={r.entityId} className="py-[11px] px-3 text-center align-middle">
                      <span
                        className={`font-mono text-[13px] ${covered ? "text-good" : "text-nd"}`}
                        title={covered ? "Disclosed" : "Not disclosed"}
                      >
                        {covered ? "●" : "○"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-hairline">
              <td className="py-[13px] px-5 font-sans font-semibold text-[13px] text-ink">Coverage</td>
              {results.map((r) => (
                <td key={r.entityId} className="py-[13px] px-3 text-center">
                  <span className="font-serif font-medium text-[22px] text-ink leading-none">{r.score}</span>
                  <span className="font-mono text-[11px] text-muted2"> / {r.total}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-hairline2 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] text-muted2">
          <span>● disclosed</span>
          <span>○ not disclosed</span>
          <span>Counts disclosure, not performance.</span>
        </div>
      </div>
      <p className="font-sans text-[12px] leading-[1.55] text-muted2 mt-3 max-w-[86ch] [text-wrap:pretty]">
        This measures how much of the IFRS S2 cross-industry metric set each entity actually publishes — nothing is
        estimated or scored on our side. A low count is a statement about the <em>disclosure</em>, not about the
        entity&apos;s emissions or its climate strategy. Categories (b), (c), (e) and (f) — transition risk, physical
        risk, capital deployment and internal carbon price — are where this corpus is thinnest.
      </p>
    </div>
  );
}
