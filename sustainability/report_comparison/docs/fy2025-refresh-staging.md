# FY2025 refresh — extraction status

**Not live.** These are verified figures staged for the period refresh of Meralco,
DBS, OCBC and UOB. They are recorded here rather than entered into the dataset
because the refresh cannot be completed safely yet — see *Why this is blocked*.

Extracted August 2026 from the reports in Drive. Pages are not recorded (the PDF
text extraction carries no reliable page markers), so on entry these would be
**• reported**, not ✅ confirmed.

---

## Why this is blocked

**A peer set must move together.** Refreshing DBS and OCBC to FY2025 while UOB
stays on FY2024 would leave the banks matrix comparing a FY2025 Scope 2 column
against a FY2024 one. That is a worse outcome than all three being a year old:
staleness is visible and flagged, whereas a mixed-period comparison looks
like-for-like and is not.

**UOB's FY2025 GHG figures are not in Drive.** Neither `UOB SR2025.pdf` nor
`uob-annual-report-2025.pdf` contains the quantitative environmental table — the
SR points to a separate "Direct Environmental Impact" data source that is not
among the uploaded files. Everything else needed for UOB is available; only the
emissions table is missing.

**What unblocks it:** the UOB FY2025 environmental data supplement. With that,
all three banks can move in one commit. Meralco is independent of this — the
utilities set already spans three periods, so refreshing it improves alignment
rather than breaking it.

A guard for this was added to `comparability.ts` in the same change: a row is now
blocked when the compared entities' **reporting periods differ**, before any
accounting-basis check. Previously only the envelope was checked, so a
part-refreshed peer set would have compared cleanly across fiscal years. This
also revealed that the **utilities set was never period-comparable** — Meralco
FY2024, CLP FY2025, National Grid FY2025/26 — which the matrix now states
explicitly.

---

## DBS — Sustainability Report 2025 (FY2025)

Environmental data table, cross-checked against the FY2024 column.

| Metric | FY2025 | FY2024 (as restated in SR2025) | Currently stored (FY2024) |
|---|---|---|---|
| Scope 1 | 1,148 | 1,484 | 1,300 |
| Scope 2 location-based | 50,091 | 53,141 | 50,889 |
| Scope 2 market-based | 23,571 | 24,871 | 26,322 |
| Scope 3 (operational) | 51,987 | 55,497 | 56,162 |
| Total GHG (market-based) | 76,706 | 81,852 | 83,784 |
| Total GHG (location-based) | 103,226 | 110,122 | — |
| Scope 1+2 intensity by GFA | 39 kg CO₂e/m² | 42 | — |

**Restatement, material:** every FY2024 figure above carries a restatement marker
in SR2025 and differs from what is stored. On refresh this needs a base-year
recalculation note, and the FY2024 comparatives should come from SR2025 rather
than the stored values.

Scope 1 composition FY2025: backup generators 75 · owned vehicle transport 4 ·
refrigerants and fire retardants 1,069. Reporting on petrol and diesel vehicles
for executive transport was discontinued in 2025.

People (Tables 2, 4, 5):

| Metric | FY2025 | FY2024 |
|---|---|---|
| Headcount | 39,983 | 41,638 |
| Female workforce | 49% | 49% |
| Female senior management (SVP–MD) | 41% | 41% |
| Employee engagement (My Voice) | 91% | 91% |

Scope 3 categories, GWP source, board composition, independent directors,
training hours per employee, community investment and anti-corruption training %
were **not located** in the extracted text — several sit in the Annual Report,
which is not in Drive.

---

## OCBC — Sustainability Report 2025 (FY2025)

The strongest disclosure of the four. Column order (2025 · 2024 · 2023) was
confirmed by matching three stored FY2024 values.

| Metric | FY2025 | FY2024 | FY2023 |
|---|---|---|---|
| Total emissions (S1 + S2 market + S3) | 36,209 | 38,980 ✓ | 27,492 |
| Scope 1 | 2,001 | 132 ✓ | 142 |
| Scope 2 location-based | 78,650 | 68,391 ✓ | 68,334 |
| Scope 2 market-based | 30,551 | 35,373 ✓ | 23,501 |
| Scope 3 | 3,657 | 3,475 ✓ | 3,849 |
| Scope 2 intensity (location-based) | 0.0094 tCO₂e/ft² | 0.0117 ✓ | 0.0123 |
| Water consumption | 765,070 m³ | 470,083 | 433,969 |

✓ = matches the currently stored FY2024 value, confirming column alignment.

**Envelope — this closes three "unknown" fields:**

- **Consolidation: operational control** (footnote 32), boundary covering Great
  Eastern Holdings, OCBC Yuanshen, Pac Lease Berhad, PTOS, Bank of Singapore
  (HK) and (MY). International branches excluded as <1.5% of Group emissions,
  assessed as immaterial *under IFRS S2*.
- **GWP source: GHG Protocol "Global Warming Potential Values" (August 2024)** —
  not an IPCC AR directly, so the `GwpSource` enum needs a value for it rather
  than inferring AR6.
- **Scope 3 composition:** business air travel plus waste-related emissions.

**Scope 1 rose 132 → 2,001 because fugitive emissions were brought into the
inventory**, not because of a real increase — a boundary expansion and a
textbook base-year recalculation trigger. Entity coverage was expanded in 2025
to align with the IFRS Sustainability Disclosure Standards. R22 excluded per EPA
and GHG Protocol guidance (52.4 kg recorded). Great Eastern's fugitive emissions
are excluded from Scope 1.

Market-based emissions are projected to fall to 25,518 tCO₂e once EACs for China
and Malaysia are issued; those RECs were **not** used to adjust the reported
figure.

People: female workforce 56%; leadership positions (MD and above) filled by women
43% — note this basis differs from the "senior management" 38% currently stored.

---

## UOB — Sustainability Report 2025 / Annual Report 2025 (FY2025)

**Emissions table not present in either document.** Available:

- **Internal carbon price (IFRS S2 ¶29(f)): S$3–11 per tCO₂e**, applied in
  decision-making to assess cost-benefit of efficiency initiatives. This is a
  new ¶29(f) disclosure and would take UOB's coverage from 2/7 to 3/7.
- Operational carbon neutrality maintained; carbon-neutrality commitment covers
  Scope 1, Scope 2 and Scope 3 (business air travel and waste in operations).
- Operational target: −25% combined Scope 1+2 emissions **intensity** by 2030 vs
  2018 baseline; stated as on track. The target is on a **location-based** basis
  and excludes the effect of renewables.
- Female senior management: 38% (AR2025).

---

## Meralco — One Meralco 2025 Integrated Report

Not yet extracted. The report is in Drive (52 MB) along with the 2025 17-A
filing. Meralco can be refreshed independently of the banks, since the utilities
set already spans three reporting periods.

---

## On entry

1. Move all three banks in one commit; Meralco may go separately.
2. Take FY2024 comparatives from the FY2025 reports, not from the stored values —
   DBS and OCBC have both restated.
3. Record the restatement reasons: DBS's marker on every FY2024 figure; OCBC's
   fugitive-emissions inclusion and entity-coverage expansion.
4. Add a `GwpSource` value for the GHG Protocol August 2024 GWP table.
5. Update `LATEST_AVAILABLE` in `usability.ts` as each entity moves, so the
   staleness flag clears itself.
