/**
 * CATEGORY REGISTRY — the whole of what differs between the four pages.
 *
 * Adding a category is: a data file on the Entity shape, an industry pack, and
 * one entry here. Nav, subtitle, matrix, coverage panel, profiles, export and
 * methodology all read from this — no Header.tsx edit, no new components.
 */
import type { ReactNode } from "react";
import type { Entity } from "./types";
import type { PackId } from "./registry";
import {
  temasekEntities,
  utilityEntities,
  bankEntities,
  healthcareSpineEntities,
  healthcareExcludedEntities,
} from "./index";

export interface CategoryConfig {
  id: string;
  /** Nav chip label. */
  label: string;
  /** Header subtitle. */
  subtitle: string;
  href: string;
  eyebrow: string;
  /** Derived from the data, not typed by hand — see asOfFor(). */
  asOf: string;
  groupLabel: string;
  pack: PackId;
  entities: Entity[];
  excluded?: Entity[];
  hero: {
    title: ReactNode;
    standfirst: string;
    intro: ReactNode;
    aside: { title: string; body: ReactNode };
  };
  caveats: { asReported: ReactNode; comparable: ReactNode };
  slots?: { contextBanner?: ReactNode; emissions?: ReactNode };
  metaTitle: string;
  metaDescription: string;
}

/**
 * Freshness stamp derived from the data rather than hand-typed into each hero,
 * so it cannot go stale silently on the next refresh.
 */
export function asOfFor(entities: Entity[]): string {
  const stamps = entities.map((e) => e.source?.accessDate).filter(Boolean) as string[];
  const iso = stamps.filter((s) => /^\d{4}-\d{2}/.test(s)).sort().at(-1);
  if (iso) {
    const [y, m] = iso.split("-");
    const month = new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", { month: "long" });
    return `${month} ${y}`;
  }
  // Human month strings ("June 2026") — pick the latest by parsed date.
  const parsed = stamps
    .map((s) => ({ s, d: Date.parse(`1 ${s}`) }))
    .filter((x) => !Number.isNaN(x.d))
    .sort((a, b) => a.d - b.d);
  return parsed.at(-1)?.s ?? stamps[0] ?? "";
}

const ND_NA = (
  <span className="font-mono text-[14px] text-muted2">N/D = not disclosed · N/A = not applicable.</span>
);

/* ── Temasek ─────────────────────────────────────────────────────── */
const temasek: CategoryConfig = {
  id: "temasek",
  label: "Temasek",
  subtitle: "Temasek Portfolio",
  href: "/",
  eyebrow: "ESG Intelligence",
  asOf: asOfFor(temasekEntities),
  groupLabel: "companies",
  pack: "diversified",
  entities: temasekEntities,
  metaTitle: "Temasek Portfolio — ESG Comparison",
  metaDescription: "ESG comparison of Sembcorp, SMRT and Singtel against the IFRS S2 cross-industry metric set.",
  hero: {
    title: <>Temasek Portfolio, side&nbsp;by&nbsp;side.</>,
    standfirst: "Sembcorp · SMRT · Singtel — three sectors, one lens.",
    intro: (
      <>
        Environmental, social and governance data from the latest published reports of{" "}
        <strong className="font-semibold">Sembcorp Industries</strong> (FY2025),{" "}
        <strong className="font-semibold">SMRT Corporation</strong> (FY2024/25) and{" "}
        <strong className="font-semibold">Singtel Group</strong> (FY2025), mapped onto the IFRS S2 cross-industry
        metric set with GHG Protocol accounting bases attached. {ND_NA}
      </>
    ),
    aside: {
      title: "Read with care",
      body: (
        <>
          These span different sectors, fiscal years and organizational boundaries — Sembcorp reports on equity share,
          and SMRT does not state a basis at all. Absolute emissions are not comparable across them; the Comparable
          view withholds the rows where the accounting bases disagree.
        </>
      ),
    },
  },
  caveats: {
    asReported: (
      <>
        <span className="font-semibold">Every figure as each company published it.</span> Sembcorp operates at
        energy-utility scale while SMRT&apos;s footprint is dominated by Scope 2 traction electricity — larger ≠ worse.
        Use this view to understand each company&apos;s own footprint, not to rank them.
      </>
    ),
    comparable: (
      <>
        <span className="font-semibold">Only figures whose accounting bases agree.</span> Rows are withheld where the
        GHG Protocol organizational boundary or Scope 2 method differs across the set, with the reason stated. Social
        and governance metrics below are broadly comparable because they do not depend on GHG accounting basis.
      </>
    ),
  },
};

/* ── Electricity utilities ───────────────────────────────────────── */
const utility: CategoryConfig = {
  id: "utility",
  label: "Utility",
  subtitle: "Electricity Utility",
  href: "/infra",
  eyebrow: "Electricity Utilities",
  asOf: asOfFor(utilityEntities),
  groupLabel: "utilities",
  pack: "utilities",
  entities: utilityEntities,
  metaTitle: "Electricity Utility — ESG Comparison",
  metaDescription: "ESG comparison of Meralco, CLP and National Grid against the IFRS S2 cross-industry metric set.",
  hero: {
    title: <>Wires &amp; watts, side&nbsp;by&nbsp;side.</>,
    standfirst: "Meralco · CLP · National Grid — three grids, one lens.",
    intro: (
      <>
        Environmental, social and governance data for electricity utilities —{" "}
        <strong className="font-semibold">Meralco</strong> (FY2024), <strong className="font-semibold">CLP</strong>{" "}
        (FY2025) and <strong className="font-semibold">National Grid</strong> (FY2025/26), taken only from each
        company&apos;s latest official report. {ND_NA}
      </>
    ),
    aside: {
      title: "Read with care",
      body: (
        <>
          These differ sharply in business model, scale and accounting basis — Meralco and CLP report on equity share,
          National Grid on operational control. Under the GHG Protocol those absolute emissions are not comparable,
          and the Comparable view says so rather than leaving it to a footnote.
        </>
      ),
    },
  },
  caveats: {
    asReported: (
      <>
        <span className="font-semibold">Do not rank these absolute numbers against each other.</span> Meralco
        (Philippines distribution + MGen generation), CLP (Asia-centric vertically integrated group) and National Grid
        (a much larger UK + US T&amp;D group) have very different boundaries and scales.
      </>
    ),
    comparable: (
      <>
        <span className="font-semibold">Reported intensity units differ</span> (tCO₂e/GWh, kg CO₂e/kWh, tCO₂e/£M
        revenue). The <span className="font-semibold">Normalised intensity</span> row uses kg CO₂e/kWh (Scope 1+2)
        only where it is disclosed or an exact conversion — never by inventing a denominator.
      </>
    ),
  },
};

/* ── Banks ───────────────────────────────────────────────────────── */
const banks: CategoryConfig = {
  id: "banks",
  label: "Banks",
  subtitle: "Singapore Banks",
  href: "/banks",
  eyebrow: "Singapore Banks",
  asOf: asOfFor(bankEntities),
  groupLabel: "banks",
  pack: "banks",
  entities: bankEntities,
  metaTitle: "Banks — ESG Comparison",
  metaDescription: "ESG comparison of DBS, OCBC and UOB against the IFRS S2 cross-industry metric set.",
  hero: {
    title: <>The big three, side&nbsp;by&nbsp;side.</>,
    standfirst: "DBS · OCBC · UOB — three banks, one lens.",
    intro: (
      <>
        Environmental, social and governance data for Singapore&apos;s three largest banks —{" "}
        <strong className="font-semibold">DBS</strong>, <strong className="font-semibold">OCBC</strong> and{" "}
        <strong className="font-semibold">UOB</strong> (all FY2024), taken only from each bank&apos;s latest official
        report. All three dual-report Scope 2 on both location and market bases. {ND_NA}
      </>
    ),
    aside: {
      title: "What matters for a bank",
      body: (
        <>
          Operational Scope 1/2 are negligible; the material impact is <em>financed emissions</em> (Scope 3 Cat 15).
          None of the three publishes an aggregate financed-emissions figure — a gap against IFRS S2&apos;s
          industry-based guidance for commercial banks, not merely missing data.
        </>
      ),
    },
  },
  caveats: {
    asReported: (
      <>
        <span className="font-semibold">These are operational emissions only — and tiny for a bank.</span> The Scope 3
        shown is operational; financed emissions dominate but are tracked by sector rather than aggregated. Totals
        understate true impact and should not be ranked.
      </>
    ),
    comparable: (
      <>
        <span className="font-semibold">All three dual-report Scope 2</span>, so the location- and market-based rows
        are genuinely like-for-like — the gap between them is the effect of renewable energy certificates.
        Carbon-intensity units still differ (per-income, per-ft², per-m²) and are not cross-comparable.
      </>
    ),
  },
};

/* ── Healthcare ──────────────────────────────────────────────────── */
const healthcare: CategoryConfig = {
  id: "healthcare",
  label: "Healthcare",
  subtitle: "Healthcare",
  href: "/healthcare",
  eyebrow: "Healthcare",
  asOf: asOfFor(healthcareSpineEntities),
  groupLabel: "entities",
  pack: "healthcare",
  entities: healthcareSpineEntities,
  excluded: healthcareExcludedEntities,
  metaTitle: "Healthcare — ESG Comparison",
  metaDescription:
    "ESG comparison of IHH Healthcare, Thomson Medical and Raffles Medical against the IFRS S2 cross-industry metric set.",
  hero: {
    title: <>Listed care groups, side&nbsp;by&nbsp;side.</>,
    standfirst: "IHH · Thomson Medical · Raffles Medical — one lens, no guesses.",
    intro: (
      <>
        Entity-level GHG for listed healthcare groups — <strong className="font-semibold">IHH Healthcare</strong>,{" "}
        <strong className="font-semibold">Raffles Medical</strong> and{" "}
        <strong className="font-semibold">Thomson Medical</strong>. The boundary is the listed group reporting entity,
        per IFRS S1 — not individual hospital campuses. {ND_NA}
      </>
    ),
    aside: {
      title: "No interpolation",
      body: (
        <>
          Blank beats guessed. Intensity uses each group&apos;s own published kg CO₂e/patient-bed-day — never a ratio
          we compute. Singapore public hospitals publish no entity-level inventory and fail the IFRS S1
          reporting-entity test, so they are excluded rather than estimated.
        </>
      ),
    },
  },
  caveats: {
    asReported: (
      <>
        <span className="font-semibold">Figures as each group published them.</span> IHH reports a combined Scope 1+2
        market-based total without a split; Raffles reports Scope 1 and 2 separately with no Scope 3; Thomson&apos;s
        absolutes are pending extraction. Blank cells are blank, never zero.
      </>
    ),
    comparable: (
      <>
        <span className="font-semibold">Only IHH publishes a patient-bed-day intensity</span>, and it is cited to the
        report without a recorded page, so it ranks as <span className="font-semibold">reported</span> rather than
        page-verified. Raffles and Thomson report on revenue denominators. No best-performer badge renders.
      </>
    ),
  },
};

export const CATEGORIES: CategoryConfig[] = [temasek, utility, banks, healthcare];

export const getCategory = (id: string): CategoryConfig | undefined => CATEGORIES.find((c) => c.id === id);
