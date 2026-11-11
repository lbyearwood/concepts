#!/usr/bin/env python3
"""Synchronise the approved GCSE 1.1 student Google Slides deck for offline viewing.

No Google resources are requested by students: only GitHub Actions contacts Google.
The original Google Slides presentation is never modified.
"""
from __future__ import annotations

import datetime as dt
import io
import json
import os
from pathlib import Path
import tempfile
import urllib.error
import urllib.request

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "data" / "slide-sync.json"
MAX_PDF_BYTES = 40 * 1024 * 1024
MAX_SLIDES = 180


def get_public_pdf(file_id: str) -> bytes:
    url = f"https://docs.google.com/presentation/d/{file_id}/export/pdf"
    request = urllib.request.Request(
        url, headers={"User-Agent": "CSRevision-SlideSync/1.0"}
    )
    with urllib.request.urlopen(request, timeout=70) as response:
        data = response.read(MAX_PDF_BYTES + 1)
    if len(data) > MAX_PDF_BYTES or not data.startswith(b"%PDF"):
        raise ValueError("Public export did not return a PDF (check sharing).")
    return data


def get_authenticated_pdf(file_id: str) -> bytes:
    """Optional fallback for a deck that disallows anonymous downloads.

    Make a Google Cloud service account, enable the Drive API, share only the
    student deck with the service account as Viewer, and save its credentials
    as a GitHub Actions repository secret GOOGLE_SERVICE_ACCOUNT_JSON.
    """
    secret = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    if not secret:
        raise RuntimeError(
            "Anonymous Google Slides PDF export failed. Configure the "
            "GOOGLE_SERVICE_ACCOUNT_JSON repository secret and share the "
            "student presentation with its service-account email."
        )
    from google.oauth2 import service_account
    from google.auth.transport.requests import AuthorizedSession

    info = json.loads(secret)
    credentials = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/drive.readonly"]
    )
    session = AuthorizedSession(credentials)
    response = session.get(
        f"https://www.googleapis.com/drive/v3/files/{file_id}/export",
        params={"mimeType": "application/pdf"},
        timeout=90,
    )
    response.raise_for_status()
    content = response.content
    if len(content) > MAX_PDF_BYTES or not content.startswith(b"%PDF"):
        raise ValueError("Authenticated Drive export did not return a PDF.")
    return content


def export_pdf(file_id: str) -> bytes:
    try:
        data = get_public_pdf(file_id)
        print("Downloaded the latest student slides using public export.")
        return data
    except (urllib.error.URLError, ValueError, TimeoutError) as exc:
        # Public viewing and public downloading are different permissions.
        # Never print Google credentials in logs.
        print(f"Public export unavailable ({type(exc).__name__}). Trying Drive API.")
        return get_authenticated_pdf(file_id)


def render_pdf(pdf_bytes: bytes, output: Path, title: str) -> bool:
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
            if unchanged and (output / "manifest.json").is_file():
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
        file_id = deck["googleFileId"]
        output = ROOT / deck["output"]
        if not output.resolve().is_relative_to((ROOT / "assets" / "slide-decks").resolve()):
            raise ValueError("Slide output must be within assets/slide-decks.")
        pdf = export_pdf(file_id)
        render_pdf(pdf, output, deck["title"])


if __name__ == "__main__":
    main()
