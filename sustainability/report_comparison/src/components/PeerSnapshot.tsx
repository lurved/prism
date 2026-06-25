import { peerCompanies, type PeerCompany } from "@/data/peerData";

function fmtT(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toLocaleString();
}

interface PeerSnapshotProps {
  companies?: PeerCompany[];
  groupNoun?: string;
}

export function PeerSnapshot({ companies = peerCompanies, groupNoun = "Utilities" }: PeerSnapshotProps) {
  const combinedScope1and2 = companies.reduce((s, c) => s + (c.scope1 ?? 0) + (c.scope2 ?? 0), 0);
  const combinedHeadcount = companies.reduce((s, c) => s + (c.headcount ?? 0), 0);
  const assured = companies.filter((c) => c.externalAssurance === true).length;
  const netZeroYears = companies.map((c) => c.netZeroYear).filter((y): y is number => y != null);
  const netZeroValue = netZeroYears.length && netZeroYears.every((y) => y === netZeroYears[0]) ? String(netZeroYears[0]) : "Mixed";
  const boardPcts = companies.map((c) => c.femaleBoardPct).filter((v): v is number => v != null);
  const boardValue = boardPcts.length
    ? (Math.min(...boardPcts) === Math.max(...boardPcts) ? `${boardPcts[0]}%` : `${Math.min(...boardPcts)}–${Math.max(...boardPcts)}%`)
    : "N/D";

  const tiles = [
    { value: String(companies.length), unit: "", label: `${groupNoun} Compared`, sub: companies.map((c) => c.shortName).join(" · ") },
    { value: fmtT(combinedScope1and2), unit: "tCO₂e", label: "Combined S1+S2", sub: "⚠ different boundaries" },
    { value: combinedHeadcount.toLocaleString(), unit: "", label: "Combined Workforce", sub: "Total employees" },
    { value: netZeroValue, unit: "", label: "Net-Zero Target", sub: "Scope 1+2" },
    { value: `${assured} / ${companies.length}`, unit: "", label: "External Assurance", sub: "limited assurance" },
    { value: boardValue, unit: "", label: "Female Board", sub: "disclosed range" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-hairline border border-hairline rounded-[12px] overflow-hidden">
      {tiles.map((t) => (
        <div key={t.label} className="bg-card px-5 py-[22px]">
          <div className="font-serif font-medium text-[34px] leading-[1] text-ink tracking-[-0.01em]">
            {t.value}{t.unit && <span className="font-mono font-medium text-[12px] text-muted2 ml-[5px]">{t.unit}</span>}
          </div>
          <div className="font-sans font-semibold text-[12px] leading-[1.3] text-ink2 mt-[13px]">{t.label}</div>
          <div className="font-sans text-[11px] leading-[1.3] text-muted2 mt-[3px]">{t.sub}</div>
        </div>
      ))}
    </div>
  );
}
