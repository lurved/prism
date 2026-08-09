#!/usr/bin/env python3
"""
BATCH PDF EXTRACTION — run once per report, never again.

Why this exists
---------------
Figures used to be re-read out of PDFs every session through Google Drive's
text conversion. That was wrong in three ways:

  1. LOSSY.     The converter silently truncates large files. UOB's report
                stopped at p.79 of a document whose data section starts at
                p.117; Meralco's 17-A cut off mid-word; its 52 MB integrated
                report returned nothing at all. None of that was visible in
                the output — it just looked like the data was missing, which
                led to a wrong conclusion being written down about UOB.
  2. PAGELESS.  The converted text carried no page markers, so no figure could
                ever earn a page-level citation.
  3. REPEATED.  The same expensive, lossy read happened again every session.

This reads PDFs properly with PyMuPDF and writes ONE durable artifact per
report. Artifacts are committed; nothing downstream touches a PDF again. You
grep the artifact, and the page number comes with the hit.

Usage
-----
Point it at PDFs — a whole folder, or individual files:

    python3 extract.py ~/reports                     # every PDF in the folder
    python3 extract.py ~/reports/uob-sr2025.pdf      # one file
    python3 extract.py a.pdf b.pdf --out data/extracted

Slugs are derived from filenames; override for a single file with --slug.

PDFs do NOT belong in the repo — they are large and binary. Keep them wherever
you like locally and commit only `data/extracted/*.json`, which is small,
diffable and greppable.

It also accepts a Google Drive download payload (a JSON file with a base64
`content` field) for the case where the PDF only exists in Drive.
"""
from __future__ import annotations

import argparse
import base64
import datetime as _dt
import hashlib
import json
import pathlib
import re
import sys

try:
    import pymupdf
except ImportError:  # pragma: no cover - environment guard
    sys.exit("PyMuPDF is required:  pip3 install pymupdf")

SCHEMA_VERSION = 1


def slugify(name: str) -> str:
    """Filename → stable slug. 'UOB SR2025.pdf' → 'uob-sr2025'."""
    s = re.sub(r"\.pdf$", "", name, flags=re.I)
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def load_source(path: pathlib.Path) -> tuple[bytes, str | None]:
    """Return (pdf_bytes, title) from a .pdf or a Drive download payload."""
    raw = path.read_bytes()
    if raw[:5] == b"%PDF-":
        return raw, path.name
    # Not a PDF — try a Drive payload with base64 `content`.
    try:
        payload = json.loads(raw)
    except Exception:
        raise SystemExit(f"{path}: not a PDF and not a Drive download payload.")
    content = payload.get("content")
    if not content:
        raise SystemExit(f"{path}: JSON has no base64 `content` field.")
    return base64.b64decode(content), payload.get("title")


def extract(pdf_bytes: bytes, slug: str, title: str | None) -> dict:
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")

    pages = []
    for i in range(doc.page_count):
        page = doc[i]
        text = page.get_text()

        # Tables are kept separately from the flowing text. Report tables are
        # exactly what the Drive converter dropped, and they are where the GHG
        # figures live, so they are worth keeping structured even when the
        # detector is imperfect.
        tables = []
        try:
            for t in page.find_tables().tables:
                rows = [[(c or "").strip() for c in row] for row in t.extract()]
                if rows and sum(len(c) for r in rows for c in r) > 0:
                    tables.append({"rows": rows, "nRows": t.row_count, "nCols": t.col_count})
        except Exception as exc:  # a bad table must not lose the page's text
            tables.append({"error": f"table detection failed: {exc}"})

        pages.append({
            # 1-indexed, matching how a human cites a page. The whole point of
            # this artifact is that a citation can name a real page.
            "page": i + 1,
            "chars": len(text),
            "text": text,
            "tables": tables,
        })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "slug": slug,
        "sourceTitle": title,
        # Lets a later run detect that the upstream PDF changed and the
        # artifact is stale, rather than trusting it forever.
        "sourceSha256": hashlib.sha256(pdf_bytes).hexdigest(),
        "sourceBytes": len(pdf_bytes),
        "pageCount": doc.page_count,
        "totalChars": sum(p["chars"] for p in pages),
        "extractedAt": _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%d"),
        "extractor": f"PyMuPDF {pymupdf.__doc__.split()[1].rstrip(':') if pymupdf.__doc__ else '?'}",
        # A page yielding no text is almost certainly a scan or an image —
        # worth knowing, because figures there need a visual read, not a grep.
        "emptyPages": [p["page"] for p in pages if p["chars"] == 0],
        "pages": pages,
    }


def gather(inputs: list[pathlib.Path]) -> list[pathlib.Path]:
    files: list[pathlib.Path] = []
    for p in inputs:
        if p.is_dir():
            files.extend(sorted(q for q in p.iterdir() if q.suffix.lower() == ".pdf"))
        else:
            files.append(p)
    if not files:
        raise SystemExit("No PDFs found.")
    return files


def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("inputs", nargs="+", type=pathlib.Path, help="PDF files or a folder of PDFs")
    ap.add_argument("--slug", default=None, help="override the slug (single input only)")
    ap.add_argument("--out", type=pathlib.Path, default=pathlib.Path("data/extracted"))
    ap.add_argument("--force", action="store_true", help="re-extract even if unchanged")
    args = ap.parse_args()

    files = gather(args.inputs)
    if args.slug and len(files) > 1:
        raise SystemExit("--slug only makes sense with a single input.")

    args.out.mkdir(parents=True, exist_ok=True)
    for path in files:
        if not path.exists():
            print(f"  !! {path}: not found", file=sys.stderr)
            continue
        pdf_bytes, title = load_source(path)
        slug = args.slug or slugify(path.name)
        dest = args.out / f"{slug}.json"

        # Skip work that has already been done — the whole point is to extract
        # once. A changed PDF has a different hash and is re-extracted.
        if dest.exists() and not args.force:
            try:
                prev = json.loads(dest.read_text())
                if prev.get("sourceSha256") == hashlib.sha256(pdf_bytes).hexdigest():
                    print(f"  = {slug}: unchanged, skipped")
                    continue
            except Exception:
                pass

        art = extract(pdf_bytes, slug, title)
        dest.write_text(json.dumps(art, ensure_ascii=False, indent=1))
        empty = art["emptyPages"]
        print(
            f"  + {slug}: {art['pageCount']} pages, {art['totalChars']:,} chars"
            f"{f', {len(empty)} image-only' if empty else ''} -> {dest}"
        )


if __name__ == "__main__":
    main()
