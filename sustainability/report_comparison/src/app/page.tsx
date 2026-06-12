import { companies, aggregateTotals } from "@/data/esgData";
import { CompanyCard } from "@/components/CompanyCard";
import { EsgChart } from "@/components/EsgChart";
import { formatNumber } from "@/lib/utils";
import { Leaf, Users, Shield, TrendingDown, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function fmtKt(ktCO2e: number): string {
  if (ktCO2e >= 1_000) return `${(ktCO2e / 1_000).toFixed(1)}M tCO₂e`;
  return `${ktCO2e.toFixed(0)}k tCO₂e`;
}

export default function DashboardPage() {
  const { totalScope1ktCO2e, totalScope2ktCO2e, totalHeadcount, avgFemaleBoard, earliestNetZero } =
    aggregateTotals;

  const summaryStats = [
    {
      label: "Combined Scope 1",
      value: fmtKt(totalScope1ktCO2e),
      sublabel: "3 companies (ktCO₂e)",
      icon: Leaf,
      color: "text-slate-700",
      bg: "bg-slate-100",
    },
    {
      label: "Combined Scope 2",
      value: fmtKt(totalScope2ktCO2e),
      sublabel: "Market-based",
      icon: TrendingDown,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Combined Workforce",
      value: formatNumber(totalHeadcount),
      sublabel: "Total employees",
      icon: Users,
      color: "text-violet-700",
      bg: "bg-violet-50",
    },
    {
      label: "Avg Female Board",
      value: `${avgFemaleBoard}%`,
      sublabel: "Portfolio average",
      icon: Users,
      color: "text-pink-700",
      bg: "bg-pink-50",
    },
    {
      label: "Earliest Net-Zero",
      value: String(earliestNetZero),
      sublabel: "Singtel — all scopes",
      icon: Leaf,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "External Assurance",
      value: "2 of 3",
      sublabel: "Sembcorp & Singtel",
      icon: Shield,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Temasek Portfolio · ESG Intelligence
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Sustainability Tracker</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Environmental, social, and governance data sourced directly from the latest published sustainability
          reports of Sembcorp Industries (FY2025), SP Group (FY2023/24), and Singtel Group (FY2025).
          All figures are verified. <span className="font-medium text-slate-700">N/D = not disclosed in official report.</span>
        </p>
      </div>

      {/* Data accuracy notice */}
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <span className="font-semibold">Data source note:</span> Sembcorp and Singtel use different fiscal years (Jan–Dec and Apr–Mar respectively).
          SP Group data reflects FY2023/24 — their FY2024/25 report (published Aug 2025) was inaccessible for automated extraction.
          Emissions metrics are <span className="font-semibold">not directly comparable across sectors</span> — Sembcorp operates at energy utility scale.
        </div>
      </div>

      {/* Summary Stats */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Portfolio Snapshot</h2>
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

      {/* Net-Zero Targets */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Net-Zero Commitments</h2>
        <Card>
          <CardContent className="pt-5">
            <div className="relative">
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
                      <p className="text-xs text-slate-500">{c.shortName}</p>
                      {c.environmental.scope1and2ReductionPct !== null && (
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                          −{c.environmental.scope1and2ReductionPct.toFixed(1)}% vs {c.baselineYear}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-slate-300 mt-4 pt-3 border-t border-slate-100">
                <span>← More ambitious</span>
                <span>2045 Singtel · 2050 Sembcorp &amp; SP Group</span>
                <span>Less ambitious →</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Chart */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Emissions Visualisation</h2>
        <EsgChart companies={companies} />
      </section>

      {/* Company Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Profiles</h2>
          <a
            href="/sustainability/report_comparison/compare/"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
          >
            Full comparison matrix →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="mt-10 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Data Sources</h3>
        <div className="space-y-2">
          {companies.map((c) => (
            <div key={c.id} className="flex gap-3 text-xs">
              <div
                className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: c.accentColor }}
              >
                {c.logoInitials}
              </div>
              <div>
                <span className="font-medium text-slate-700">{c.dataSource.reportTitle}</span>
                <span className="text-slate-400"> · {c.dataSource.reportingPeriod} · Accessed {c.dataSource.accessDate}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-400 flex flex-wrap gap-4 justify-between">
        <span>All data sourced from official company sustainability/annual reports. For reference only — verify against original source documents.</span>
        <span>Built for pris.la · Temasek ESG Tracker</span>
      </footer>
    </div>
  );
}
