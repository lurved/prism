import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PeerCompany } from "@/data/peerData";

function fmtT(v: number | null): string {
  if (v === null) return "N/D";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M tCO₂e`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k tCO₂e`;
  return `${v.toLocaleString()} tCO₂e`;
}

export function PeerCompanyCard({ company: c }: { company: PeerCompany }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: c.accentColor }}
          >
            {c.logoInitials}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base leading-tight">{c.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="muted">{c.city}</Badge>
              <span className="text-xs text-slate-400">{c.reportingPeriod}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{c.businessModel}</p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Cell label="Scope 1" value={fmtT(c.scope1)} />
          <Cell label="Scope 2" value={fmtT(c.scope2)} />
          <Cell label="Net-Zero" value={c.netZeroYear === null ? "N/D" : String(c.netZeroYear)} />
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Cell label="Female Board" value={c.femaleBoardPct === null ? "N/D" : `${c.femaleBoardPct}%`} />
          <Cell label="Headcount" value={c.headcount === null ? "N/D" : c.headcount.toLocaleString()} />
          <Cell label="Indep. Dir." value={c.independentDirectorsPct === null ? "N/D" : `${c.independentDirectorsPct}%`} />
        </div>

        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-1.5 mb-3">
          {c.frameworks.map((f) => <Badge key={f} variant="outline">{f}</Badge>)}
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            {c.externalAssurance
              ? <><CheckCircle2 className="w-3 h-3" /> Assured</>
              : <><XCircle className="w-3 h-3 text-slate-300" /> <span className="text-slate-400">Not assured</span></>}
          </span>
        </div>

        <details>
          <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 select-none">
            {c.dataNotes.length} data note{c.dataNotes.length > 1 ? "s" : ""} &amp; caveats ▾
          </summary>
          <ul className="mt-1.5 space-y-1">
            {c.dataNotes.map((n, i) => (
              <li key={i} className="text-[11px] text-slate-500 pl-3 border-l-2 border-slate-200 leading-snug">{n}</li>
            ))}
          </ul>
        </details>

        <p className="text-[9px] text-slate-300 mt-3 leading-tight">Source: {c.dataSource.reportTitle}</p>
      </CardContent>
    </Card>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <p className="text-[10px] text-slate-400 mb-0.5 truncate">{label}</p>
      <p className="text-xs font-semibold text-slate-700 leading-tight">{value}</p>
    </div>
  );
}
