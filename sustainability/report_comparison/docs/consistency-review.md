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

Both are anchored to the frameworks the source reports are written against — **GHG Protocol**
for accounting, **IFRS S1/S2** for disclosure, **GRI** for the social and governance rows that
IFRS S2 does not cover. See §3, which is the framework-grounded version of this
recommendation; the standards decide what the spine contains rather than our judgement.

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

Both are **anchored to the frameworks the reports themselves are written against** — the GHG
Protocol for the accounting rules, IFRS S1/S2 for the disclosure rules, GRI for the social and
governance rows that IFRS S2 does not cover. That anchoring is not decoration: it decides what
the spine contains, what qualifiers each figure must carry, and when two figures may be
compared at all.

> **Verify before publishing.** Paragraph-level references below are given so the intent is
> traceable, but they should be checked against the current standards text before any of this
> wording is shown on the site. The site's credibility rests on its citations, and a framework
> claim deserves the same discipline as an emissions figure.

### 3.0 Division of labour between the frameworks

| | Answers the question | Gives the spine |
|---|---|---|
| **GHG Protocol** (Corporate Standard; Scope 2 Guidance 2015; Scope 3 Standard) | *What does this number mean?* | The **accounting qualifiers** every emissions figure must carry to be interpretable |
| **IFRS S1** | *Who is reporting, over what period, against what comparatives?* | The **entity and period contract** |
| **IFRS S2** | *Which climate metrics must be disclosed?* | **Tier 1 itself** — the cross-industry metric categories |
| **GRI** (305/403/404/405/201) | *Which social & governance metrics?* | The **non-climate rows**, which IFRS S2 does not address |

The single most important consequence: **a metric is not `value + unit + citation`.** Both
frameworks insist a GHG figure is meaningless without its accounting basis. So every figure in
the spine carries a *disclosure envelope*, and that envelope — not a hand-set boolean — is what
determines whether two figures may sit in the same comparison.

### 3.1 The disclosure envelope (GHG Protocol)

Fields every emissions figure carries. Each replaces something currently living in a code
comment or a `dataNotes` string:

| Envelope field | Framework basis | Today |
|---|---|---|
| `consolidation`: `equity_share` \| `financial_control` \| `operational_control` | GHG Protocol organizational boundaries | prose only — Sembcorp is equity-share, National Grid is operational-control, and the site never says so structurally |
| `consolidated_vs_associates` split | Corporate Standard — report the group separately from JVs/associates | Sembcorp's Scope 1 is literally "subsidiaries 4,345.4 + JVs & associates 3,080.0" **in a code comment** |
| `scope2_location` **and** `scope2_market` as two fields | Scope 2 Guidance (2015) **dual reporting** | one field + a basis string (see below) |
| `scope3_categories_included: number[]` (of the 15) + exclusion rationale | Corporate Value Chain (Scope 3) Standard | free text — `"Categories 3, 11, and 15 only"` |
| `base_year`, `base_year_value`, `recalculation_note` | base-year recalculation policy for structural change | Singtel's FY2025 Scope 1 "+57.2% due to scope expansion, not a real increase" is a textbook recalculation trigger, recorded as a `dataNote` |
| `gwp_source` (IPCC AR5 / AR6) | required for cross-entity comparability | absent — material for SF₆-heavy grid utilities |
| `biogenic_separate` | biogenic CO₂ reported outside the scopes | Sembcorp's intensity denominator includes biogenic; noted in prose only |

**Dual Scope 2 supersedes the fix already shipped.** §2.5 was fixed by making `scope2Basis` a
required per-company string. That removed a false claim, but the framework-correct model is two
fields, because the Scope 2 Guidance expects both numbers. The data is already there and
currently discarded: DBS 26,322 market / 50,889 location; OCBC 35,373 / 68,391; UOB 1,700 /
73,700; Singtel 342.5 market / 467.7 location. Storing both makes the market-vs-location gap —
i.e. the effect of RECs — a *visible metric* rather than a caveat, which is one of the more
interesting things this dataset could show.

### 3.2 Tier 1 = the IFRS S2 cross-industry metric categories

Rather than the twelve rows invented from what the data happened to contain, Tier 1 should be
**IFRS S2's cross-industry metric categories** (S2 para 29 (a)–(g)). This is the defensible
answer to "which key data points?" — it is not our opinion, it is the disclosure standard the
reporting entities are themselves moving onto.

| S2 | Metric | Spine keys | Site status today |
|---|---|---|---|
| (a) | Absolute gross GHG — Scope 1, 2, 3, in tCO₂e, GHG Protocol basis | `scope1_abs`, `scope2_location`, `scope2_market`, `scope3_abs` + envelope | **strong** — the site's core |
| (b) | Transition-risk exposure — assets/activities vulnerable | `transition_risk_exposure_pct` | **absent** |
| (c) | Physical-risk exposure — assets/activities vulnerable | `physical_risk_exposure_pct` | **absent** |
| (d) | Climate opportunities — assets/activities aligned | `climate_opportunity_pct` | partial — banks' sustainable-finance figures are this metric, uncategorised |
| (e) | Capital deployment toward climate risks/opportunities | `climate_capex` | **absent** |
| (f) | Internal carbon price — price/tonne and how applied | `internal_carbon_price` | **absent** |
| (g) | % of executive remuneration linked to climate | `exec_remuneration_climate_pct` | **stored as a boolean** — S2 asks for a percentage |

This mapping is the most valuable output of the framework lens: it shows the site is excellent
on (a), accidentally holds (d), and is silent on (b), (c), (e), (f) — the four that a
sustainability or investment audience most wants and that separate an emissions table from a
climate-disclosure product. (g) is a one-field upgrade from a Yes/No to a number.

**Targets become structured, not free text.** S2 (paras 33–37) expects, per target: objective,
scope covered, base period, target period, milestones, whether third-party validated (e.g.
SBTi), gross vs net, and any reliance on carbon credits. Today this is a prose string —
`reductionTarget: "Operational: −25% S1+2 intensity by 2030 vs 2018 (−17.9% to date)…"` — which
cannot be compared, ranked or checked.

### 3.3 Tier 2 = GRI-anchored social & governance

**IFRS S2 is climate-only.** The site's social and governance rows are therefore *not* IFRS
territory, and labelling them as such would be a misrepresentation. They map cleanly to GRI —
and the data files already cite these standards in their comments, so this is formalising what
the extraction already did:

| Row | GRI |
|---|---|
| `training_hours_per_employee` | GRI 404-1 |
| `female_board_pct`, `female_leadership_pct`, `female_workforce_pct` | GRI 405-1 |
| `safety_rate`, `fatalities` | GRI 403-9 |
| `community_investment` | GRI 201-1 |
| `anti_corruption_training_pct` | GRI 205-2 |
| emissions rows (cross-reference) | GRI 305-1/-2/-3 |

Every spine row therefore declares its **authority** (`IFRS S2` / `GHG Protocol` / `GRI` /
`house`). The matrix can then show which standard each row answers to — a substantial
credibility upgrade, and it makes "house" rows (ones we invented) visibly distinct from
standard-anchored ones.

### 3.4 Tier 3 = industry packs (S2 industry-based guidance)

IFRS S2 requires industry-based metrics alongside the cross-industry ones. That is exactly the
"category pack" concept, with a standards basis:

- **Banks** → `financed_emissions_abs` (Scope 3 Cat 15), per-sector intensity + target
  progress, PCAF data-quality score. Note this reframes the banks page's central finding:
  "none of the three aggregate a financed-emissions figure" is not merely a data gap, it is a
  **gap against S2's industry-based guidance for commercial banking** — a much stronger and
  more useful statement, and one the site can make with authority.
- **Utilities** → SF₆, T&D loss %, generation intensity kgCO₂e/kWh, % non-carbon capacity.
- **Healthcare** → bed-day intensity, licensed beds.

### 3.5 Comparability becomes computed, not asserted

Today `comparable` is a hand-set boolean on Temasek, `rankable` on healthcare, and absent on
utility/banks. With the envelope in place it becomes a **derived** property:

> Two figures are comparable only if their envelopes agree — same `consolidation`, same Scope 2
> method, same `scope3_categories_included`, same `gwp_source`, and (for intensities) the same
> denominator.

The healthcare page already implements a version of this in `bestPerformer()` — checking
denominator and Scope 2 method parity before allowing a badge. Generalising it means the site
can *explain a suppressed badge in framework terms* ("Sembcorp reports on equity share,
National Grid on operational control — not comparable per GHG Protocol organizational
boundaries") instead of a hand-written caveat paragraph. That is the difference between a site
that says "read with care" and one that shows its work.

### 3.6 What this makes possible: a disclosure-coverage scorecard

Once Tier 1 is the S2 cross-industry set and absence is impossible, you get a genuinely new
capability for free: **per-entity coverage against IFRS S2** — "IHH discloses 3 of 7
cross-industry metric categories; DBS discloses 5 of 7." That is a defensible, framework-backed
score that does not require estimating a single number, which is precisely the constraint this
project has held to throughout. It is also a far more interesting headline than a combined
emissions total that the site already (correctly) demotes to "context only".

### 3.7 One entity shape — `src/data/entity.ts`

```ts
interface Entity {
  id; name; shortName; logoInitials; accentColor;
  category: CategoryId;
  listing: string | null;
  countries: string[];
  businessModel: string;

  // ── IFRS S1: reporting entity & period ──
  // S1 requires the sustainability reporting entity to be the same as the
  // financial-statement entity, over the same period. This is the principled
  // basis for the healthcare page's "listed group, not hospital campus" rule
  // and for excluding SGH/TTSH/NUH — an S1 boundary test, not our preference.
  reportingPeriod: string;         // "FY2024/25"
  fiscalYearEnd: string;           // "03-31" — enables an automatic vintage-spread warning
  reportLagNote: string | null;    // e.g. banks' PCAF one-year lag on financed emissions
  boundaryNote: string | null;

  // ── GHG Protocol: organizational boundary ──
  consolidation: "equity_share" | "financial_control" | "operational_control" | "unknown";

  status: "populated" | "pending_extraction" | "pending_verification" | "excluded";
  rationaleCode: RationaleCode | null;

  source: Source;
  metrics: Record<SpineKey, Cell>; // every Tier 1 key present, always
  dataNotes: string[];
  estimationUncertainty: string[]; // IFRS S1 requires this disclosed — currently informal
}

type Cell =
  | { state: "disclosed"; value: number | string; unit: string; year: string;
      envelope: Envelope; provenance: Provenance; citation: Citation; note?: string }
  | { state: "nd" }                    // applies, not disclosed
  | { state: "na"; reason: string }    // does not apply — reason required
  | { state: "pending" };              // not yet extracted
```

**IFRS S1 also requires comparative information for prior periods.** That makes the
single-year-snapshot problem (§2.7 — only Temasek has a time series) a framework gap, not a
nice-to-have: `metrics` should hold a short series per key, as the Temasek model already does.

### 3.8 One provenance ladder, enforced

```
confirmed   page recorded for THIS figure
reported    from the entity's own report, no page recorded
estimated   third-party / study — quarantined, never rankable, never an entity row
unverified  nothing to cite (N/D)
```

Already unified in `provenance.ts` and now enforced identically on all four categories.
Separately, record the **assurance level** per figure from the source (`none` /
`internal_only` / `external_limited` / `external_reasonable`) — the healthcare model already
does this and it should be standard, because "limited assurance" and "reasonable assurance" are
materially different claims. Worth checking where the sustainability assurance standards have
landed (ISSA 5000) before fixing the vocabulary.

### 3.9 Presentation contract

- **Store tCO₂e everywhere** (the IFRS S2 measurement unit). Format at render, never at rest.
- **One legend component** on all four pages.
- **Badges** derive from envelope agreement (§3.5), never a hand-set flag.
- **Currency:** amount + ISO currency + `period_basis` as three fields, never a formatted string.
- **Controlled framework vocabulary** with an alias map (`"GRI 2021" → GRI`, `"TCFD-aligned" →
  TCFD`, `"HKFRS S2" → IFRS S2 (HK)`), so chips are countable and a "reports under IFRS S2"
  filter is possible.

## 4. Page contract

Every category page renders the same sections, in the same order, with the same numbering.
Sections with no content render as an explicit empty state rather than disappearing — that's
what keeps the numbering stable across tabs.

| # | Section | Notes | Framework basis |
|---|---|---|---|
| — | Hero | eyebrow date **derived** from `max(extractedDate)`, not typed | |
| 01 | Snapshot | same four tiles every category: workforce · avg female board · earliest net-zero · assurance coverage | |
| 02 | Disclosure coverage | per-entity coverage against the S2 cross-industry set (§3.6) — the framework-backed headline, replacing combined totals that are not comparable anyway | IFRS S2 ¶29 |
| 03 | Emissions | as-reported chart + caveat block (caveat text is per-category config) | GHG Protocol |
| 04 | Comparison Matrix | Tier 1 → Tier 2 → industry pack; As-Reported / Comparable toggle, where "Comparable" filters on envelope agreement (§3.5) | S2 ¶29 + GRI |
| 05 | Profiles | one card component; shows boundary, consolidation approach, base year and assurance level | GHG Protocol + IFRS S1 |
| 06 | Excluded & Pending | rationale codes; "None" when empty | IFRS S1 reporting-entity test |
| 07 | Methodology | **shared component, identical on all four pages**, stating the framework basis of each tier | |
| 08 | Export | one CSV schema across all categories, envelope fields included | |
| 09 | Sources & Caveats | | |

Two things the framework lens adds here. **Methodology becomes a real asset rather than
boilerplate** — it can state plainly that Tier 1 is the IFRS S2 cross-industry set, Tier 2 is
GRI-anchored, and emissions accounting follows the GHG Protocol, which is a far stronger claim
than "we don't estimate". And the **Comparable view stops being a label and becomes a filter**:
it shows only figures whose envelopes agree, and names the reason when it withholds one.

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
3. Fill the **envelope** for every emissions figure: consolidation approach, both Scope 2
   figures where the report gives them, Scope 3 categories included, base year, GWP source.
   This is the step that makes the figure comparable to anything else — without it the number
   is uninterpretable, and the Comparable view will (correctly) refuse to rank it.
4. Emissions in **tCO₂e**. Record a page number wherever you had the PDF open — that's the
   difference between ✅ and •.
5. Anything surprising goes in `dataNotes` *and*, if it affects how a number should be read,
   in the cell's `note` so it reaches the popover. Estimation uncertainty goes in
   `estimationUncertainty` (IFRS S1 expects it disclosed).
6. `npm test` — the data gate checks provenance, ranges, units, URLs, and (once added) the
   Tier 1 completeness, envelope completeness and tCO₂e magnitude rules.

**New category**
1. New data file, same `Entity[]` shape.
2. Define the Tier 3 industry pack from **IFRS S2's industry-based guidance** for that
   industry (usually 2–4 metrics), rather than inventing one.
3. Add a `CategoryConfig`, write two caveat paragraphs.
4. Done — no new components, no new export, no `Header.tsx` edit.

That's the goal state: category #5 is a data file plus ~20 lines of config.

---

## 6. Migration path — status

Phases 1–3 are **built**. The spine and the page contract are live; all four
categories render through them.

| | Status | Where |
|---|---|---|
| **Phase 1** — data layer | ✅ done | `src/data/spine/` — `types.ts` (envelope, cell, entity), `registry.ts` (Tier 1/2 + packs), `envelopes.ts` (per-entity GHG Protocol basis), `comparability.ts`, `adapters.ts` |
| **Phase 2** — one matrix, one export | ✅ done | `ComparisonMatrix`, `SpineCell`, `SpineExport`, `Methodology`/`Legend`, `CoveragePanel`, `EntityProfiles`, `ExcludedTable` |
| **Phase 3** — page template | ✅ done | `CategoryPage` + `categories.tsx`; the four `page.tsx` files are now 8–35 lines each |
| **Phase 1.5** — the disclosure gaps | ⬜ open | data collection, see below |

What the build changed structurally:

- **Emissions are tCO₂e at rest everywhere.** The ktCO₂e→tCO₂e conversion for the
  Temasek dataset happens in exactly one place (`adapters.ts`), and a test asserts
  every disclosed absolute lands on a tonnes scale — the 1000× trap is closed.
- **Dual Scope 2 is live.** The previously-discarded second basis is now shown for
  all three banks (DBS 50.9k location / 26.3k market; OCBC 68.4k / 35.4k; UOB 73.7k /
  1.7k), so the REC effect is a visible figure rather than a caveat.
- **Comparability is computed.** `assessComparability()` blocks a row when envelopes
  disagree and returns the reason — e.g. Temasek Scope 1 is withheld because
  "organizational boundary differs (Sembcorp Equity share; SMRT Not stated; Singtel
  Not stated)". Three hand-set flags (`comparable`, `rankable`, nothing) are gone.
- **Thirteen components deleted**, including the three divergent tables and two
  export implementations. Adding a category no longer means writing a table.
- **Nav derives from the registry**, so a new category is one entry, not two
  parallel literals.

Current S2 ¶29 coverage, computed from the data: Sembcorp, SMRT, Singtel, Meralco,
CLP, National Grid, IHH and RMG each **1/7**; DBS, OCBC and UOB **2/7** (they hold
(d) via sustainable finance); TMG **0/7**. Every entity fails (g) — none discloses
the *percentage* of executive remuneration linked to climate, only a yes/no.

**Phase 1.5 — the open work.** This is data collection, not engineering, and it is
where the site gets materially more useful. Per entity, capture what the reports say
about S2 ¶29 (b), (c), (e), (f) and the (g) percentage. The rows already exist and
render as N/D with the framework reason attached, so the gaps are visible and
countable today — filling them raises the coverage scores without touching code.

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
