import { companies } from "@/data/esgData";

const REPORT_URLS: Record<string, string> = {
  sembcorp: "https://media.sembcorp.com/data/cms/ar/ar2025/index.html",
  smrt:     "https://www.smrt.com.sg/getmedia/8cd6126b-4f4f-49d4-819e-f7ae4aae0117/SMRT-Sustainability-Report-2024_25.pdf",
  singtel:  "https://www.singtel.com/about-us/sustainability/sustainability-reports/2025",
};

const NOTES = [
  "These companies span different sectors (energy, transport, telecom) and fiscal years (Sembcorp Jan–Dec; SMRT & Singtel Apr–Mar) — figures are not from the same calendar period.",
  "Emissions are not comparable across sectors: Sembcorp is an energy generator (utility scale); SMRT is a mass-transit operator; Singtel is a telecom provider.",
  "Sembcorp Scope 3 (15.3M tCO₂e) includes Category 15 Investments — a convention that significantly inflates Scope 3 relative to transport/telecom peers.",
  "Singtel FY2025 Scope 1 rose ~57% YoY due to an expansion of reporting scope (Global Offices + NCS), not an actual increase in emissions.",
  "SMRT's largest source is Scope 2 traction electricity (>50% of total); emissions have risen with network expansion, so no reduction-vs-baseline is shown (target: −20% vs 2022 by 2030).",
  "SMRT reports its injury rate per 100,000 employees, a different basis from the per-million-hours LTIR used by the others — shown as N/D to avoid a misleading comparison.",
  "GHG-intensity units differ by sector (per-MWh, per-revenue, per-TB) and are not comparable.",
  "N/D (not disclosed) means the metric was not found in the official published report or could not be confirmed from extracted data.",
];

export function SourcesFooter() {
  return (
    <div>
      {/* Source cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-9">
        {companies.map((c) => (
          <a key={c.id} href={REPORT_URLS[c.id]} target="_blank" rel="noopener noreferrer"
            className="block border border-hairline rounded-[12px] bg-card p-5 hover:bg-[#F4F0E6] transition-colors">
            <div className="font-serif font-semibold text-[16px] text-ink">{c.name}</div>
            <div className="font-mono font-medium text-[10px] text-muted2 mt-1.5 tracking-[0.04em] uppercase">
              {c.dataSource.reportingPeriod} · {c.sector}
            </div>
            <div className="font-mono text-[11px] mt-4" style={{ color: c.accentColor }}>View report →</div>
          </a>
        ))}
      </div>

      {/* Comparability notes */}
      <div className="font-mono font-semibold text-[10px] tracking-[0.14em] uppercase text-muted2 mb-4">Comparability notes</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
        {NOTES.map((n, i) => (
          <div key={i} className="flex gap-3">
            <span className="font-mono text-[11px] text-[#C9C2B2] flex-shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
            <p className="font-sans text-[13px] leading-[1.55] text-muted m-0">{n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
