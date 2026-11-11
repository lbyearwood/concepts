"""Independent conversion and last-working-deck tests using small synthetic PDFs."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("slides", Path(__file__).resolve().parents[1] / "scripts/sync-slides.py")
slides = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(slides)


def pdf_bytes(colours, subject=""):
    with slides.fitz.open() as pdf:
        for colour in colours:
            page = pdf.new_page(width=120, height=70)
            page.draw_rect(page.rect, color=colour, fill=colour)
        pdf.set_metadata({"subject": subject})
        return pdf.tobytes()


class SlideSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="csrevision-test-")
        self.addCleanup(self.temp.cleanup)
        self.output = Path(self.temp.name) / "deck"
        self.red, self.blue, self.green = (1, 0, 0), (0, 0, 1), (0, 1, 0)
        self.pdf = pdf_bytes([self.red, self.blue])
        self.render(self.pdf)

    def render(self, value):
        return slides.render_pdf(value, self.output, "Test lesson", "repository-pdf")

    def snapshot(self):
        return {p.name: p.read_bytes() for p in self.output.iterdir()}

    def manifest(self):
        return json.loads((self.output / "manifest.json").read_text())

    def test_unchanged_skips_pdf_parser_and_preserves_all_bytes(self):
        before = self.snapshot()
        with patch.object(slides.fitz, "open", side_effect=AssertionError("PDF was reopened")):
            self.assertFalse(self.render(self.pdf))
        self.assertEqual(before, self.snapshot())

    def test_add_reorder_remove_uses_new_slide_order_and_deletes_stale_files(self):
        red = (self.output / "slide-001.webp").read_bytes()
        blue = (self.output / "slide-002.webp").read_bytes()
        self.render(pdf_bytes([self.blue, self.red, self.green]))
        self.assertEqual(3, self.manifest()["slideCount"])
        self.assertEqual(blue, (self.output / "slide-001.webp").read_bytes())
        self.assertEqual(red, (self.output / "slide-002.webp").read_bytes())
        self.render(pdf_bytes([self.red]))
        self.assertEqual(["slide-001.webp"], self.manifest()["slides"])
        self.assertFalse((self.output / "slide-003.webp").exists())
        self.assertFalse((self.output / "slide-002.webp").exists())

    def test_metadata_only_pdf_keeps_image_version(self):
        version = self.manifest()["updatedAt"]
        self.render(pdf_bytes([self.red, self.blue], "metadata changed"))
        self.assertEqual(version, self.manifest()["updatedAt"])

    def test_invalid_export_preserves_last_working_deck(self):
        before = self.snapshot()
        for value in (b"<html>login</html>", b"%PDF-broken", b"%PDF-" + bytes(slides.MAX_PDF_BYTES)):
            with self.assertRaises(Exception):
                self.render(value)
            self.assertEqual(before, self.snapshot())

    def test_render_failure_after_first_page_preserves_last_deck(self):
        before = self.snapshot()
        original = slides.Image.Image.save
        count = 0

        def fail_second(picture, *args, **kwargs):
            nonlocal count
            count += 1
            if count == 2:
                raise OSError("Simulated disk failure")
            return original(picture, *args, **kwargs)

        with patch.object(slides.Image.Image, "save", fail_second):
            with self.assertRaises(OSError):
                self.render(pdf_bytes([self.green, self.red]))
        self.assertEqual(before, self.snapshot())

    def test_install_failure_restores_previous_directory(self):
        before = self.snapshot()
        original = Path.rename

        def fail_install(path, target):
            if path.name == "new":
                raise OSError("Simulated directory install failure")
            return original(path, target)

        with patch.object(Path, "rename", fail_install):
            with self.assertRaises(OSError):
                self.render(pdf_bytes([self.green]))
        self.assertEqual(before, self.snapshot())

    def test_missing_image_is_repaired_even_with_unchanged_pdf(self):
        original = (self.output / "slide-002.webp").read_bytes()
        (self.output / "slide-002.webp").unlink()
        self.assertTrue(self.render(self.pdf))
        self.assertEqual(original, (self.output / "slide-002.webp").read_bytes())

    def test_unapproved_and_escaping_paths_rejected(self):
        root = Path(self.temp.name)
        base = dict(key="pilot", approvedStudent=True, output="assets/slide-decks/1-1",
                    sourcePdf="assets/slide-decks/1-1/bootstrap.pdf")
        for change in ({"approvedStudent": False}, {"output": "../elsewhere"},
                       {"sourcePdf": "../private.pdf"}):
            with self.assertRaises(ValueError):
                slides.approved_decks({"decks": [dict(base, **change)]}, root)


if __name__ == "__main__":
    unittest.main()
