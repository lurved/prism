import { companies, aggregateTotals } from "@/data/esgData";
import { CompanyCard } from "@/components/CompanyCard";
import { EsgChart } from "@/components/EsgChart";
import { MetricTable } from "@/components/MetricTable";
import { SourcesFooter } from "@/components/SourcesFooter";
import { RequestCta } from "@/components/RequestCta";
import { SectionHeading } from "@/components/ui/section";
import { formatNumber } from "@/lib/utils";
import { Leaf, Users, Shield, TrendingDown, CheckCircle2, Gauge, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

function fmtKt(ktCO2e: number): string {
  if (ktCO2e >= 1_000) return `${(ktCO2e / 1_000).toFixed(1)}M tCO₂e`;
  return `${ktCO2e.toFixed(0)}k tCO₂e`;
}

export default function TemasekPage() {
  const { totalScope1ktCO2e, totalScope2ktCO2e, totalHeadcount, avgFemaleBoard, earliestNetZero } =
    aggregateTotals;

  const summaryStats = [
    { label: "Combined Scope 1", value: fmtKt(totalScope1ktCO2e), sublabel: "3 companies (ktCO₂e)", icon: Leaf, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Combined Scope 2", value: fmtKt(totalScope2ktCO2e), sublabel: "Market-based", icon: TrendingDown, color: "text-blue-700", bg: "bg-blue-50" },
    { label: "Combined Workforce", value: formatNumber(totalHeadcount), sublabel: "Total employees", icon: Users, color: "text-violet-700", bg: "bg-violet-50" },
    { label: "Avg Female Board", value: `${avgFemaleBoard}%`, sublabel: "Portfolio average", icon: Users, color: "text-pink-700", bg: "bg-pink-50" },
    { label: "Earliest Net-Zero", value: String(earliestNetZero), sublabel: "Singtel — all scopes", icon: Gauge, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "External Assurance", value: "2 of 3", sublabel: "Sembcorp & Singtel", icon: Shield, color: "text-amber-700", bg: "bg-amber-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* 1 — Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Temasek Portfolio · ESG Intelligence
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Temasek Portfolio</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Environmental, social, and governance data sourced directly from the latest published reports of
          Sembcorp Industries (FY2025), SMRT Corporation (FY2024/25), and Singtel Group (FY2025).
          All figures are verified. <span className="font-medium text-slate-700">N/D = not disclosed in official report.</span>
        </p>
      </div>

      {/* Accuracy notice */}
      <div className="mb-8 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <span className="font-semibold">Data source note:</span> these companies span different sectors (energy, transport, telecom) and fiscal years (Sembcorp Jan–Dec; SMRT &amp; Singtel Apr–Mar).
          Emissions metrics are <span className="font-semibold">not directly comparable across sectors</span> — Sembcorp operates at energy-utility scale, while SMRT is a mass-transit operator whose emissions are dominated by Scope 2 traction electricity.
        </div>
      </div>

      {/* 2 — Snapshot */}
      <section className="mb-8">
        <SectionHeading>Snapshot</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center p-0">
                <div className="p-4">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className={`text-base font-bold ${stat.color} leading-tight`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{stat.label}</p>
                  <p className="text-[9px] text-slate-300 leading-tight">{stat.sublabel}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3 — Emissions Visualisation */}
      <section className="mb-8">
        <SectionHeading>Emissions Visualisation</SectionHeading>
        <EsgChart companies={companies} />
      </section>

      {/* 4 — Comparison Matrix */}
      <section className="mb-8">
        <SectionHeading>Comparison Matrix</SectionHeading>
        <MetricTable companies={companies} />
      </section>

      {/* 5 — Company Profiles */}
      <section className="mb-8">
        <SectionHeading>Company Profiles</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>

      {/* 6 — Sources & Caveats */}
      <section className="mb-8">
        <SectionHeading>Sources &amp; Caveats</SectionHeading>
        <SourcesFooter />
      </section>

      {/* CTA */}
      <RequestCta />
    </div>
  );
}
