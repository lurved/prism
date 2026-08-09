# Batch PDF extraction

**Extract once. Commit the artifact. Never read the PDF again.**

## The workflow

Download the reports wherever you like locally, then:

```bash
pip3 install pymupdf
python3 scripts/extract/extract.py ~/reports          # every PDF in the folder
git add data/extracted && git commit -m "extract: FY2025 reports"
```

That's it. One artifact per report lands in `data/extracted/<slug>.json`, and
everything downstream reads those instead of PDFs.

**Do not commit the PDFs.** They're large and binary; the repo stays clean with
just the JSON artifacts, which are small, diffable and greppable. Keep the PDFs
on your machine — the artifacts record a SHA-256 of each source, so a later run
can tell whether a report has been reissued.

Re-running is free: unchanged files are skipped by hash. `--force` overrides.

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
