/**
 * Entity profile cards — one component for all categories.
 *
 * Surfaces the GHG Protocol accounting basis on the card itself, because it is
 * what makes the numbers in the matrix interpretable. Previously it lived in
 * code comments and prose notes, where a reader never saw it.
 */
import {
  CONSOLIDATION_LABEL,
  SCOPE2_METHOD_LABEL,
  ASSURANCE_LEVEL_LABEL,
  type Entity,
} from "@/data/spine";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono font-medium text-[9px] text-muted3 tracking-[0.08em] uppercase">{label}</div>
      <div className="font-sans text-[12px] text-ink leading-[1.3] mt-[4px]">{value}</div>
    </div>
  );
}

export function EntityProfiles({ entities }: { entities: Entity[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {entities.map((e) => (
        <article key={e.id} className="border border-hairline rounded-[14px] bg-card overflow-hidden flex flex-col">
          <div className="h-1" style={{ background: e.accentColor }} />
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="w-[38px] h-[38px] rounded-[9px] text-onaccent font-mono font-semibold text-[13px] text-center leading-[38px]"
                style={{ background: e.accentColor }}
              >
                {e.logoInitials}
              </span>
              <div>
                <div className="font-serif font-semibold text-[16px] text-ink leading-[1.1]">{e.name}</div>
                <div className="font-mono font-medium text-[10px] text-muted2 mt-1 tracking-[0.04em] uppercase">
                  {e.countries.join(" ")} · {e.reportingPeriod}
                </div>
              </div>
            </div>

            <p className="font-sans text-[12px] leading-[1.5] text-body m-0 mb-4">{e.businessModel}</p>

            {/* GHG Protocol accounting basis — the thing that makes the
                numbers in the matrix mean anything. */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 mb-4 pb-4 border-b border-hairline2">
              <Field label="Boundary" value={CONSOLIDATION_LABEL[e.envelope.consolidation]} />
              <Field label="Scope 2 method" value={SCOPE2_METHOD_LABEL[e.envelope.scope2Method]} />
              <Field label="Base year" value={e.envelope.baseYear ?? "Not stated"} />
              <Field label="Assurance" value={ASSURANCE_LEVEL_LABEL[e.envelope.assurance]} />
              <Field
                label="Scope 3 cats"
                value={e.envelope.scope3Categories ? `${e.envelope.scope3Categories.length} of 15` : "Not enumerated"}
              />
              <Field label="FY end" value={e.fiscalYearEnd ?? "Not stated"} />
            </div>

            {e.boundaryNote && (
              <div className="mb-3 border-l-2 border-hairline pl-3">
                <div className="font-mono font-medium text-[9px] text-muted3 tracking-[0.08em] uppercase mb-1">
                  Boundary note
                </div>
                <p className="font-sans text-[11px] leading-[1.5] text-muted m-0">{e.boundaryNote}</p>
              </div>
            )}

            {e.reportLagNote && (
              <p className="font-sans text-[11px] leading-[1.5] text-muted2 m-0 mb-3">{e.reportLagNote}</p>
            )}

            <div className="mt-auto space-y-2">
              {e.estimationUncertainty.length > 0 && (
                <details>
                  <summary className="font-mono text-[11px] text-muted3 cursor-pointer hover:text-muted select-none">
                    {e.estimationUncertainty.length} estimation-uncertainty note
                    {e.estimationUncertainty.length > 1 ? "s" : ""} ▾
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {e.estimationUncertainty.map((n, i) => (
                      <li key={i} className="font-sans text-[11px] text-muted leading-snug pl-3 border-l-2 border-sc">
                        {n}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <details>
                <summary className="font-mono text-[11px] text-muted3 cursor-pointer hover:text-muted select-none">
                  {e.dataNotes.length} data note{e.dataNotes.length > 1 ? "s" : ""} & caveats ▾
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {e.dataNotes.map((n, i) => (
                    <li key={i} className="font-sans text-[11px] text-muted leading-snug pl-3 border-l-2 border-hairline">
                      {n}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
