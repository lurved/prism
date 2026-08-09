# Batch PDF extraction

**Extract once. Commit the artifact. Never read the PDF again.**

Figures used to be re-read out of PDFs every session through Google Drive's
text conversion. That was lossy, page-less and repeated. This replaces it.

## What was wrong with the old way

| | Problem | Consequence |
|---|---|---|
| **Lossy** | The converter silently truncates. UOB's report stopped at **p.79** of a document whose data section starts at **p.117**. Meralco's 17-A cut off mid-word. Its 52 MB integrated report returned **nothing at all**. | Invisible in the output — missing data looked like non-disclosure. It led to a wrong conclusion being written down about UOB and later retracted. |
| **Page-less** | The converted text carries no page markers. | No figure could earn a page-level citation. **185 of 236** figures sat at "reported" rather than "confirmed" purely because of this. |
| **Repeated** | The same expensive, lossy read happened every session. | Slow, and the result was never durable. |

## What this does instead

`extract.py` reads the PDF with PyMuPDF and writes **one durable artifact per
report** to `data/extracted/<slug>.json`:

```jsonc
{
  "schemaVersion": 1,
  "slug": "sembcorp-sr2025",
  "sourceTitle": "Sembcorp Sustainability Report 2025",
  "sourceSha256": "…",          // detects that the upstream PDF changed
  "pageCount": 26,
  "extractedAt": "2026-08-09",
  "extractor": "PyMuPDF 1.28.2",
  "emptyPages": [],             // image-only pages needing a visual read
  "pages": [
    { "page": 1, "chars": 3582, "text": "…", "tables": [ { "rows": [[…]] } ] }
  ]
}
```

The artifact is committed. Finding a figure is then a grep over it, and **the
page number comes with the hit** — which is what turns a citation from
"reported" into "confirmed".

## Running it

Drive is the only reachable source: company domains are blocked by this
environment's network policy (the proxy returns 403 on CONNECT), so the PDFs
cannot be fetched from `dbs.com`, `uobgroup.com` and the rest.

1. **Download** the PDF with the Drive tool:
   `mcp__Google_Drive__download_file_content(fileId)`.
   The base64 payload is too large for a tool result, so it is written to a
   file on disk and the path is reported. That is the behaviour we want —
   none of it passes through context.

2. **Extract**:
   ```bash
   python3 scripts/extract/extract.py <path-to-downloaded-json> <slug>
   ```

3. **Commit** `data/extracted/<slug>.json`.

Requires `pip3 install pymupdf`.

## The 10 MB ceiling

Drive refuses to download files over 10 MB, which currently blocks:

| Report | Size |
|---|---|
| OCBC SR2025 | 24 MB |
| DBS SR2025 | 18.9 MB |
| Raffles AR2025 | 17 MB |
| IHH SR2025 | 15 MB |
| UOB SR2025 · SMRT SR2024/25 | 14 MB |
| CLP SR2025 · UOB AR2025 | 12.9 MB |
| Meralco Integrated Report | 52 MB |

**To bring one of those in:** split it to the pages that matter and upload the
extract to the same Drive folder — anything under 10 MB works, and a 10-page
slice is a few hundred KB. The section you need is usually the ESG performance
tables at the back.

This is also the *better* workflow even without the ceiling: a 10-page slice
extracts cleanly and gives precise page numbers, where a 200-page report
produces a large artifact and weaker table detection.

## Citing pages

`page` in an artifact is the **PDF page index**, 1-based. Where a report's
printed folio differs, record that in `pageNote` rather than silently citing
one as the other — Sembcorp's Climate Risks metrics table is on PDF page 20 and
the page carries no printed folio, so the citation says exactly that.

## Known limits

- **Table detection is imperfect** on designed reports. Figures often survive
  in the page text even when `tables` is empty, so grep the text too.
- **Image-only pages** yield no text. They appear in `emptyPages` and need a
  visual read; there is no OCR step here.
- The artifact stores raw extracted text, not interpreted values. Turning text
  into a figure is still a human judgement, held to the same rules as every
  other number in this project: no inference, no derived values, cite or omit.
