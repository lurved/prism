/**
 * HEALTHCARE VERTICAL — verified data layer.
 *
 * PRIME DIRECTIVE (non-negotiable, mirrors peerData.ts):
 *  - No interpolation. Blank > guessed. Every figure carries a source flag:
 *      "confirmed" ✅  |  "estimated" ⚠️  |  "unverified" ❌
 *  - A value with NO page-level citation cannot be rendered ✅ — it degrades to ❌
 *    (see §3 of the build spec: "No page → no citation popover → ❌ badge").
 *  - Intensity is NEVER derived by us. We only store an entity's OWN published
 *    ratio (with citation), or the raw numerator + denominator separately.
 *    We never invent a denominator to compute a cross-entity intensity.
 *  - "pending" entity/metric states render as pending — they are NOT zeros.
 *
 * ENTITY BOUNDARY: listed-group reporting entity (GHG Protocol organizational
 * boundary at consolidated level), NOT individual hospital campuses. Singapore
 * public hospitals / clusters publish no entity-level GHG Protocol inventory and
 * are therefore EXCLUDED with rationale code EXCLUDED_NO_ENTITY_INVENTORY (the
 * healthcare analogue of the utilities EXCLUDED_GROUP_BUNDLING code).
 *
 * NOTE ON PAGE NUMBERS: where the build spec confirmed a figure (✅) but did not
 * quote an exact page, `page` is left null and `pageNote` records that the page
 * was not specified in the spec. No page number has been invented. Job H3 (IHH
 * absolute backfill) will attach exact pages when the extraction pipeline runs.
 */

export type Sector = "utilities" | "healthcare";

export type SourceFlag = "confirmed" | "estimated" | "unverified";

export type AssuranceStatus =
  | "external_limited"
  | "external_reasonable"
  | "internal_only"
  | "none"
  | "unknown";

export type IntensityDenominator = "patient_bed_day" | "gwh" | "km_network" | null;

export type RationaleCode =
  | "EXCLUDED_NO_ENTITY_INVENTORY"
  | "EXCLUDED_GROUP_BUNDLING"
  | null;

export type Scope2Method = "location_based" | "market_based" | "unknown" | null;

/** Lifecycle state of an entity row in the comparison. */
export type EntityStatus =
  | "populated"            // fully seeded from confirmed disclosure
  | "pending_extraction"  // some confirmed metrics; emissions await pipeline job
  | "pending_verification" // nothing seeded yet; report not yet fetched
  | "excluded";           // no entity-level inventory — carries rationaleCode

export interface Citation {
  reportTitle: string;
  fy: string;
  /** null = exact page not specified in the source spec (see file header). */
  page: number | null;
  pageNote?: string;
  url: string | null;
  /** SGX / SEC filing announcement date — the report-date stamp. */
  reportDateStamp: string | null;
  assuranceStatus: AssuranceStatus;
  scope2Method: Scope2Method;
}

export interface MetricValue {
  /** Numeric value, or null when not disclosed / not yet extracted. */
  value: number | null;
  /** For text metrics (Scope 2 method, Scope 3 coverage, target wording). */
  display?: string;
  unit: string;
  year: string | null;
  flag: SourceFlag;
  /** null citation ⇒ effectively ❌ regardless of `flag` (enforced at render). */
  citation: Citation | null;
  note?: string;
}

export interface HealthcareEntity {
  id: string;
  name: string;
  shortName: string;
  listing: string;
  logoInitials: string;
  accentColor: string;
  sector: Sector;
  status: EntityStatus;
  countries: string[];
  boundaryNote: string | null;
  rationaleCode: RationaleCode;
  /** Entity-level assurance posture for the latest cycle. */
  assuranceStatus: AssuranceStatus;
  scope2Method: Scope2Method;
  intensityDenominator: IntensityDenominator;
  frameworks: string[] | null;
  primarySource: {
    reportTitle: string;
    reportingPeriod: string;
    url: string | null;
    accessDate: string;
  } | null;
  /** Keyed by canonical metric key (see METRIC_ROWS). Absent key = not reported. */
  metrics: Record<string, MetricValue>;
  dataNotes: string[];
}

/** Sector-context callout — an academic study estimate, NEVER a comparison row. */
export interface ContextBanner {
  title: string;
  body: string;
  value: string;
  flag: SourceFlag; // "estimated" — third-party study
  flagLabel: string;
  source: { title: string; url: string; date: string };
}

/* ════════════════════════════════════════════════════════════════════════
   IHH HEALTHCARE BERHAD — ✅ populated
   Bursa Malaysia + SGX secondary. Sources: IHH Sustainability Report 2025
   (SGX filing) + SR 2024. Multi-country group (MY, SG, IN, TR, CN, BN, BG,
   RS, NL). Scope 2 = location-based. 2024–25 rows are internal_only
   (SR 2025 not externally assured; external assurance targeted FY2027).
   ════════════════════════════════════════════════════════════════════════ */
const IHH_SR2025: Citation = {
  reportTitle: "IHH Sustainability Report 2025 (SGX filing, Part 1)",
  fy: "FY2025",
  page: null,
  pageNote: "Page not specified in build spec; Job H3 to attach exact page.",
  url: "https://links.sgx.com/1.0.0/corporate-announcements/N9NJBCPX473TDDMI/", // SGX announcement (spec URL truncated)
  reportDateStamp: null,
  assuranceStatus: "internal_only",
  scope2Method: "location_based",
};
const IHH_SR2024: Citation = {
  reportTitle: "IHH Sustainability Report 2024",
  fy: "FY2024",
  page: null,
  pageNote: "Page not specified in build spec.",
  url: "https://www.ihhhealthcare.com/", // ihhhealthcare.com/docs/... (spec URL truncated)
  reportDateStamp: null,
  assuranceStatus: "external_limited", // SG + MY only, 2022–23
  scope2Method: "location_based",
};

const ihh: HealthcareEntity = {
  id: "ihh",
  name: "IHH Healthcare Berhad",
  shortName: "IHH",
  listing: "Bursa + SGX",
  logoInitials: "IH",
  accentColor: "#1F7A8C",
  sector: "healthcare",
  status: "populated",
  countries: ["MY", "SG", "IN", "TR", "CN", "BN", "BG", "RS", "NL"],
  boundaryNote:
    "Multi-country group (MY, SG, IN, TR, CN, BN, BG, RS, NL). Location-based Scope 2 is flattered by low-carbon grids (e.g. Singapore); see grid-intensity caveat.",
  rationaleCode: null,
  assuranceStatus: "internal_only", // for the latest (2024–25) cycle
  scope2Method: "location_based",
  intensityDenominator: "patient_bed_day",
  frameworks: ["GRI", "SGX Core ESG"],
  primarySource: {
    reportTitle: "IHH Sustainability Report 2025 (SGX) + SR 2024",
    reportingPeriod: "FY2022 / FY2024 / FY2025",
    url: "https://links.sgx.com/1.0.0/corporate-announcements/N9NJBCPX473TDDMI/",
    accessDate: "July 2026",
  },
  metrics: {
    // Entity's OWN published Scope 1+2 intensity (kg CO₂e / patient-bed-day).
    // Published ratio — NOT derived by us. Denominator = patient_bed_day.
    intensity_2022: {
      value: 151.5,
      unit: "kg CO₂e/patient-bed-day",
      year: "2022",
      flag: "confirmed",
      citation: IHH_SR2025,
    },
    intensity_2025: {
      value: 146.0,
      unit: "kg CO₂e/patient-bed-day",
      year: "2025",
      flag: "confirmed",
      citation: IHH_SR2025,
    },
    scope2_method: {
      value: null,
      display: "Location-based",
      unit: "",
      year: null,
      flag: "confirmed",
      citation: { ...IHH_SR2025, pageNote: "SR 2025 footnote (page not specified in spec)." },
    },
    scope3_coverage: {
      value: null,
      display: "Categories 3, 5, 6, 7 (FY2025); Cat 1, 2, 15 identified material but not yet reported",
      unit: "",
      year: "2025",
      flag: "confirmed",
      citation: { ...IHH_SR2025, pageNote: "SR 2025 — Scope 3 coverage note (page not specified in extract)." },
    },
    // Combined Scope 1+2 (market-based) — the report gives the COMBINED total only,
    // not a Scope 1 / Scope 2 split, so it is stored as a combined metric (never split).
    scope1and2_abs: {
      value: 271_888,
      unit: "tCO₂e",
      year: "2025",
      flag: "confirmed",
      citation: { ...IHH_SR2025, pageNote: "SR 2025 — 'Scope 1 and 2 emissions (market-based) were 271,888 tCO2e in FY2025'." },
      note: "Combined Scope 1+2, MARKET-BASED. FY2025 271,888 tCO₂e vs 2022 baseline 277,628 tCO₂e. The report does not break out Scope 1 and Scope 2 separately; note the intensity figures are location-based.",
    },
    target_2030: {
      value: -42,
      display: "−42% Scope 1+2 vs 2025 baseline",
      unit: "%",
      year: "2030",
      flag: "confirmed",
      citation: { ...IHH_SR2025, reportTitle: "IHH SR 2025 / AGM (announced Apr 2026)" },
      note: "Announced Apr 2026.",
    },
    // Separate Scope 1 / Scope 2 absolutes: the SR discloses only the COMBINED
    // market-based total (see scope1and2_abs); it does not split them → blank.
    scope1_abs: {
      value: null,
      unit: "tCO₂e",
      year: null,
      flag: "unverified",
      citation: null,
      note: "Report discloses only the combined Scope 1+2 market-based total (see Scope 1+2 absolute); no separate Scope 1 figure.",
    },
    scope2_abs: {
      value: null,
      unit: "tCO₂e",
      year: null,
      flag: "unverified",
      citation: null,
      note: "Report discloses only the combined Scope 1+2 market-based total (see Scope 1+2 absolute); no separate Scope 2 figure.",
    },
    scope3_abs: {
      value: null,
      unit: "tCO₂e",
      year: null,
      flag: "unverified",
      citation: null,
      note: "Scope 3 reported by category coverage only (Cats 3, 5, 6, 7); no consolidated absolute tCO₂e disclosed.",
    },
  },
  dataNotes: [
    "Scope 1+2 GHG intensity 151.5 (2022) → 146.0 (2025) kg CO₂e/patient-bed-day, per SR 2025.",
    "Scope 2 is LOCATION-BASED. Multi-country grid mix (esp. Singapore's low grid carbon intensity) flatters location-based Scope 2 — same class of flag as utilities normalization.",
    "Combined Scope 1+2 (market-based) = 271,888 tCO₂e in FY2025, below the 2022 baseline of 277,628 tCO₂e (SR 2025). The report gives the combined total only — Scope 1 and Scope 2 are NOT split, so they are left blank rather than derived.",
    "Scope 3 coverage (FY2025): Categories 3, 5, 6, 7. Categories 1, 2 and 15 are identified as material but not yet reported — Cat 15 blank under the toggle is correct (no special-casing). No consolidated absolute Scope 3 tCO₂e is disclosed.",
    "2030 target: −42% Scope 1+2 vs a 2025 baseline (SBTi-referenced), announced Apr 2026.",
    "Assurance: Scope 1+2 limited assurance SG + MY only (2022–23). SR 2025 is NOT externally assured; external assurance targeted FY2027. 2024–25 rows are internal_only.",
    "Job H3: combined Scope 1+2 backfilled from SR 2025 narrative; separate Scope 1/2 and absolute Scope 3 remain undisclosed in the report.",
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   THOMSON MEDICAL GROUP LTD — ⚠️ pending extraction
   SGX. Licensed beds confirmed from FY2025 AR body. All emissions/energy
   metrics BLANK until pipeline job H1 completes. FY ends 30 June.
   Consolidates TMC Life Sciences Berhad (~70%, Bursa-listed) — nested listed
   entity; boundary/double-report check required before any ranking.
   ════════════════════════════════════════════════════════════════════════ */
const TMG_AR2025: Citation = {
  reportTitle: "TMG FY2025 Annual Report",
  fy: "FY2025 (ended 30 Jun 2025)",
  page: null,
  pageNote: "Beds disclosed in AR body; SR section pp. 54–100.",
  url: "https://assets.contentstack.io/v3/assets/blt5f400315f9e4f0b3/bltd205dd522a9f83c8/68ddc3e7a12b70af3c9d77c2/TMG_AGM_FY2025_-_FY2025_Annual_Report.pdf",
  reportDateStamp: null,
  assuranceStatus: "unknown",
  scope2Method: null,
};

const tmg: HealthcareEntity = {
  id: "tmg",
  name: "Thomson Medical Group Ltd",
  shortName: "TMG",
  listing: "SGX",
  logoInitials: "TM",
  accentColor: "#8C5A2B",
  sector: "healthcare",
  status: "pending_extraction",
  countries: ["SG", "MY", "VN"],
  boundaryNote:
    "Consolidates TMC Life Sciences Berhad (~70%, Bursa-listed) — nested listed subsidiary. Check whether TMCLS files its own SR and whether figures double-report before TMG enters any ranking.",
  rationaleCode: null,
  assuranceStatus: "unknown",
  scope2Method: null,
  // TMG reports Scope 1+2 intensity PER REVENUE (three currencies), NOT per
  // patient-bed-day — so it is not on the comparable bed-day denominator (null).
  intensityDenominator: null,
  frameworks: ["GRI", "TCFD"],
  primarySource: {
    reportTitle: "TMG FY2025 Annual Report (SR section pp. 54–100)",
    reportingPeriod: "FY2025 (ended 30 Jun 2025)",
    url: TMG_AR2025.url,
    accessDate: "July 2026",
  },
  metrics: {
    beds_sg: {
      value: 187,
      unit: "licensed beds",
      year: "30 Jun 2025",
      flag: "confirmed",
      citation: TMG_AR2025,
    },
    beds_my: {
      value: 403,
      unit: "licensed beds",
      year: "30 Jun 2025",
      flag: "confirmed",
      citation: TMG_AR2025,
    },
    beds_vn: {
      value: 230,
      unit: "licensed beds",
      year: "30 Jun 2025",
      flag: "confirmed",
      citation: TMG_AR2025,
    },
    // Emissions/energy/intensity: ❌ blank until Job H1 verifies the SR section.
    intensity_2025: {
      value: null,
      unit: "kg CO₂e/patient-bed-day",
      year: null,
      flag: "unverified",
      citation: null,
      note: "TMG does not report a per-patient-bed-day intensity. It reports Scope 1+2 intensity PER REVENUE, by entity (AR2025 p.57): TMPL 0.0126 tCO₂e/S$'000, TMCLS 0.0415 tCO₂e/RM'000, FEMVN 0.0416 tCO₂e/VND 10M — not comparable on the bed-day basis.",
    },
    scope1_abs: { value: null, unit: "tCO₂e", year: null, flag: "unverified", citation: null, note: "No consolidated absolute Scope 1 tCO₂e disclosed in AR2025 (only per-revenue intensity is reported)." },
    scope2_abs: { value: null, unit: "tCO₂e", year: null, flag: "unverified", citation: null, note: "No consolidated absolute Scope 2 tCO₂e disclosed in AR2025; Scope 2 method not stated." },
    scope3_abs: { value: null, unit: "tCO₂e", year: null, flag: "unverified", citation: null, note: "No Scope 3 disclosed in AR2025." },
  },
  dataNotes: [
    "Licensed beds confirmed from AR body: Singapore 187, Malaysia 403, Vietnam 230 (as at 30 Jun 2025).",
    "Job H1 done (AR2025, SR section): TMG reports Scope 1+2 emissions intensity PER REVENUE, in three separate currencies per entity (p.57) — TMPL 0.0126 tCO₂e/S$'000, TMCLS 0.0415 tCO₂e/RM'000, FEMVN 0.0416 tCO₂e/VND 10M. This is NOT a patient-bed-day intensity, so it is not comparable with IHH; intensityDenominator set to null.",
    "No consolidated absolute Scope 1/2/3 tCO₂e is disclosed in AR2025 (only the per-revenue intensity). GHG measurement has begun under a TCFD framing (p.73); Scope 2 method not stated. Absolutes therefore remain blank, not zero.",
    "Commitment to Net Zero emissions by 2050 stated in the SR narrative (no interim quantified target disclosed).",
    "Frameworks: GRI (305/403/416 referenced) and TCFD (climate-risk assessment begun).",
    "Nested listed subsidiary TMC Life Sciences Berhad (~70%, Bursa-listed): boundary/double-report check required before TMG appears in any ranking.",
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   RAFFLES MEDICAL GROUP — ❌ pending verification (nothing seeded)
   SGX-mandated SR must exist; Scope figures unverified this cycle.
   Zero values entered until fetched via SGX filings (Job H2).
   ════════════════════════════════════════════════════════════════════════ */
const rmg: HealthcareEntity = {
  id: "rmg",
  name: "Raffles Medical Group",
  shortName: "RMG",
  listing: "SGX",
  logoInitials: "RM",
  accentColor: "#6B665C",
  sector: "healthcare",
  status: "pending_verification",
  countries: ["SG"],
  boundaryNote: null,
  rationaleCode: null,
  assuranceStatus: "unknown",
  scope2Method: null,
  intensityDenominator: null,
  frameworks: null,
  primarySource: {
    reportTitle: "Latest RMG Sustainability Report (via SGX filings — URL TBD by Job H2)",
    reportingPeriod: "TBD",
    url: null,
    accessDate: "July 2026",
  },
  metrics: {},
  dataNotes: [
    "Nothing seeded. SGX-mandated SR presumed to exist but Scope figures unverified this cycle — DO NOT seed any numbers.",
    "Job H2: locate latest SR via SGX company announcements (do not trust third-party mirrors); record framework, Scope 2 method, assurance, intensity denominator.",
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   EXCLUDED — Singapore public hospitals / clusters
   No entity-level GHG Protocol inventory; cluster "Impact Reports" are
   narrative-only. rationaleCode = EXCLUDED_NO_ENTITY_INVENTORY.
   Rendered as excluded (never in rankings); exportable via include_excluded.
   ════════════════════════════════════════════════════════════════════════ */
const excludedEntities: HealthcareEntity[] = [
  ["sgh", "Singapore General Hospital", "SGH"],
  ["ttsh", "Tan Tock Seng Hospital", "TTSH"],
  ["nuh", "National University Hospital", "NUH"],
].map(([id, name, shortName]) => ({
  id,
  name,
  shortName,
  listing: "Public (unlisted)",
  logoInitials: shortName.slice(0, 2).toUpperCase(),
  accentColor: "#A8A294",
  sector: "healthcare" as const,
  status: "excluded" as const,
  countries: ["SG"],
  boundaryNote: "Hospital campus / cluster — not a listed group reporting entity.",
  rationaleCode: "EXCLUDED_NO_ENTITY_INVENTORY" as const,
  assuranceStatus: "none" as const,
  scope2Method: null,
  intensityDenominator: null,
  frameworks: null,
  primarySource: null,
  metrics: {},
  dataNotes: [
    "Excluded: publishes no entity-level GHG Protocol inventory; cluster 'Impact Reports' are narrative-only.",
    "Same rationale class as the utilities TEPCO Power Grid exclusion (EXCLUDED_GROUP_BUNDLING → healthcare code EXCLUDED_NO_ENTITY_INVENTORY).",
  ],
}));

/** Entities that appear in the comparison (excluded ones are handled separately). */
export const healthcareEntities: HealthcareEntity[] = [ihh, tmg, rmg];

/** Excluded entities — only surface via export (include_excluded=true). */
export const healthcareExcluded: HealthcareEntity[] = excludedEntities;

/* ── MOH / MOHH / NUS CoSM national-study context banner ──
   ≈ 4.1 Mt CO₂e/yr system-wide. Academic study estimate — ⚠️ Estimated.
   NEVER enters comparison math, rankings, or entity-row exports. */
export const mohContextBanner: ContextBanner = {
  title: "Singapore healthcare system — context estimate",
  body:
    "MOH + MOHH + NUS Centre of Sustainable Medicine, “Delivering Quality Care Sustainably in Singapore” (Sept 2025), estimates the national healthcare system at ≈ 4.1 Mt CO₂e/yr, system-wide. This is a third-party academic study estimate, not any entity's own disclosure — it is context only and never enters comparison, rankings, or entity-row exports.",
  value: "≈ 4.1 Mt CO₂e/yr",
  flag: "estimated",
  flagLabel: "Estimated (third-party study)",
  source: {
    title: "MOH/MOHH/NUS CoSM — Delivering Quality Care Sustainably in Singapore (Sept 2025)",
    url: "https://www.moh.gov.sg/others/resources-and-statistics/delivering-quality-care-sustainably-in-singapore/",
    date: "Sept 2025",
  },
};

/* ── Flag presentation helpers ── */
export const FLAG_META: Record<SourceFlag, { icon: string; label: string }> = {
  confirmed: { icon: "✅", label: "Confirmed" },
  estimated: { icon: "⚠️", label: "Estimated" },
  unverified: { icon: "❌", label: "Unverified" },
};

/**
 * Effective flag for a metric value. Enforces the hard rule: a value with no
 * page-level citation cannot be ✅ — it degrades to ❌. (page === null with no
 * citation object counts as "no page".)
 */
export function effectiveFlag(mv: MetricValue): SourceFlag {
  // No disclosed value at all ⇒ unverified/blank.
  if (mv.value === null && mv.display === undefined) return "unverified";
  // A disclosed value with no page-level citation cannot be ✅ (spec §3).
  if (mv.citation === null) return "unverified";
  return mv.flag;
}

export const ASSURANCE_LABEL: Record<AssuranceStatus, string> = {
  external_limited: "External — limited",
  external_reasonable: "External — reasonable",
  internal_only: "Internal only",
  none: "None",
  unknown: "Unknown",
};

export const SCOPE2_LABEL: Record<NonNullable<Scope2Method>, string> = {
  location_based: "Location-based",
  market_based: "Market-based",
  unknown: "Unknown",
};
