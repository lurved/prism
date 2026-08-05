# ESG Tracker — cross-category consistency review

**Scope:** the four comparison categories live at `/sustainability/report_comparison/` —
Temasek (`/`), Electricity Utility (`/infra`), Banks (`/banks`), Healthcare (`/healthcare`).
**Reviewed from:** the repo source (the live URL blocks automated fetch), July 2026 state.
**Question asked:** how do we make data presentation consistent across categories, and make
the *next* category or company cheap to add without re-deciding everything?

**Short answer:** the accuracy discipline is excellent and consistent — no interpolation, N/D
never rendered as 0, per-figure citations. What is *not* consistent is everything around it:
three data schemas, three citation types, three missing-data vocabularies, three unit
conventions, two export formats, and four different page compositions. Each category was
built as its own thing that borrowed ideas from the last. Adding category #5 today means
writing a fourth data model and a third comparison table.

The fix is a **metric spine** (one canonical registry every category answers) plus a **page
contract** (same sections, same order, same legend). Everything else falls out of those two.

---

## 1. What exists today

| | Temasek `/` | Utility `/infra` | Banks `/banks` | Healthcare `/healthcare` |
|---|---|---|---|---|
| Data model | `Company` (nested E/S/G) | `PeerCompany` (flat) | `PeerCompany` (flat) | `HealthcareEntity` (`Record<key, MetricValue>`) |
| Metric definitions | registry — `lib/metrics.ts` `METRIC_DEFS` | inline `rows[]` in component | same inline `rows[]` | inline `ROWS[]` in component |
| Citation type | `types.ts Citation` | `PeerDataSource` (no page field at all) | same | `healthcareData.ts Citation` (own shape) |
| Provenance tiers | confirmed / reported / unverified | reported / unverified | reported / unverified | confirmed / estimated / unverified |
| Emissions stored in | **ktCO₂e** | **tCO₂e** | **tCO₂e** | **tCO₂e** |
| Missing-data key | N/D | N/D · N/A | N/D · N/A | ✅ ⚠️ ❌ · pending · excluded |
| History / trend | 3-year series ✅ | — | — | year baked into metric key |
| Best-performer badge | `comparable` flag | none | none | `rankable` flag |
| Export | CSV+JSON (`MetricSeries`) | — | — | CSV+JSON (different schema) |
| Methodology section | ✅ | — | — | — |

Sections rendered, in order:

- **Temasek:** 01 Snapshot · 02 Emissions & ESG · 03 Matrix · 04 Profiles · 05 Methodology · context strip · 06 Sources
- **Utility / Banks:** 01 Snapshot · 02 Emissions · 03 Matrix · 04 Profiles · 05 Sources
- **Healthcare:** context banner · 01 Matrix · 02 Profiles · 03 Excluded · 04 Export · 05 Sources

A reader moving between tabs gets a different section numbering, a different legend, and a
different meaning for the same badge. Snapshot appears on 3 of 4, emissions chart on 3 of 4,
methodology on 1 of 4, export on 2 of 4 with incompatible schemas.

---

## 2. Findings

### 2.1 The same evidence renders differently depending on which tab you're on

This is the most damaging inconsistency, because it undermines the credibility the provenance
model is there to build.

`provenance.ts` did the right thing — one tier vocabulary — but the two ends still disagree:

- A figure taken from a report with **no page recorded** is `"reported"` (a `•` dot) on
  Temasek/Utility/Banks — `lib/metrics.ts:294`, `lib/peerMetrics.ts:36`.
- The identical evidentiary state on Healthcare renders **✅ Confirmed**. `effectiveFlag()`
  (`healthcareData.ts`) only degrades when `citation === null`; it never checks
  `citation.page === null`. Every IHH figure is page-less (`page: null`,
  `pageNote: "Exact page not recorded…"`) and every one shows ✅.
- The file header for `healthcareData.ts` states the opposite rule: *"A value with NO
  page-level citation cannot be rendered ✅ — it degrades to ❌."* The docstring and the code
  disagree, and the code is the weaker of the two.

Net effect: healthcare currently looks *better sourced* than banks while being *less*
sourced. Healthcare also has no `"reported"` tier available to express "from the report, page
not recorded", which is exactly what most of its rows are.

### 2.2 Three units at rest for the same quantity

Temasek stores ktCO₂e (`scope1Emissions: 7_425.4`); everyone else stores tCO₂e
(`scope1: 6_630_953`). Three formatters exist — `fmtEmissions()` in `lib/metrics.ts:42`,
`fmtT()` in `PeerComparison.tsx:9`, and inline formatting in healthcare. The exports inherit
the split, so the Temasek CSV and the Healthcare CSV cannot be concatenated without a
conversion step that isn't documented anywhere.

This is the single highest-risk inconsistency for a *new* contributor: a company entered into
the wrong file with the wrong magnitude is off by 1000× and nothing in CI catches it.

### 2.3 No shared metric taxonomy

The same concept has a different key, label, type and sometimes definition per category:

| Concept | Temasek | Utility / Banks | Healthcare |
|---|---|---|---|
| Scope 1 | `scope1` "Scope 1 Emissions" | `s1` "Scope 1" | `scope1_abs` "Scope 1 absolute" |
| Board diversity | `femaleBoard` "Female Board %" | `femaleBoard` "Female board %" | `women_board_pct` "Women on the Board" |
| Leadership | `femaleLeadership` "Senior mgmt" | `femaleSeniorMgmt` "definitions vary" | `women_leadership_pct` "leadership / mgmt" |
| Community | `communityInvestmentSGDm` (number, SGD m) | `communityInvestmentNative` (**string**) | `community_donations` (number, SGD) |
| Safety | `injuryRate` (per M hrs) | `injuryMetricValue` + unit string | `fatalities` (count) |
| Anti-corruption | `antiCorruptionTrainingPct` (% trained) | `antiCorruptionTrainingPct` | `corruption_ops_pct` (% **operations assessed** — a different metric) |
| Training hours | `trainingHours` | `training` | *absent* |

Consequences: you cannot ask "female board % across all twelve companies"; a metric added to
one category silently doesn't exist in the others; and `corruption_ops_pct` sitting in the
governance slot invites a reader to compare it against `antiCorruptionTrainingPct`, which
would be wrong.

### 2.4 Missing-data vocabulary differs — and Temasek can't say "N/A" at all

Utility/Banks have `naMetrics[]`. Healthcare has `status: "excluded" | "pending_*"` plus
rationale codes. Temasek has only N/D — so metrics the data file itself annotates as *not
applicable* are displayed as *not disclosed*:

- `esgData.ts:69` — SMRT `renewableCapacityGW: null, // N/A — SMRT is not a power generator`
- `esgData.ts:264` — Singtel `renewableCapacityGW: null, // Not applicable`

Both render "N/D" in the matrix. That reads as a disclosure failure by SMRT and Singtel when
it is simply a metric that does not apply to a transit operator or a telco. Same class of
error the healthcare page explicitly designed around with its `excluded` handling.

### 2.5 Scope 2 basis is asserted, not stored, on the Temasek page

`lib/metrics.ts:65` hard-codes the Scope 2 row sublabel as **"Market-based"** for all three
companies. The data says otherwise:

- Sembcorp — `// location-based; market-based disclosure not separately stated` (`esgData.ts:47`)
- SMRT — `// basis (location/market) not specified` (`esgData.ts:153`)
- Singtel — market-based ✅ (the only one the label is true for)

Utilities/Banks got this right with a per-company `scope2Basis` string; Healthcare got it
more right still with a `scope2Method` enum. The oldest page carries the wrong label. Worth
fixing on its own, independent of any refactor.

### 2.6 Community investment is three different metrics wearing one label

Native-currency strings sit in one column with no period basis: `"PhP 224M"` (annual),
`"HK$240M"` (a programme allocation), `"£6.8M/yr"` (annual), and — the outlier —
`"SGD 1B / 10yr"` for DBS, a ten-year commitment rendered in the same row as everyone's
annual spend. `bankData.ts:59`. The dataNotes explain it; the table does not. A reader
scanning the row sees DBS as ~60× OCBC.

### 2.7 Schema smells that will bite on the next data refresh

- **Year in the metric key** — `intensity_2022`, `intensity_2025` (`healthcareData.ts`).
  Adding FY2026 means a new key, a new `ROWS[]` entry and a component edit. The Temasek model
  already solved this with `values: MetricValue[]` / `historicalEmissions[]`.
- **Framework strings are uncontrolled** — `types.ts` has a `ReportingFramework` union, but
  `PeerCompany.frameworks` and `HealthcareEntity.frameworks` are `string[]`. Live values:
  `"GRI"` / `"GRI 2021"`, `"TCFD"` / `"TCFD-aligned"`, `"IFRS S2"` / `"HKFRS S2"` /
  `"IFRS S1"`, `"SASB"` / `"SASB (IF-EU)"`. These render as chips side by side and can never
  be filtered or counted.
- **Hero eyebrow dates are hand-typed** — `"ESG Intelligence · June 2026"`,
  `"Singapore Banks · June 2026"`, `"Healthcare · July 2026"`. They don't derive from
  `extractedDateISO`, so they go stale silently on the next data refresh.
- **Nav is hard-coded** — `Header.tsx` `navItems` + `SUBTITLES` are two parallel literals a
  new category must be manually added to, in both places.
- **Accent colours are reused across categories with no assignment rule** — `#E39A4D` is
  Sembcorp, OCBC *and* Meralco; `#EA7267` is SMRT and DBS; `#52A8C4` Singtel and IHH.
  Harmless within a page, confusing in exports and any future cross-category view.
- **Only Temasek has a time series.** Everyone else is a single-year snapshot, so
  `TrendChart`/`Sparkline` are dead weight on three of four categories and "is this getting
  better?" is unanswerable outside Temasek.

---

## 3. Recommendation

Two artifacts to build, in this order. Everything else in §4–§6 follows from them.

### 3.1 A metric spine — `src/data/spine.ts`

One canonical registry that **every** category answers. A metric is either *disclosed*,
*N/D*, *N/A (with reason)*, or *pending* — never absent. This is the "template of key data
points" you asked about.

**Tier 1 — the twelve rows every category page shows, in this order.** These are what make
the four pages feel like one product.

| # | key | label | unit / type | comparable |
|---|---|---|---|---|
| 1 | `scope1_abs` | Scope 1 | tCO₂e | no (boundary differs) |
| 2 | `scope2_abs` | Scope 2 | tCO₂e + `scope2_basis` enum | no |
| 3 | `scope3_abs` | Scope 3 | tCO₂e + `scope3_coverage` text | no |
| 4 | `intensity_reported` | Carbon intensity | value + unit + `denominator` enum | no |
| 5 | `net_zero_year` | Net-zero target | year | no |
| 6 | `interim_target` | Interim target | % + baseline year + scope | no |
| 7 | `headcount` | Headcount | employees | no |
| 8 | `female_board_pct` | Female board | % | **yes** |
| 9 | `female_leadership_pct` | Female leadership | % + `definition` string | no |
| 10 | `training_hours_per_employee` | Training hrs/employee | hrs | **yes** |
| 11 | `independent_directors_pct` | Independent directors | % | no |
| 12 | `external_assurance` | External assurance | status enum + provider + scope | **yes** |

**Tier 2 — shown when any entity in the category discloses it**, hidden as a row otherwise:
`scope1and2_abs`, `scope3_cat15`, `renewable_share_pct`, `water_m3`, `female_workforce_pct`,
`turnover_pct`, `engagement_pct`, `safety_rate` (+ `basis` enum), `fatalities`,
`community_investment` (+ `currency` + `period_basis` enum), `anti_corruption_training_pct`,
`esg_linked_exec_comp`, `frameworks`.

**Tier 3 — category packs**, declared by the category, appended after Tier 1/2:

- utilities → `sf6_tco2e`, `system_loss_pct`, `normalized_intensity_kwh`, `renewable_capacity_gw`
- banks → `financed_emissions_status`, `sustainable_finance_committed`, `sector_target_progress`
- healthcare → `beds_licensed` (per country), `intensity_bed_day`
- telecom/transport → `intensity_per_tb`, `intensity_per_pkm`

Each spine entry carries: `key`, `label`, `sublabel`, `category` (E/S/G/Entity), `unit`,
`valueType`, `comparable`, `lowerIsBetter`, `tier`, `appliesTo[]`. This is essentially
`METRIC_DEFS` generalised — the pattern already exists, it just needs to stop being
Temasek-only and stop being duplicated inline inside two components.

### 3.2 One entity shape — `src/data/entity.ts`

```ts
interface Entity {
  // identity
  id; name; shortName; logoInitials; accentColor;
  category: CategoryId;            // "temasek" | "utility" | "banks" | "healthcare" | …
  listing: string | null;          // "SGX" | "Bursa + SGX" | "Public (unlisted)"
  countries: string[];
  businessModel: string;

  // boundary — currently scattered across dataNotes prose
  reportingPeriod: string;         // "FY2024/25"
  fiscalYearEnd: string;           // "03-31"  ← new, enables a vintage-spread warning
  consolidation: "equity" | "operational_control" | "financial_control" | "unknown";
  boundaryNote: string | null;

  status: "populated" | "pending_extraction" | "pending_verification" | "excluded";
  rationaleCode: RationaleCode | null;

  source: Source;                  // ONE citation shape (below)
  metrics: Record<SpineKey, Cell>; // every Tier 1 key present, always
  dataNotes: string[];
}

type Cell =
  | { state: "disclosed"; value: number | string; unit: string; year: string;
      provenance: Provenance; citation: Citation; note?: string }
  | { state: "nd" }                              // applies, not disclosed
  | { state: "na"; reason: string }              // does not apply — reason required
  | { state: "pending" };                        // not yet extracted
```

Three things this buys immediately: `state` replaces four different missing-data
vocabularies with one; `na` requires a reason so §2.4 can't recur; `fiscalYearEnd` lets the
page warn automatically when a category mixes FY2024 with FY2025/26 instead of relying on a
hand-written "Read with care" aside.

### 3.3 One provenance ladder, enforced

```
confirmed   page recorded for THIS figure
reported    from the entity's own report, no page recorded      ← healthcare needs this tier
estimated   third-party / study — quarantined, never rankable, never an entity row
unverified  nothing to cite (N/D)
```

Derive it in one builder (as `buildMetricValue()` already does) — never hand-set. Add the
page check healthcare's own docstring already promises, then decide deliberately: either
page-less figures are `reported` everywhere (recommended — honest, and most of the corpus is
page-less), or they're `unverified` everywhere. Not one rule per tab.

### 3.4 Presentation contract

- **Store tCO₂e everywhere.** Format at render, never at rest. One `fmtEmissions()`.
- **One legend component**, rendered identically on all four pages:
  `N/D = not disclosed · N/A = not applicable · Pending = not yet extracted · ✅ page-verified · • reported`.
- **Badge rule, uniform:** a best-performer badge appears only when `comparable: true` **and**
  ≥2 entities disclose **and** their basis enums match. Replaces `comparable` (Temasek),
  `rankable` (healthcare), and nothing at all (utility/banks).
- **Currency:** amount + ISO currency + `period_basis` (`annual` | `multi_year_commitment` |
  `programme_allocation`) as three fields, never a pre-formatted string. Render the basis as
  a sublabel so DBS's 10-year commitment can never be read as annual spend.
- **Controlled framework vocabulary** with an alias map (`"GRI 2021" → GRI`,
  `"TCFD-aligned" → TCFD`), so chips are countable and filterable.

---

## 4. Page contract

Every category page renders the same sections, in the same order, with the same numbering.
Sections with no content render as an explicit empty state rather than disappearing — that's
what keeps the numbering stable across tabs.

| # | Section | Notes |
|---|---|---|
| — | Hero | eyebrow date **derived** from `max(extractedDate)`, not typed |
| 01 | Snapshot | same four tiles every category: workforce · avg female board · earliest net-zero · assurance coverage |
| 02 | Emissions | as-reported chart + caveat block (caveat text is per-category config) |
| 03 | Comparison Matrix | Tier 1 → Tier 2 → category pack; As-Reported / Comparable toggle |
| 04 | Profiles | one card component for all categories |
| 05 | Excluded & Pending | rationale codes; "None" when empty |
| 06 | Methodology | **shared component, identical text on all four pages** |
| 07 | Export | one CSV schema across all categories |
| 08 | Sources & Caveats | |

The end state is that a category page is a config object, not a bespoke file:

```ts
export const banks: CategoryConfig = {
  id: "banks", label: "Banks", subtitle: "Singapore Banks",
  hero: { title: "The big three, side by side.", standfirst: "DBS · OCBC · UOB — three banks, one lens." },
  entities: bankCompanies,
  pack: BANK_PACK,
  caveats: { absolute: …, comparable: … },
};
```

Register it in `categories.ts` and the nav, subtitle, routes, export and matrix all pick it
up. No `Header.tsx` edit, no new comparison component.

---

## 5. Adding a company / a category — the checklist this produces

**New company in an existing category**
1. Copy the entity template; fill `id`, identity, boundary, `fiscalYearEnd`, `consolidation`.
2. Fill **all Tier 1 keys** — a value, or `nd`, or `na` + reason. No key may be absent.
3. Emissions in **tCO₂e**. Record a page number wherever you had the PDF open — that's the
   difference between ✅ and •.
4. Anything surprising goes in `dataNotes` *and*, if it affects how a number should be read,
   in the cell's `note` so it reaches the popover.
5. `npm test` — the data gate checks provenance, ranges, units, URLs, and (once added) the
   Tier 1 completeness and tCO₂e magnitude rules.

**New category**
1. New data file, same `Entity[]` shape.
2. Define the Tier 3 pack (usually 2–4 metrics).
3. Add a `CategoryConfig`, write two caveat paragraphs.
4. Done — no new components, no new export, no `Header.tsx` edit.

That's the goal state: category #5 is a data file plus ~20 lines of config.

---

## 6. Migration path

Non-breaking, in three phases. Nothing here requires a redesign or a data re-extraction.

**Phase 1 — data layer only, zero UI change (highest value, lowest risk)**
- Convert Temasek to tCO₂e at rest; single `fmtEmissions()`.
- Land `spine.ts`; map all four existing datasets onto spine keys via adapters (keep the
  current files as-is behind the adapter).
- Unify `Citation` into one shape; give healthcare the `reported` tier.
- Controlled framework vocabulary + alias map.
- Extend `data.test.ts`: Tier 1 completeness, emissions-magnitude sanity, `na` requires a
  reason, `scope2_basis` present wherever `scope2_abs` is disclosed.

**Phase 2 — one matrix, one export**
- Single `ComparisonMatrix` reading the spine; retire the inline `rows[]` in
  `PeerComparison.tsx` and `ROWS[]` in `HealthcareComparison.tsx`.
- Single export schema; healthcare's extra fields (`rationale_code`, `boundary_note`,
  `assurance_status`) become standard columns for every category — they're good columns.
- Shared `<Legend>` and `<Methodology>`.

**Phase 3 — page template**
- `categories.ts` + `CategoryConfig`; the four `page.tsx` files collapse into one template.
- Derive hero dates and nav from the registry.

**Fix now, regardless of phase** — these were wrong, not just inconsistent. **All four are
done**; each is now covered by a test in `data.test.ts` so it cannot regress:

- ✅ **Scope 2 basis (§2.5)** — `scope2Basis` is now a required per-company field. The column
  label makes no claim ("Energy indirect — basis differs"), the basis reaches the popover and
  the CSV `notes`, and a per-company strip under the matrix states all three. The emissions
  panel and the Scope 2 context tile no longer say "market-based throughout".
  *Test: the Scope 2 label may not contain "market-based" or "location-based".*
- ✅ **N/A vs N/D (§2.4)** — `Company.naMetrics` is a `Record<metricId, reason>`; the reason is
  mandatory and shows in the popover. SMRT and Singtel renewable capacity now render **N/A**
  with their reason instead of N/D. Exports emit `not_applicable` so the two states stay
  distinct in a CSV. *Test: every `naMetrics` key is a real metric and carries a reason.*
- ✅ **Healthcare provenance (§2.1)** — `SourceFlag` gained the `reported` tier and
  `effectiveFlag()` now degrades a page-less citation to **• reported**, matching
  `buildMetricValue()`. IHH's figures render • rather than ✅. *Test: identical evidence tiers
  identically across verticals.*
- ✅ **Community investment basis (§2.6)** — `communityInvestmentBasis` is required on
  `PeerCompany`; every cell carries a qualifier line, so DBS reads "multi-year commitment —
  not annual spend". *Test: the basis is consistent with the figure shown.*

These fixes deliberately anticipate the target model: `notApplicable`, the mandatory N/A
reason, the required basis fields and the shared provenance ladder are all §3 decisions
landed early on the current schemas, so Phase 1 absorbs them rather than redoing them.
