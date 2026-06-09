import { companies, aggregateTotals } from "@/data/esgData";
import { CompanyCard } from "@/components/CompanyCard";
import { EsgChart } from "@/components/EsgChart";
import { formatEmissions, formatNumber } from "@/lib/utils";
import { Leaf, Users, Shield, TrendingDown, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { totalScope1, totalScope2, totalHeadcount, avgFemaleBoard, avgRenewable, allExternallyAssured } =
    aggregateTotals;

  const summaryStats = [
    {
      label: "Total Scope 1 Emissions",
      value: formatEmissions(totalScope1),
      sublabel: "Across all 3 companies",
      icon: Leaf,
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
    {
      label: "Total Scope 2 Emissions",
      value: formatEmissions(totalScope2),
      sublabel: "Market-based",
      icon: TrendingDown,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Combined Workforce",
      value: formatNumber(totalHeadcount),
      sublabel: "Total employees",
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Avg Female Board Rep.",
      value: `${avgFemaleBoard}%`,
      sublabel: "Portfolio average",
      icon: Users,
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
    {
      label: "Avg Renewable Energy",
      value: `${avgRenewable}%`,
      sublabel: "Portfolio average",
      icon: Leaf,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "External Assurance",
      value: allExternallyAssured ? "100%" : "Partial",
      sublabel: "All reports assured",
      icon: Shield,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
          Temasek Portfolio · ESG Intelligence
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Sustainability Tracker
        </h1>
        <p className="text-slate-500 text-sm max-w-xl">
          Aggregated environmental, social, and governance performance across Sembcorp, SP Group, and Singtel — Temasek portfolio companies reporting under international ESG frameworks.
        </p>
      </div>

      {/* Summary Stats */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Portfolio Snapshot
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center p-0">
                <div className="p-4">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className={`text-lg font-bold ${stat.color} leading-tight`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{stat.label}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Net-Zero Targets */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Net-Zero Commitments
        </h2>
        <Card>
          <CardContent className="pt-5">
            <div className="relative">
              {/* Timeline axis */}
              <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-200" />
              <div className="flex justify-around relative">
                {companies.map((c) => (
                  <div key={c.id} className="flex flex-col items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md z-10"
                      style={{ backgroundColor: c.accentColor }}
                    >
                      {c.logoInitials}
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-800 text-sm">{c.environmental.netZeroTargetYear}</p>
                      <p className="text-xs text-slate-400">{c.shortName}</p>
                      <p className="text-xs text-brand-600 font-medium mt-0.5">
                        −{c.environmental.carbonReductionVsBaseline}% vs {c.baselineYear}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-300 mt-4 pt-3 border-t border-slate-100">
                <span>2040</span>
                <span>2045 ← earliest</span>
                <span>2050 → latest</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Chart */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Emissions Visualisation
        </h2>
        <EsgChart companies={companies} />
      </section>

      {/* Company Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Company Profiles
          </h2>
          <a
            href="/sustainability/report_comparison/compare"
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            Full comparison →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-400 flex flex-wrap gap-4 justify-between">
        <span>Data sourced from public sustainability reports (FY2023–FY2024). For reference only.</span>
        <span>Built for pris.la · Temasek ESG Tracker</span>
      </footer>
    </div>
  );
}
