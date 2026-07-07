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
      display: "Business travel, employee commute (from 2023); + Cat 3 fuel/energy (2024)",
      unit: "",
      year: "2023–24",
      flag: "confirmed",
      citation: { ...IHH_SR2024, reportTitle: "IHH Sustainability Report 2023 / 2024" },
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
    // Absolute figures: ❌ blank until extracted from SR tables (Job H3).
    scope1_abs: {
      value: null,
      unit: "tCO₂e",
      year: null,
      flag: "unverified",
      citation: null,
      note: "Not yet extracted from SR tables (Job H3 pending).",
    },
    scope2_abs: {
      value: null,
      unit: "tCO₂e",
      year: null,
      flag: "unverified",
      citation: null,
      note: "Not yet extracted from SR tables (Job H3 pending).",
    },
    scope3_abs: {
      value: null,
      unit: "tCO₂e",
      year: null,
      flag: "unverified",
      citation: null,
      note: "Not yet extracted from SR tables (Job H3 pending).",
    },
  },
  dataNotes: [
    "Scope 1+2 GHG intensity 151.5 (2022) → 146.0 (2025) kg CO₂e/patient-bed-day, per SR 2025.",
    "Scope 2 is LOCATION-BASED. Multi-country grid mix (esp. Singapore's low grid carbon intensity) flatters location-based Scope 2 — same class of flag as utilities normalization.",
    "Scope 3 coverage: business travel + employee commute from 2023; Cat 3 (fuel/energy) added 2024. No Cat 15 (investments) — renders blank under the Cat 15 toggle, which is correct (no special-casing).",
    "2030 target: −42% Scope 1+2 vs a 2025 baseline, announced Apr 2026.",
    "Assurance: Scope 1+2 limited assurance SG + MY only (2022–23). SR 2025 is NOT externally assured; external assurance targeted FY2027. 2024–25 rows are internal_only.",
    "Absolute Scope 1/2/3 tCO₂e left blank pending extraction from SR tables (Job H3). No figure is shown without a page.",
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
  intensityDenominator: "patient_bed_day",
  frameworks: null,
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
      note: "Awaiting Job H1 (TMG FY2025 SR verification).",
    },
    scope1_abs: { value: null, unit: "tCO₂e", year: null, flag: "unverified", citation: null, note: "Awaiting Job H1." },
    scope2_abs: { value: null, unit: "tCO₂e", year: null, flag: "unverified", citation: null, note: "Awaiting Job H1." },
    scope3_abs: { value: null, unit: "tCO₂e", year: null, flag: "unverified", citation: null, note: "Awaiting Job H1." },
  },
  dataNotes: [
    "Licensed beds confirmed from AR body: Singapore 187, Malaysia 403, Vietnam 230 (as at 30 Jun 2025).",
    "All emissions/energy/intensity metrics are BLANK pending Job H1 (verify SR section pp. 54–100). Aggregator claims 'no Scope disclosure' — treated as untested, not seeded either way.",
    "Nested listed subsidiary TMC Life Sciences Berhad (~70%, Bursa-listed): boundary/double-report check required before TMG appears in any ranking.",
    "If Job H1 finds no Scope 1/2 tables → EXCLUDED_NO_ENTITY_INVENTORY candidate; escalate BDMS/Bumrungrad/Ramsay from backlog.",
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
