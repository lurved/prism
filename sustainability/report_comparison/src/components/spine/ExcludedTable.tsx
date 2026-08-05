/**
 * Excluded & pending entities.
 *
 * Rendered on EVERY category, with an explicit "none" state. A section that
 * disappears when empty is indistinguishable from a section someone forgot;
 * an explicit "no entities excluded" is a finding a reader can rely on.
 *
 * The exclusion test is the IFRS S1 reporting-entity boundary — an entity that
 * publishes no entity-level inventory cannot be compared to ones that do, and
 * excluding it is a principled call rather than a preference.
 */
import type { Entity } from "@/data/spine";

export function ExcludedTable({ excluded, entities }: { excluded: Entity[]; entities: Entity[] }) {
  const pending = entities.filter((e) => e.status !== "populated");
  const rows = [...excluded, ...pending];

  if (rows.length === 0) {
    return (
      <div className="border border-hairline rounded-[14px] bg-card p-5">
        <p className="font-sans text-[13px] text-muted m-0">
          <span className="font-semibold text-ink2">None.</span> Every entity in this category publishes an
          entity-level inventory and is fully populated — nothing is excluded and nothing is awaiting extraction.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-hairline rounded-[14px] bg-card overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="bg-card">
              <th className="text-left py-3 px-5 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2">
                Entity
              </th>
              <th className="text-left py-3 px-4 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2">
                Status
              </th>
              <th className="text-left py-3 px-4 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2">
                Rationale code
              </th>
              <th className="text-left py-3 px-4 font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 hidden sm:table-cell">
                Why
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-hairline2">
                <td className="py-3 px-5 font-sans font-medium text-[13px] text-ink">{e.name}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-muted2">{e.status.replace(/_/g, " ")}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-sc">{e.rationaleCode ?? "—"}</td>
                <td className="py-3 px-4 font-sans text-[11px] text-muted hidden sm:table-cell">
                  {e.dataNotes[0] ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-sans text-[12px] text-muted2 mt-3 max-w-[92ch] [text-wrap:pretty]">
        Excluded entities never enter rankings or comparisons; they are carried in the export with their rationale
        codes. Pending entities are awaiting extraction from their reports — their cells render as{" "}
        <span className="font-mono">pending</span>, never as zero.
      </p>
    </>
  );
}
