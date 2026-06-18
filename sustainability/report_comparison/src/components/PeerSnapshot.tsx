import { Leaf, Users, Shield, Building2, Gauge, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { peerCompanies, type PeerCompany } from "@/data/peerData";

function fmtT(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toLocaleString();
}

interface PeerSnapshotProps {
  companies?: PeerCompany[];
  groupNoun?: string;        // e.g. "Utilities" / "Banks"
}

/**
 * Data-driven snapshot tiles. Everything is computed from the dataset so the
 * same component serves any comparison set. Combined absolute emissions are
 * flagged as spanning different reporting boundaries (not a like-for-like total).
 */
export function PeerSnapshot({ companies = peerCompanies, groupNoun = "Utilities" }: PeerSnapshotProps) {
  const combinedScope1and2 = companies.reduce((s, c) => s + (c.scope1 ?? 0) + (c.scope2 ?? 0), 0);
  const combinedHeadcount = companies.reduce((s, c) => s + (c.headcount ?? 0), 0);
  const assured = companies.filter((c) => c.externalAssurance === true).length;
  const netZeroYears = companies.map((c) => c.netZeroYear).filter((y): y is number => y != null);
  const netZeroValue = netZeroYears.length && netZeroYears.every((y) => y === netZeroYears[0])
    ? String(netZeroYears[0]) : "Mixed";

  const boardPcts = companies.map((c) => c.femaleBoardPct).filter((v): v is number => v != null);
  const boardValue = boardPcts.length
    ? (Math.min(...boardPcts) === Math.max(...boardPcts)
        ? `${boardPcts[0]}%`
        : `${Math.min(...boardPcts)}–${Math.max(...boardPcts)}%`)
    : "N/D";

  const names = companies.map((c) => c.shortName).join(" · ");
  const tiles = [
    { label: `${groupNoun} Compared`, value: String(companies.length), sublabel: names, icon: Building2, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Combined S1+S2", value: `${fmtT(combinedScope1and2)} tCO₂e`, sublabel: "⚠ different boundaries", icon: Leaf, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Combined Workforce", value: combinedHeadcount.toLocaleString(), sublabel: "Total employees", icon: Users, color: "text-violet-700", bg: "bg-violet-50" },
    { label: "Net-Zero Target", value: netZeroValue, sublabel: "Scope 1+2", icon: Gauge, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "External Assurance", value: `${assured} of ${companies.length}`, sublabel: "limited assurance", icon: Shield, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Female Board", value: boardValue, sublabel: "disclosed range", icon: CheckCircle2, color: "text-blue-700", bg: "bg-blue-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <Card key={t.label} className="text-center p-0">
            <div className="p-4">
              <div className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-4 h-4 ${t.color}`} />
              </div>
              <p className={`text-base font-bold ${t.color} leading-tight`}>{t.value}</p>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.label}</p>
              <p className="text-[9px] text-slate-300 leading-tight">{t.sublabel}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
