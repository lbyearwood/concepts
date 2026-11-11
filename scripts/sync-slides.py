#!/usr/bin/env python3
"""Render approved PDFs committed by Google Apps Script into self-hosted slides.

Students load these files from CSRevision and never contact Google.
The Google Apps Script (run as the presentation owner's account) updates the
PDF in GitHub whenever the student presentation is changed.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
import tempfile

import pymupdf as fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "data" / "slide-sync.json"
MAX_PDF_BYTES = 40 * 1024 * 1024
MAX_SLIDES = 180


def render_pdf(pdf_bytes: bytes, output: Path, title: str, source: str) -> bool:
    output.mkdir(parents=True, exist_ok=True)
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        if pdf.page_count == 0 or pdf.page_count > MAX_SLIDES:
            raise ValueError("Unexpected slide count; refusing to overwrite live deck.")

        with tempfile.TemporaryDirectory(prefix="csrevision-slides-") as td:
            temp = Path(td)
            filenames: list[str] = []
            for number, page in enumerate(pdf, start=1):
                filename = f"slide-{number:03}.webp"
                filenames.append(filename)
                pix = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), colorspace=fitz.csRGB, alpha=False)
                picture = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                picture.save(temp / filename, format="WEBP", quality=87, method=6)

            previous = sorted(p.name for p in output.glob("slide-*.webp"))
            unchanged = previous == filenames and all(
                (output / name).read_bytes() == (temp / name).read_bytes()
                for name in filenames
            )
            manifest_path = output / "manifest.json"
            if unchanged and manifest_path.is_file():
                old_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                if old_manifest.get("source") == source:
                    print(f"No slide changes: {len(filenames)} slides already current.")
                    return False

            # Render and validate ALL pages before replacing the public files.
            for old in output.glob("slide-*.webp"):
                if old.name not in filenames:
                    old.unlink()
            for filename in filenames:
                (temp / filename).replace(output / filename)
            manifest = {
                "title": title,
                "source": source,
                "slideCount": len(filenames),
                "slides": filenames,
                "updatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            }
            (output / "manifest.json").write_text(
                json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            print(f"Updated {len(filenames)} self-hosted slides.")
            return True
    finally:
        pdf.close()


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    decks = config["decks"]
    for deck in decks:
        output = ROOT / deck["output"]
        source_pdf = ROOT / deck["sourcePdf"]
        approved_root = (ROOT / "assets" / "slide-decks").resolve()
        if not output.resolve().is_relative_to(approved_root):
            raise ValueError("Slide output must be within assets/slide-decks.")
        if not source_pdf.resolve().is_relative_to(approved_root):
            raise ValueError("Input PDF must be within assets/slide-decks.")
        if not source_pdf.is_file():
            raise FileNotFoundError(f"No approved PDF at {source_pdf}")
        pdf = source_pdf.read_bytes()
        if len(pdf) > MAX_PDF_BYTES or not pdf.startswith(b"%PDF"):
            raise ValueError("Local source is missing, too large, or not a valid PDF.")
        render_pdf(pdf, output, deck["title"], "repository-pdf")


if __name__ == "__main__":
    main()
