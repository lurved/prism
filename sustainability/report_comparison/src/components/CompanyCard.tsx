import type { Company } from "@/data/types";

function fmtEm(ktCO2e: number): string {
  if (ktCO2e >= 1_000) return `${(ktCO2e / 1_000).toFixed(1)}M`;
  if (ktCO2e >= 1) return `${ktCO2e.toFixed(1)}k`;
  return `${(ktCO2e * 1000).toFixed(0)}`;
}
function fmtHead(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function CompanyCard({ company: c }: { company: Company }) {
  const { environmental: env, social, governance } = c;
  const reduction = env.scope1and2ReductionPct;

  const stats: [string, string][] = [
    ["Scope 1", fmtEm(env.scope1Emissions)],
    ["Scope 2", fmtEm(env.scope2Emissions)],
    ["Net-Zero", String(env.netZeroTargetYear)],
    ["Fem. Board", social.femaleBoardPct === null ? "N/D" : `${social.femaleBoardPct}%`],
    ["Headcount", fmtHead(social.totalHeadcount)],
    ["Train/yr", `${social.trainingHoursPerEmployee}h`],
  ];

  return (
    <article className="border border-hairline rounded-[14px] bg-card overflow-hidden flex flex-col">
      <div className="h-1" style={{ background: c.accentColor }} />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-[38px] h-[38px] rounded-[9px] text-white font-mono font-semibold text-[13px] text-center leading-[38px]"
            style={{ background: c.accentColor }}>{c.logoInitials}</span>
          <div>
            <div className="font-serif font-semibold text-[17px] text-ink leading-[1.1]">{c.name}</div>
            <div className="font-mono font-medium text-[10px] text-muted2 mt-1 tracking-[0.06em] uppercase">{c.sector} · {c.reportingPeriod}</div>
          </div>
        </div>

        <p className="font-sans text-[13px] leading-[1.6] text-body m-0 mb-[18px] [text-wrap:pretty] line-clamp-3">{c.strategy}</p>

        <div className="grid grid-cols-3 gap-x-3 gap-y-[14px] mb-[18px]">
          {stats.map(([label, value]) => (
            <div key={label}>
              <div className="font-mono font-medium text-[9px] text-muted3 tracking-[0.08em] uppercase">{label}</div>
              <div className="font-serif font-medium text-[17px] text-ink leading-[1.1] mt-[5px]">{value}</div>
            </div>
          ))}
        </div>

        {/* Reduction bar */}
        <div className="mb-[18px]">
          <div className="flex justify-between font-mono font-medium text-[11px] text-muted mb-[7px]">
            <span>S1+S2 reduction vs {c.baselineYear}</span>
            <span className={reduction === null ? "text-muted3" : "text-good"}>{reduction === null ? "Not disclosed" : `${reduction.toFixed(1)}%`}</span>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden bg-track">
            {reduction === null ? (
              <div className="h-full w-full" style={{ backgroundImage: "repeating-linear-gradient(45deg,#D8D0BF 0 5px,transparent 5px 10px)" }} />
            ) : (
              <div className="h-full bg-good" style={{ width: `${Math.min(reduction, 100)}%` }} />
            )}
          </div>
        </div>

        {/* Frameworks + assurance chips */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {governance.reportingFrameworks.map((f) => (
            <span key={f} className="font-mono font-medium text-[10px] text-muted bg-chip rounded-[5px] px-2 py-[5px]">{f}</span>
          ))}
          {governance.externalAssurance ? (
            <span className="font-mono font-medium text-[10px] text-good rounded-[5px] px-2 py-[5px]" style={{ background: "rgba(63,122,82,0.1)" }}>
              Assured{governance.externalAssuranceProvider ? ` · ${governance.externalAssuranceProvider.split("(")[0].trim().replace(/—.*/, "").trim()}` : ""}
            </span>
          ) : (
            <span className="font-mono font-medium text-[10px] text-sm rounded-[5px] px-2 py-[5px]" style={{ background: "rgba(176,71,61,0.1)" }}>No external assurance</span>
          )}
        </div>
      </div>
    </article>
  );
}
