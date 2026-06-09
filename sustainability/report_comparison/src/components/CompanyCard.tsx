"use client";

import { CheckCircle2, Leaf, Users, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEmissions } from "@/lib/utils";
import type { Company } from "@/data/types";

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
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MetricCell
            icon={<Leaf className="w-3.5 h-3.5" />}
            label="Scope 1"
            value={formatEmissions(env.scope1Emissions)}
            color="text-brand-700"
          />
          <MetricCell
            icon={<Leaf className="w-3.5 h-3.5" />}
            label="Scope 2"
            value={formatEmissions(env.scope2Emissions)}
            color="text-brand-600"
          />
          <MetricCell
            icon={<Leaf className="w-3.5 h-3.5" />}
            label="Net-Zero"
            value={String(env.netZeroTargetYear)}
            color="text-emerald-600"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <MetricCell
            icon={<Users className="w-3.5 h-3.5" />}
            label="Female Board"
            value={`${env.renewableEnergyPct}%`}
            sublabel="Renewable"
            color="text-blue-600"
          />
          <MetricCell
            icon={<Users className="w-3.5 h-3.5" />}
            label="Female Board"
            value={`${social.femaleBoardPct}%`}
            sublabel="Board"
            color="text-violet-600"
          />
          <MetricCell
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            label="Indep. Directors"
            value={`${governance.independentDirectorsPct}%`}
            sublabel="Indep."
            color="text-slate-600"
          />
        </div>

        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-1.5">
          {governance.reportingFrameworks.map((f) => (
            <Badge key={f} variant="outline">{f}</Badge>
          ))}
          {governance.externalAssurance && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> Assured
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Carbon reduction vs baseline ({company.baselineYear})</span>
            <span className="font-medium text-brand-700">{env.carbonReductionVsBaseline}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-brand-500 transition-all"
              style={{ width: `${env.carbonReductionVsBaseline}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCell({
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  color: string;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <p className="text-xs text-slate-400 mb-0.5 truncate">{sublabel ?? label}</p>
      <p className={`text-sm font-semibold ${color} leading-tight`}>{value}</p>
    </div>
  );
}
