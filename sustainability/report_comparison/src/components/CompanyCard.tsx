"use client";

import { CheckCircle2, Leaf, Users, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Company } from "@/data/types";

function fmtEmissions(ktCO2e: number): string {
  if (ktCO2e >= 1_000) return `${(ktCO2e / 1_000).toFixed(1)}M tCO₂e`;
  if (ktCO2e >= 1) return `${ktCO2e.toFixed(1)}k tCO₂e`;
  return `${(ktCO2e * 1000).toFixed(0)} tCO₂e`;
}

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const { environmental: env, social, governance } = company;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: company.accentColor }}
          >
            {company.logoInitials}
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-base leading-tight">{company.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="muted">{company.sector}</Badge>
              <span className="text-xs text-slate-400">{company.reportingPeriod}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{company.strategy}</p>
      </CardHeader>

      <CardContent>
        {/* Emissions row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MetricCell
            icon={<Leaf className="w-3 h-3" />}
            sublabel="Scope 1"
            value={fmtEmissions(env.scope1Emissions)}
            color="text-slate-700"
          />
          <MetricCell
            icon={<Leaf className="w-3 h-3" />}
            sublabel="Scope 2"
            value={fmtEmissions(env.scope2Emissions)}
            color="text-slate-600"
          />
          <MetricCell
            icon={<Leaf className="w-3 h-3" />}
            sublabel="Net-Zero"
            value={String(env.netZeroTargetYear)}
            color="text-emerald-700"
          />
        </div>

        {/* Social / governance row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MetricCell
            icon={<Users className="w-3 h-3" />}
            sublabel="Female Board"
            value={`${social.femaleBoardPct}%`}
            color="text-violet-700"
          />
          <MetricCell
            icon={<Users className="w-3 h-3" />}
            sublabel="Headcount"
            value={social.totalHeadcount >= 1000
              ? `${(social.totalHeadcount / 1000).toFixed(1)}k`
              : String(social.totalHeadcount)
            }
            color="text-blue-700"
          />
          <MetricCell
            icon={<ShieldCheck className="w-3 h-3" />}
            sublabel="Training/yr"
            value={`${social.trainingHoursPerEmployee}h`}
            color="text-amber-700"
          />
        </div>

        {/* Frameworks + assurance */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-1.5 mb-3">
          {governance.reportingFrameworks.map((f) => (
            <Badge key={f} variant="outline">{f}</Badge>
          ))}
          {governance.externalAssurance && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              Assured
            </span>
          )}
        </div>

        {/* Reduction progress bar */}
        {env.scope1and2ReductionPct !== null ? (
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>S1+S2 reduction vs baseline ({company.baselineYear})</span>
              <span className="font-semibold text-emerald-700">{env.scope1and2ReductionPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(env.scope1and2ReductionPct, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <AlertCircle className="w-3 h-3" />
            Reduction vs baseline: Not disclosed
          </div>
        )}

        {/* Data source note */}
        <p className="text-[9px] text-slate-300 mt-2 leading-tight">
          Source: {company.dataSource.reportTitle}
        </p>
      </CardContent>
    </Card>
  );
}

function MetricCell({
  sublabel,
  value,
  color,
}: {
  icon: React.ReactNode;
  sublabel: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <p className="text-[10px] text-slate-400 mb-0.5 truncate">{sublabel}</p>
      <p className={`text-xs font-semibold ${color} leading-tight`}>{value}</p>
    </div>
  );
}
