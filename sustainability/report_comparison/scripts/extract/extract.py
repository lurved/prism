#!/usr/bin/env python3
"""
BATCH PDF EXTRACTION — run once per report, never again.

Why this exists
---------------
Figures were being re-read out of PDFs every session through Google Drive's
text conversion. That was wrong in three ways:

  1. LOSSY.     The converter silently truncates large files. UOB's report
                stopped at p.79 of a document whose data section starts at
                p.117; Meralco's 17-A cut off mid-word; its 52 MB integrated
                report returned nothing at all. None of that was visible in
                the output — it just looked like the data was missing, which
                led to a wrong conclusion being written down about UOB.
  2. PAGELESS.  The converted text carries no page markers, so no figure could
                ever earn a page-level citation. 185 of 236 figures sat at
                "reported" instead of "confirmed" purely because of this.
  3. REPEATED.  The same expensive, lossy read happened again every session.

This script reads the PDF properly with PyMuPDF and writes ONE durable
artifact per report: per-page text, detected tables, and provenance. The
artifact is committed. Nothing downstream ever touches a PDF again — you grep
the artifact, and the page number comes with the hit.

Usage
-----
    python3 extract.py <base64-json> <slug> [--title "..."] [--out DIR]

<base64-json> is what the Drive download tool leaves on disk: a JSON file with
a base64 `content` field. See README.md for the whole loop.

Artifacts land in data/extracted/<slug>.json.
"""
from __future__ import annotations

import argparse
import base64
import datetime as _dt
import hashlib
import json
import pathlib
import sys

try:
    import pymupdf
except ImportError:  # pragma: no cover - environment guard
    sys.exit("PyMuPDF is required:  pip3 install pymupdf")

SCHEMA_VERSION = 1


def decode_source(b64_json: pathlib.Path) -> tuple[bytes, str | None]:
    """Pull the PDF bytes out of a Drive download payload."""
    payload = json.loads(b64_json.read_text())
    content = payload.get("content")
    if not content:
        raise SystemExit(f"{b64_json}: no `content` field — not a Drive download payload?")
    return base64.b64decode(content), payload.get("title")


def extract(pdf_bytes: bytes, slug: str, title: str | None) -> dict:
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")

    pages = []
    for i in range(doc.page_count):
        page = doc[i]
        text = page.get_text()

        # Tables are stored separately from the flowing text. Report tables are
        # exactly what the Drive converter dropped, and they are where the GHG
        # figures live, so they are worth keeping structured even when the
        # detector is imperfect.
        tables = []
        try:
            for t in page.find_tables().tables:
                rows = [[(c or "").strip() for c in row] for row in t.extract()]
                # Skip decorative one-cell "tables" that carry no data.
                if len(rows) >= 1 and sum(len(c) for r in rows for c in r) > 0:
                    tables.append({"rows": rows, "nRows": t.row_count, "nCols": t.col_count})
        except Exception as exc:  # a bad table must not lose the page's text
            tables.append({"error": f"table detection failed: {exc}"})

        pages.append({
            # 1-indexed to match how a human cites a page. The whole point of
            # this artifact is that a citation can name a real page.
            "page": i + 1,
            "chars": len(text),
            "text": text,
            "tables": tables,
        })

    total_chars = sum(p["chars"] for p in pages)
    return {
        "schemaVersion": SCHEMA_VERSION,
        "slug": slug,
        "sourceTitle": title,
        # Lets a future run detect that the upstream PDF changed and the
        # artifact is stale, rather than trusting it forever.
        "sourceSha256": hashlib.sha256(pdf_bytes).hexdigest(),
        "sourceBytes": len(pdf_bytes),
        "pageCount": doc.page_count,
        "totalChars": total_chars,
        "extractedAt": _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%d"),
        "extractor": f"PyMuPDF {pymupdf.__doc__.split()[1] if pymupdf.__doc__ else '?'}",
        # A page that yields no text is almost certainly a scan or an image —
        # worth knowing, because it means figures there need a visual read.
        "emptyPages": [p["page"] for p in pages if p["chars"] == 0],
        "pages": pages,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("b64_json", type=pathlib.Path)
    ap.add_argument("slug")
    ap.add_argument("--title", default=None)
    ap.add_argument("--out", type=pathlib.Path, default=pathlib.Path("data/extracted"))
    args = ap.parse_args()

    pdf_bytes, drive_title = decode_source(args.b64_json)
    artifact = extract(pdf_bytes, args.slug, args.title or drive_title)

    args.out.mkdir(parents=True, exist_ok=True)
    dest = args.out / f"{args.slug}.json"
    dest.write_text(json.dumps(artifact, ensure_ascii=False, indent=1))

    empty = artifact["emptyPages"]
    print(
        f"{args.slug}: {artifact['pageCount']} pages, {artifact['totalChars']:,} chars"
        f"{f', {len(empty)} image-only pages' if empty else ''} -> {dest}"
    )


if __name__ == "__main__":
    main()
