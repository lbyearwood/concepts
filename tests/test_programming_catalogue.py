"""Practice navigation and exam tariff contracts, independent of tutorial code."""
import copy
import importlib.util
import json
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('problem_builder', ROOT / 'scripts/build-problems.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class Buttons(HTMLParser):
    def __init__(self):
        super().__init__()
        self.buttons = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        if tag == 'button':
            self.current = dict(attrs)
            self.current['text'] = ''
            self.buttons.append(self.current)

    def handle_data(self, text):
        if self.current is not None:
            self.current['text'] += text

    def handle_endtag(self, tag):
        if tag == 'button':
            self.current = None


class ProgrammingCatalogueTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'data/programming-problems.json').read_text(encoding='utf-8'))

    def test_console_categories_and_difficulty_identity(self):
        self.assertEqual(self.data['interface'], 'console')
        self.assertEqual([c['title'] for c in self.data['practiceCategories']], [
            'Science', 'Maths', 'Finance', 'Computing', 'Gaming', 'Creative & Media',
            'Social & Community', 'Health & Fitness', 'Environment & Sustainability'])
        parser = Buttons()
        parser.feed(builder.output())
        collections = [b for b in parser.buttons if 'data-collection' in b]
        self.assertEqual([(b['data-collection'], b['text']) for b in collections], [
            ('exam', 'Exam questions'), ('level1', 'Easy'), ('level2', 'Medium'), ('level3', 'Hard')])
        categories = [b for b in parser.buttons if 'data-practice-category' in b]
        self.assertEqual(len(categories), 9)
        self.assertEqual(sum(b['aria-selected'] == 'true' for b in categories), 1)
        for button in categories:
            self.assertEqual(button['role'], 'tab')
            self.assertEqual(button['aria-controls'], 'category-panel')
            self.assertEqual(button['id'], 'practice-category-' + button['data-practice-category'])

    def test_original_tariffs_and_all_point_totals(self):
        self.assertEqual([p['id'] for p in self.data['problems']], ['problem-' + str(i) for i in range(1, 65)])
        self.assertEqual([p['question']['marks'] for p in self.data['problems'][:22]],
                         [6, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 5, 6, 6, 6, 5, 4, 6, 6, 6])
        for problem in self.data['problems']:
            builder.validate_assessment(problem['question'])

    def test_source_and_authored_allocations_are_distinct(self):
        sourced = [p for p in self.data['problems'] if p['question']['marking']['basis'] == 'ebook']
        self.assertEqual([p['id'] for p in sourced], ['problem-' + str(i) for i in range(2, 14)])
        for problem in sourced:
            source = problem['question']['marking']
            self.assertTrue(source['sourceTab'].startswith('t.'))
            self.assertTrue(source['sourceTitle'].startswith('[' + str(problem['question']['marks']) + ']'))
        # The mismatched source prompt is not claimed as a verified string-search scheme.
        self.assertEqual(self.data['problems'][0]['question']['marking']['basis'], 'csrevision')

    def test_missing_invalid_or_unjustified_marks_are_rejected(self):
        question = self.data['problems'][0]['question']
        for marks in (None, True, 0, 7, '6'):
            bad = copy.deepcopy(question)
            bad['marks'] = marks
            with self.assertRaises(ValueError):
                builder.validate_assessment(bad)
        bad = copy.deepcopy(question)
        bad['marking']['points'].pop()
        with self.assertRaises(ValueError):
            builder.validate_assessment(bad)


if __name__ == '__main__':
    unittest.main()
