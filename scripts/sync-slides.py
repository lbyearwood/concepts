#!/usr/bin/env python3
"""Render approved repository PDFs; publish only complete, validated decks."""
from __future__ import annotations

import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile

import pymupdf as fitz
from PIL import Image, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "data" / "slide-sync.json"
MAX_PDF_BYTES = 10 * 1024 * 1024
MAX_SLIDES = 180
MAX_PAGE_PIXELS = 20_000_000
RENDER_PROFILE = f"webp-v2-scale1.7-q87-m6-pymupdf{fitz.VersionBind}-pillow{pillow_version}"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_manifest(output: Path) -> dict:
    try:
        value = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except (OSError, ValueError):
        return {}


def cache_valid(manifest: dict, output: Path, fingerprint: str, title: str, source: str) -> bool:
    names = manifest.get("slides", [])
    if (manifest.get("inputSha256") != fingerprint or
            manifest.get("renderProfile") != RENDER_PROFILE or
            manifest.get("title") != title or manifest.get("source") != source or
            not isinstance(names, list) or not 1 <= len(names) <= MAX_SLIDES or
            names != [f"slide-{i:03}.webp" for i in range(1, len(names) + 1)] or
            manifest.get("slideCount") != len(names)):
        return False
    hashes = manifest.get("imageSha256", {})
    if not isinstance(hashes, dict):
        return False
    return all((output / name).is_file() and
               digest((output / name).read_bytes()) == hashes.get(name) for name in names)


def install_deck(stage: Path, output: Path, backup: Path) -> None:
    """Same-filesystem directory swap, restoring the old deck on install failure.

    CI never commits or deploys unless this whole script succeeds. The backup
    also protects local callers from a failed second rename.
    """
    existed = output.exists()
    if existed:
        output.rename(backup)
    try:
        stage.rename(output)
    except BaseException:
        if existed:
            backup.rename(output)
        raise


def render_pdf(pdf_bytes: bytes, output: Path, title: str, source: str) -> bool:
    if not 5 <= len(pdf_bytes) <= MAX_PDF_BYTES or not pdf_bytes.startswith(b"%PDF-"):
        raise ValueError("Input is not a PDF within the 10 MiB limit; existing deck preserved.")
    fingerprint = digest(pdf_bytes)
    previous = read_manifest(output)
    if cache_valid(previous, output, fingerprint, title, source):
        print(f"Unchanged PDF and verified images: {title}; rendering skipped.")
        return False

    output.parent.mkdir(parents=True, exist_ok=True)
    with fitz.open(stream=pdf_bytes, filetype="pdf") as pdf:
        if pdf.needs_pass or not 1 <= pdf.page_count <= MAX_SLIDES:
            raise ValueError("Locked PDF or unexpected slide count; existing deck preserved.")
        with tempfile.TemporaryDirectory(prefix=".slide-render-", dir=output.parent) as td:
            workspace = Path(td)
            stage = workspace / "new"
            if output.exists():
                shutil.copytree(output, stage)
            else:
                stage.mkdir()
            for old in stage.glob("slide-*.webp"):
                old.unlink()
            filenames = []
            hashes = {}
            for number, page in enumerate(pdf, start=1):
                rect = page.rect * fitz.Matrix(1.7, 1.7)
                if rect.width <= 0 or rect.height <= 0 or rect.width * rect.height > MAX_PAGE_PIXELS:
                    raise ValueError("Slide dimensions exceed the safe rendering limit.")
                filename = f"slide-{number:03}.webp"
                pix = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), colorspace=fitz.csRGB, alpha=False)
                with Image.frombytes("RGB", (pix.width, pix.height), pix.samples) as picture:
                    picture.save(stage / filename, format="WEBP", quality=87, method=6)
                with Image.open(stage / filename) as check:
                    check.verify()
                filenames.append(filename)
                hashes[filename] = digest((stage / filename).read_bytes())

            same_images = (previous.get("slides") == filenames and
                           all((output / name).is_file() and
                               digest((output / name).read_bytes()) == hashes[name] for name in filenames))
            updated = (previous.get("updatedAt") if same_images else None) or dt.datetime.now(
                dt.timezone.utc).isoformat(timespec="microseconds")
            manifest = dict(title=title, source=source, slideCount=len(filenames), slides=filenames,
                            updatedAt=updated, inputSha256=fingerprint,
                            renderProfile=RENDER_PROFILE, imageSha256=hashes)
            (stage / "manifest.json").write_text(
                json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            install_deck(stage, output, workspace / "previous")
            print(f"Validated {len(filenames)} slides: {title}" +
                  (" (images unchanged; fingerprint refreshed)." if same_images else "."))
            return True


def approved_decks(config: dict, root: Path) -> list[tuple[dict, Path, Path]]:
    approved_root = (root / "assets" / "slide-decks").resolve()
    result, seen = [], set()
    for deck in config["decks"]:
        if deck.get("approvedStudent") is not True:
            raise ValueError("Every configured deck must be an explicitly approved student deck.")
        key = deck["key"]
        if not re.fullmatch(r"[a-z0-9-]+", key) or key in seen:
            raise ValueError("Deck keys must be unique, lowercase letters/numbers/hyphens.")
        output = (root / deck["output"]).resolve()
        source_pdf = (root / deck["sourcePdf"]).resolve()
        if (output == approved_root or not output.is_relative_to(approved_root) or
                source_pdf.parent != output or source_pdf.name != "bootstrap.pdf" or
                any(output == old_output for _, old_output, _ in result)):
            raise ValueError("Each deck needs its own output below assets/slide-decks and bootstrap.pdf.")
        seen.add(key)
        result.append((deck, output, source_pdf))
    return result


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    for deck, output, source_pdf in approved_decks(config, ROOT):
        if source_pdf.stat().st_size > MAX_PDF_BYTES:
            raise ValueError("PDF exceeds the 10 MiB limit.")
        render_pdf(source_pdf.read_bytes(), output, deck["title"], "repository-pdf")


if __name__ == "__main__":
    main()
