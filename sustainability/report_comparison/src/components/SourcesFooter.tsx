import { ExternalLink, FileText, AlertCircle } from "lucide-react";
import { companies } from "@/data/esgData";

const REPORT_URLS: Record<string, string> = {
  sembcorp: "https://media.sembcorp.com/data/cms/ar/ar2025/index.html",
  spgroup:  "https://www.spgroup.com.sg/dam/spgroup/pdf/about-us/our-sustainability-commitment/SP-Group-Sustainability-Report-FY2023-24.pdf",
  singtel:  "https://www.singtel.com/about-us/sustainability/sustainability-reports/2025",
};

const SUPPLEMENTARY: Array<{ label: string; url: string; note: string }> = [
  {
    label: "Singtel Environmental Performance Indicators (Excel)",
    url:   "https://cdn.aws.singtel.com/sustainabilityreport/SR2024/download/downloads/Singtel-Group-SR2024-Environmental-Performance-Indicators.xlsx",
    note:  "Used to confirm FY2024 Scope 1/2/3 figures and renewable energy %",
  },
  {
    label: "Singtel People Performance Indicators (Excel)",
    url:   "https://cdn.aws.singtel.com/sustainabilityreport/SR2024/download/downloads/Singtel-Group-SR2024-People-Performance-Indicators.xlsx",
    note:  "Used to confirm headcount, training hours, female leadership %, injury rates",
  },
  {
    label: "SP Group Board of Directors",
    url:   "https://www.spgroup.com.sg/about-us/board-of-directors",
    note:  "Used to confirm board composition: 10 directors, 3 female (30%), 8 independent (80%)",
  },
  {
    label: "Singtel Corporate Governance",
    url:   "https://www.singtel.com/about-us/company/corporate-governance",
    note:  "Used to confirm 9 of 11 directors are independent (81.8%)",
  },
  {
    label: "SP Group Annual Report FY2023-24 highlights",
    url:   "https://www.spgroup.com.sg/about-us/media-resources/energy-hub/annual-report",
    note:  "Used to confirm LTIR 0.22, employee engagement 87.5%, community investment S$5.3M",
  },
];

const DATA_CAVEATS = [
  "Sembcorp (FY2025, Jan–Dec) and Singtel (FY2025, Apr–Mar 2025) use different fiscal years — figures are not from the same calendar period.",
  "SP Group FY2024-25 Sustainability Report (published Aug 2025) exists but could not be extracted — all SP Group figures reflect FY2023/24.",
  "Emissions are not comparable across sectors: Sembcorp is an energy generator (utility scale); SP Group is a grid operator; Singtel is a telecom provider.",
  "Sembcorp Scope 3 (15.3M tCO₂e) includes Category 15 Investments — a convention that significantly inflates Scope 3 relative to telecom/grid peers.",
  "Singtel FY2025 Scope 1 (13.2k tCO₂e) increased 57% YoY due to expansion of reporting scope to include Global Offices and NCS, not an actual emissions increase.",
  "SP Group Scope 1+2 total (464k tCO₂e) is dominated by hard-to-abate electricity grid transmission losses (~93%) — not comparable to direct fuel combustion in other sectors.",
  "Water consumption: available for Singtel only (618,885 m³); not disclosed in extracted data for Sembcorp or SP Group.",
  "N/D (Not Disclosed) means the metric was not found in the official published report or could not be confirmed from extracted data.",
];

export function SourcesFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 pt-8 space-y-8">
      {/* Primary sources */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          Primary Sources — Official Sustainability Reports
        </h2>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          {companies.map((c) => (
            <div key={c.id} className="flex gap-4 p-4 bg-white hover:bg-slate-50 transition-colors">
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: c.accentColor }}
              >
                {c.logoInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.dataSource.reportTitle}</p>
                  </div>
                  <a
                    href={REPORT_URLS[c.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 flex-shrink-0 mt-0.5"
                  >
                    View report
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400">
                  <span>Period: <span className="font-medium text-slate-600">{c.dataSource.reportingPeriod}</span></span>
                  <span>Accessed: <span className="font-medium text-slate-600">{c.dataSource.accessDate}</span></span>
                  <span>Sector: <span className="font-medium text-slate-600">{c.sector}</span></span>
                </div>
                {c.dataNotes.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 select-none">
                      {c.dataNotes.length} data note{c.dataNotes.length > 1 ? "s" : ""} for this company ▾
                    </summary>
                    <ul className="mt-1.5 space-y-1">
                      {c.dataNotes.map((note, i) => (
                        <li key={i} className="text-[11px] text-slate-500 pl-3 border-l-2 border-slate-200">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Supplementary sources */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          Supplementary Sources
        </h2>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          {SUPPLEMENTARY.map((s, i) => (
            <div key={i} className="flex gap-4 p-3.5 bg-white hover:bg-slate-50 transition-colors">
              <div className="w-1.5 rounded-full bg-slate-200 flex-shrink-0 self-stretch" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className="text-xs font-medium text-slate-700">{s.label}</p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 flex-shrink-0"
                  >
                    Open <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Caveats */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          Important Caveats &amp; Comparability Notes
        </h2>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <ul className="space-y-2">
            {DATA_CAVEATS.map((c, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-amber-900">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[9px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-[11px] text-slate-400 pb-6 flex flex-wrap justify-between gap-2">
        <span>
          Data extracted from official public documents via automated PDF/Excel parsing (pypdf, Python zipfile/XML).
          All figures verified against source. For investment or compliance decisions, refer directly to original reports.
        </span>
        <span className="flex-shrink-0">Built for pris.la · Temasek ESG Tracker</span>
      </div>
    </footer>
  );
}
