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
Point it at PDFs — a whole folder tree, or individual files:

    python3 extract.py ~/reports                     # every PDF beneath it
    python3 extract.py ~/reports/uob-sr2025.pdf      # one file
    python3 extract.py a.pdf b.pdf --out data/extracted

Folders are searched recursively, and a PDF is recognised by its bytes rather
than a `.pdf` suffix, because several reports in this corpus were uploaded
without one.

Slugs are derived from filenames; override for a single file with --slug. A
report whose bytes were already extracted is skipped even if the filename has
changed, so re-runs never fork an artifact in two.

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


def is_pdf(path: pathlib.Path) -> bool:
    """Decided by the file's first bytes, not its name — see gather()."""
    try:
        with path.open("rb") as fh:
            return fh.read(5) == b"%PDF-"
    except OSError:
        return False


def gather(inputs: list[pathlib.Path]) -> list[pathlib.Path]:
    """Expand folders into the PDFs beneath them.

    Two things about a real reports folder drove this. It has SUBFOLDERS — a
    Drive mount puts the reports under `AI-Data/documents`, so pointing at the
    top level must still find them; hence rglob. And some files carry NO `.pdf`
    EXTENSION: three reports in the current corpus (Sembcorp, IHH, Keppel) were
    uploaded without one, and the mount reproduces the name as-is. Selecting on
    the suffix silently skipped those — a missing report looks exactly like a
    non-disclosure downstream, which is the failure mode this whole pipeline
    exists to end. So membership is decided by the magic bytes.

    A folder therefore yields PDFs only. Drive JSON payloads still work, but
    must be named explicitly.
    """
    files: list[pathlib.Path] = []
    for p in inputs:
        if p.is_dir():
            files.extend(sorted(q for q in p.rglob("*") if q.is_file() and is_pdf(q)))
        else:
            files.append(p)
    if not files:
        raise SystemExit("No PDFs found.")
    return files


def existing_by_sha(out: pathlib.Path) -> dict[str, str]:
    """sha256 → slug for artifacts already written.

    Keyed on the SOURCE HASH rather than the slug so that the same report
    arriving under a different filename is recognised as already extracted
    instead of landing a second time under a second slug.

    Artifacts run to megabytes; the keys needed here are the first four in the
    file, so only the head is read.
    """
    index: dict[str, str] = {}
    for f in sorted(out.glob("*.json")):
        try:
            with f.open(encoding="utf-8", errors="replace") as fh:
                head = fh.read(4096)
        except OSError:
            continue
        m = re.search(r'"sourceSha256":\s*"([0-9a-f]{64})"', head)
        if m:
            index[m.group(1)] = f.stem
    return index


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
    # Skip work already done — the whole point is to extract once. A reissued
    # report has different bytes, so a different hash, and is re-extracted.
    seen = {} if args.force else existing_by_sha(args.out)

    for path in files:
        if not path.exists():
            print(f"  !! {path}: not found", file=sys.stderr)
            continue
        pdf_bytes, title = load_source(path)
        slug = args.slug or slugify(path.name)
        dest = args.out / f"{slug}.json"

        sha = hashlib.sha256(pdf_bytes).hexdigest()
        if sha in seen:
            prior = seen[sha]
            # Same bytes under a different name — a rename, a duplicate copy,
            # or a slug this repo already chose by hand. Extracting would fork
            # the artifact in two, so the first one stands.
            note = "unchanged" if prior == slug else f"identical to {prior}.json"
            print(f"  = {slug}: {note}, skipped")
            continue

        art = extract(pdf_bytes, slug, title)
        dest.write_text(json.dumps(art, ensure_ascii=False, indent=1))
        seen[sha] = slug  # two copies of one report in a single run
        empty = art["emptyPages"]
        print(
            f"  + {slug}: {art['pageCount']} pages, {art['totalChars']:,} chars"
            f"{f', {len(empty)} image-only' if empty else ''} -> {dest}"
        )


if __name__ == "__main__":
    main()
