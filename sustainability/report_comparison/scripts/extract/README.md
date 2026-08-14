# Batch PDF extraction

**Extract once. Commit the artifact. Never read the PDF again.**

## The workflow

Drop the reports in `sustainability/sustainability-report/`, then from
`sustainability/report_comparison`:

```bash
pip3 install pymupdf
npm run extract
git add data/extracted && git commit -m "extract: FY2025 reports"
```

That's it. One artifact per report lands in `data/extracted/<slug>.json`, and
everything downstream reads those instead of PDFs.

`sustainability-report/` is **git-ignored** — the PDFs live there for the
extractor to read and are never committed. The artifacts are what the repo
keeps.

**What belongs in it:** each entity's sustainability reporting. That includes
an annual or integrated report when the sustainability report is *inside* it —
TMG (pp. 54–100), Raffles, National Grid's 20-F, CLP, Meralco and Sembcorp all
publish that way. It does not include annual reports fetched to fill a metric
the sustainability reporting leaves out; those cells are marked out of scope
instead. The rule and its exclusions live in `src/data/spine/scope.ts`.

Any other folder works too — `python3 scripts/extract/extract.py <path>`,
including a Google Drive mount. It is searched **recursively**, so naming a
folder that holds the reports one level down is enough. A file counts as a PDF
by its **first bytes, not its suffix**: Sembcorp's, IHH's and Keppel's uploads
carry no `.pdf` extension, and selecting on the name skipped them silently,
which downstream is indistinguishable from the company not disclosing.

**Do not commit the PDFs.** They're large and binary; the repo stays clean with
just the JSON artifacts, which are small, diffable and greppable. Keep the PDFs
on your machine — the artifacts record a SHA-256 of each source, so a later run
can tell whether a report has been reissued.

Re-running is free: files whose bytes were already extracted are skipped. The
check is on the **source hash, not the slug**, so a report that arrives under a
different filename — a rename, a second copy, or a slug this repo picked by
hand like `sembcorp-sr2025` — is recognised as done rather than extracted a
second time under a second name. `--force` overrides.

### Other inputs

```bash
python3 scripts/extract/extract.py report.pdf --slug uob-sr2025   # one file
python3 scripts/extract/extract.py a.pdf b.pdf                    # several
python3 scripts/extract/extract.py drive-download.json            # Drive payload
```

The last form exists because Drive is the only source reachable from the remote
session — company domains are blocked by the network policy there (the proxy
returns 403 on CONNECT), and Drive refuses downloads over 10 MB, which covers
most of these reports. Running locally sidesteps both limits entirely, which is
why it is the recommended path.

## Why this replaced the old way

| | Problem | Consequence |
|---|---|---|
| **Lossy** | Drive's text conversion silently truncates. UOB's report stopped at **p.79** of a document whose data section starts at **p.117**. Meralco's 17-A cut off mid-word. Its 52 MB integrated report returned **nothing at all**. | Invisible in the output — missing data looked like non-disclosure. It led to a wrong conclusion being written down about UOB and later retracted. |
| **Page-less** | The converted text carried no page markers. | No figure could earn a page-level citation, so nearly everything sat at "reported" rather than "confirmed". |
| **Repeated** | The same expensive, lossy read every session. | Slow, and the result was never durable. |

## The artifact

```jsonc
{
  "schemaVersion": 1,
  "slug": "sembcorp-sr2025",
  "sourceTitle": "Sembcorp Sustainability Report 2025",
  "sourceSha256": "…",          // detects a reissued report
  "pageCount": 26,
  "extractedAt": "2026-08-09",
  "extractor": "PyMuPDF 1.28.2",
  "emptyPages": [],             // image-only pages needing a visual read
  "pages": [
    { "page": 1, "chars": 3582, "text": "…", "tables": [ { "rows": [[…]] } ] }
  ]
}
```

Finding a figure is a grep over the artifact, and **the page number comes with
the hit** — which is what turns a citation from "reported" into "confirmed".
That is how Sembcorp's five IFRS S2 cross-industry figures became page-verified
to PDF page 20.

## Citing pages

`page` is the **PDF page index**, 1-based. Where a report's printed folio
differs, say so in `pageNote` rather than silently citing one as the other —
Sembcorp's Climate Risks metrics table is on PDF page 20 and that page carries
no printed folio, so its citation states exactly that.

## Known limits

- **Table detection is imperfect** on designed reports. Figures often survive in
  the page text even when `tables` is empty, so grep the text too — that is how
  the Sembcorp table was found.
- **Image-only pages** yield no text. They are listed in `emptyPages` and need a
  visual read; there is no OCR step here.
- The artifact stores extracted text, not interpreted values. Turning text into
  a figure is still a judgement, held to the same rules as every other number
  here: no inference, no derived values, cite or omit.
