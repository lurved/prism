import { Leaf, Users, Shield, Building2, Gauge, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { peerCompanies } from "@/data/peerData";

function fmtT(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toLocaleString();
}

/**
 * Snapshot tiles for the electricity-utility comparison.
 * Aggregates that would mislead (combined absolute emissions across very
 * different reporting boundaries) are flagged; honest portfolio facts are used.
 */
export function PeerSnapshot() {
  const combinedScope1and2 = peerCompanies.reduce((s, c) => s + (c.scope1 ?? 0) + (c.scope2 ?? 0), 0);
  const combinedHeadcount = peerCompanies.reduce((s, c) => s + (c.headcount ?? 0), 0);
  const assured = peerCompanies.filter((c) => c.externalAssurance === true).length;
  const allNetZero2050 = peerCompanies.every((c) => c.netZeroYear === 2050);

  const tiles = [
    { label: "Utilities Compared", value: String(peerCompanies.length), sublabel: "Meralco · CLP", icon: Building2, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Combined S1+S2", value: `${fmtT(combinedScope1and2)} tCO₂e`, sublabel: "⚠ different boundaries", icon: Leaf, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Combined Workforce", value: combinedHeadcount.toLocaleString(), sublabel: "Total employees", icon: Users, color: "text-violet-700", bg: "bg-violet-50" },
    { label: "Net-Zero Target", value: allNetZero2050 ? "2050" : "Mixed", sublabel: "Scope 1+2 (both)", icon: Gauge, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "External Assurance", value: `${assured} of ${peerCompanies.length}`, sublabel: "KPMG · DNV", icon: Shield, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Carbon Intensity", value: "0.13–0.50", sublabel: "kg CO₂e/kWh*", icon: CheckCircle2, color: "text-blue-700", bg: "bg-blue-50" },
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
