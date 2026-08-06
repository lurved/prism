/**
 * ANALYST BRIEF — what an investor needs before using any of these numbers.
 *
 * Three things, in the order an analyst asks them:
 *   1. Is this current?         (stale rows are called out first, loudly)
 *   2. How much can I use?      (decision-usefulness mix per entity)
 *   3. What do I ask?           (engagement questions derived from the gaps)
 *
 * Everything here is derived from the disclosure itself. Nothing scores the
 * entity's climate performance — a company with a small footprint and poor
 * disclosure grades badly here, and that is the intended reading.
 */
import {
  entityUsability,
  engagementQuestions,
  isStale,
  LATEST_AVAILABLE,
  USABILITY_BLURB,
  USABILITY_LABEL,
  type Usability,
} from "@/data/spine/usability";
import { rowsForPack, type Entity, type PackId } from "@/data/spine";

const GRADE_TONE: Record<Usability, string> = {
  high: "bg-good",
  moderate: "bg-sm",
  limited: "bg-sc",
  not_usable: "bg-hairline",
};

const GRADE_TEXT: Record<Usability, string> = {
  high: "text-good",
  moderate: "text-ink2",
  limited: "text-sc",
  not_usable: "text-nd",
};

export function AnalystBrief({ entities, pack }: { entities: Entity[]; pack: PackId }) {
  const rows = rowsForPack(pack);
  const stale = entities.filter(isStale);

  return (
    <div className="space-y-6">
      {/* 1. Currency — the first thing that invalidates an analysis */}
      {stale.length > 0 && (
        <div className="border border-sc rounded-[12px] bg-card p-5">
          <div className="font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-sc mb-2">
            Superseded data
          </div>
          <p className="font-sans text-[13px] leading-[1.6] text-ink2 m-0 max-w-[92ch] [text-wrap:pretty]">
            {stale.map((e) => `${e.shortName} (${e.reportingPeriod} → ${LATEST_AVAILABLE[e.id]})`).join(" · ")}.
            A more recent report exists for {stale.length === 1 ? "this entity" : "these entities"}, so the figures
            shown are <strong className="font-semibold">not current</strong> and every figure on those rows is graded
            down accordingly. They are shown rather than removed because the prior-period figures remain the entity&apos;s
            own published disclosure — but they should not carry a current investment view.
          </p>
        </div>
      )}

      {/* 2. Decision-usefulness mix */}
      <div>
        <div className="overflow-x-auto border border-hairline rounded-[14px] bg-card">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr>
                <th className="text-left py-4 px-5 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 w-44">
                  Entity
                </th>
                <th className="text-left py-4 px-4 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2">
                  Decision-usefulness of disclosed figures
                </th>
                <th className="text-right py-4 px-5 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 w-32">
                  Usable
                </th>
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => {
                const u = entityUsability(e, rows);
                const disclosed = u.counts.high + u.counts.moderate + u.counts.limited;
                return (
                  <tr key={e.id} className="border-t border-hairline2">
                    <td className="py-[13px] px-5 align-middle">
                      <div className="font-sans font-medium text-[13px] text-ink">{e.shortName}</div>
                      <div className="font-mono text-[10px] text-muted3 mt-[2px]">
                        {e.reportingPeriod}
                        {u.stale && <span className="text-sc"> · superseded</span>}
                      </div>
                    </td>
                    <td className="py-[13px] px-4 align-middle">
                      <div className="flex h-[9px] w-full rounded-full overflow-hidden bg-chip" title={`${disclosed} disclosed figures`}>
                        {(["high", "moderate", "limited"] as const).map((g) =>
                          u.counts[g] > 0 ? (
                            <div
                              key={g}
                              className={GRADE_TONE[g]}
                              style={{ width: `${(u.counts[g] / Math.max(disclosed, 1)) * 100}%` }}
                              title={`${USABILITY_LABEL[g]}: ${u.counts[g]}`}
                            />
                          ) : null,
                        )}
                      </div>
                      <div className="flex gap-x-4 mt-1.5 font-mono text-[10px] text-muted3">
                        <span className={GRADE_TEXT.high}>high {u.counts.high}</span>
                        <span className={GRADE_TEXT.moderate}>moderate {u.counts.moderate}</span>
                        <span className={GRADE_TEXT.limited}>limited {u.counts.limited}</span>
                        <span className={GRADE_TEXT.not_usable}>none {u.counts.not_usable}</span>
                      </div>
                    </td>
                    <td className="py-[13px] px-5 text-right align-middle">
                      <span className="font-serif font-medium text-[22px] text-ink leading-none">{u.usableShare}</span>
                      <span className="font-mono text-[11px] text-muted2">%</span>
                      {/* The denominator matters: 100% of 5 disclosed figures is
                          a very different statement from 100% of 30. */}
                      <div className="font-mono text-[10px] text-muted3 mt-[3px]">of {disclosed} disclosed</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-hairline2 font-mono text-[10px] text-muted2">
            &ldquo;Usable&rdquo; = high + moderate, as a share of figures the entity discloses at all. Read the share
            WITH its denominator — a high percentage over few disclosures is thin coverage, not strong reporting.
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 mt-3 max-w-[96ch]">
          {(["high", "moderate", "limited", "not_usable"] as const).map((g) => (
            <div key={g} className="font-sans text-[11px] leading-[1.5] text-muted">
              <span className={`font-semibold ${GRADE_TEXT[g]}`}>{USABILITY_LABEL[g]}</span> — {USABILITY_BLURB[g]}
            </div>
          ))}
        </div>
        <p className="font-sans text-[12px] leading-[1.55] text-muted2 mt-3 max-w-[92ch] [text-wrap:pretty]">
          This grades the <em>disclosure</em>, not the entity&apos;s climate performance. A company with low emissions
          and thin reporting will grade poorly here; one with a large footprint and rigorous, assured reporting will
          grade well. Conflating the two is the most common failure mode in ESG scoring, and this table is built to
          avoid it.
        </p>
      </div>

      {/* 3. Engagement questions */}
      <div>
        <div className="font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 mb-3">
          Questions this disclosure leaves open
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entities.map((e) => {
            const qs = engagementQuestions(e);
            return (
              <div key={e.id} className="border border-hairline rounded-[12px] bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-[8px] h-[8px] rounded-full" style={{ background: e.accentColor }} />
                  <span className="font-serif font-semibold text-[15px] text-ink">{e.shortName}</span>
                  <span className="font-mono text-[10px] text-muted3">{qs.length} open</span>
                </div>
                {qs.length === 0 ? (
                  <p className="font-sans text-[12px] text-muted m-0">
                    No structural gaps — the accounting basis, assurance and cross-industry metrics are all disclosed.
                  </p>
                ) : (
                  <ol className="space-y-3 m-0 pl-0 list-none">
                    {qs.map((q, i) => (
                      <li key={i}>
                        <div className="font-sans font-semibold text-[11px] text-ink2">{q.topic}</div>
                        <p className="font-sans text-[11px] leading-[1.5] text-muted mt-[3px] m-0 [text-wrap:pretty]">
                          {q.question}
                        </p>
                        <div className="font-mono text-[9px] text-muted3 mt-[3px]">{q.basis}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
        <p className="font-sans text-[12px] leading-[1.55] text-muted2 mt-3 max-w-[92ch] [text-wrap:pretty]">
          Derived from what each report does not say, phrased as questions to put to the company. A gap is only worth
          recording if it converts into something you can act on.
        </p>
      </div>
    </div>
  );
}
