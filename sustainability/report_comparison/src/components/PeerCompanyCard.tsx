import type { PeerCompany } from "@/data/peerData";
import { peerMetricValue } from "@/lib/peerMetrics";
import { CitedValue } from "./CitedValue";

function fmtT(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

export function PeerCompanyCard({ company: c }: { company: PeerCompany }) {
  // Each headline stat is routed through <CitedValue> so no figure is uncited.
  const stats: { label: string; value: number | null; unit: string; display: (v: number) => string }[] = [
    { label: "Scope 1", value: c.scope1, unit: "tCO₂e", display: fmtT },
    { label: "Scope 2", value: c.scope2, unit: "tCO₂e", display: fmtT },
    { label: "Net-Zero", value: c.netZeroYear, unit: "year", display: (v) => String(v) },
    { label: "Fem. Board", value: c.femaleBoardPct, unit: "%", display: (v) => `${v}%` },
    { label: "Headcount", value: c.headcount, unit: "employees", display: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)) },
    { label: "Indep. Dir.", value: c.independentDirectorsPct, unit: "%", display: (v) => `${v}%` },
  ];

  return (
    <article className="border border-hairline rounded-[14px] bg-card overflow-hidden flex flex-col">
      <div className="h-1" style={{ background: c.accentColor }} />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-[38px] h-[38px] rounded-[9px] text-onaccent font-mono font-semibold text-[13px] text-center leading-[38px]" style={{ background: c.accentColor }}>{c.logoInitials}</span>
          <div>
            <div className="font-serif font-semibold text-[16px] text-ink leading-[1.1]">{c.name}</div>
            <div className="font-mono font-medium text-[10px] text-muted2 mt-1 tracking-[0.04em] uppercase">{c.city} · {c.reportingPeriod}</div>
          </div>
        </div>

        <p className="font-sans text-[13px] leading-[1.6] text-body m-0 mb-[18px] [text-wrap:pretty]">{c.businessModel}</p>

        <div className="grid grid-cols-3 gap-x-3 gap-y-[14px] mb-[18px]">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-mono font-medium text-[9px] text-muted3 tracking-[0.08em] uppercase">{s.label}</div>
              <div className="font-serif font-medium text-[17px] text-ink leading-[1.1] mt-[5px]">
                <CitedValue
                  mv={peerMetricValue(c, s.value, s.unit)}
                  plain
                  display={s.value !== null ? s.display(s.value) : undefined}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {c.frameworks.map((f) => (
            <span key={f} className="font-mono font-medium text-[10px] text-muted bg-chip rounded-[5px] px-2 py-[5px]">{f}</span>
          ))}
          {c.externalAssurance && (
            <span className="font-mono font-medium text-[10px] text-good rounded-[5px] px-2 py-[5px]" style={{ background: "rgba(63,122,82,0.1)" }}>Assured</span>
          )}
        </div>

        <details className="mt-auto">
          <summary className="font-mono text-[11px] text-muted3 cursor-pointer hover:text-muted select-none">
            {c.dataNotes.length} data note{c.dataNotes.length > 1 ? "s" : ""} & caveats ▾
          </summary>
          <ul className="mt-2 space-y-1.5">
            {c.dataNotes.map((n, i) => (
              <li key={i} className="font-sans text-[11px] text-muted leading-snug pl-3 border-l-2 border-hairline">{n}</li>
            ))}
          </ul>
        </details>
      </div>
    </article>
  );
}
