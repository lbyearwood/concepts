"""Keep each prepared audio clip and tutor explanation paired with its actual code."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class TutorialGuideTests(unittest.TestCase):
    def test_all_exam_guides_match_solutions_and_keep_the_approved_pilot(self):
        guides = json.loads((ROOT / 'data/tutorial-guides.json').read_text(encoding='utf-8'))['problems']
        catalogue = json.loads((ROOT / 'data/programming-problems.json').read_text(encoding='utf-8'))['problems']
        self.assertEqual(set(guides), {p['id'] for p in catalogue})
        for problem in catalogue:
            guide = guides[problem['id']]
            self.assertEqual('\n'.join(line['code'] for line in guide['lines']), problem['solution'])
            for line in guide['lines']:
                self.assertTrue(line['title'] and line['watchOut'])
                self.assertGreaterEqual(len(' '.join(line['paragraphs']).split()), 20)
            if guide.get('stageReviews'):
                self.assertGreaterEqual(sum('question' in line for line in guide['lines']), 3)
                self.assertIn(sum('prediction' in line for line in guide['lines']), (1, 2))
                mapped = [line['step'] for line in guide['lines']]
                self.assertEqual(mapped, sorted(mapped))
                self.assertTrue(all(0 <= step < len(problem['steps']) for step in mapped))
        original = next(p for p in catalogue if p['id'] == 'problem-1')
        lines = guides['problem-1']['lines']
        self.assertEqual('\n'.join(line['code'] for line in lines), original['solution'])
        self.assertEqual(len(lines), 10)
        self.assertEqual(sum('question' in line for line in lines), 5)
        self.assertEqual([index for index, line in enumerate(lines) if 'prediction' in line], [1, 4])
        checks = [line[kind] for line in lines for kind in ('question', 'prediction') if kind in line]
        self.assertEqual(len({question['id'] for question in checks}), 7)
        for question in checks:
            self.assertTrue(question['prompt'])
            self.assertEqual(sum(choice['correct'] for choice in question['choices']), 1)
        for line in lines:
            self.assertEqual(line['narration'], line['title'] + '. ' + ' '.join(line['paragraphs']) + ' Remember: ' + line['watchOut'])

    def test_all_ten_clips_are_complete_and_match_the_saved_transcripts(self):
        guide = json.loads((ROOT / 'data/tutorial-guides.json').read_text(encoding='utf-8'))['problems']['problem-1']
        manifest = json.loads((ROOT / 'assets/tutorial-audio/linear-search-string/manifest.json').read_text(encoding='utf-8'))
        self.assertEqual(set(manifest['lines']), {str(n) for n in range(1, 11)})
        self.assertEqual(manifest['voice'], guide['voice']['name'])
        for number, line in enumerate(guide['lines'], 1):
            with self.subTest(line=number):
                entry = manifest['lines'][str(number)]
                data = (ROOT / line['audio']).read_bytes()
                self.assertGreater(len(data), 10000)
                self.assertTrue(data[:3] == b'ID3' or (data[0] == 255 and data[1] & 224 == 224))
                self.assertEqual(hashlib.sha256(data).hexdigest(), entry['sha256'])
                transcript = line['narration'].replace('input()', 'the input function').replace('range(len(text))', 'a range based on that length')
                transcript = transcript.replace('len(text)', 'the length of text').replace('text[i]', 'indexing into text')
                self.assertEqual(transcript, entry['transcript'])
                identity = transcript + guide['voice']['name'] + manifest['model_sha256'] + manifest['voices_sha256']
                self.assertEqual(hashlib.sha256(identity.encode()).hexdigest(), entry['identity'])
                self.assertGreater(entry['seconds'], 2)
                self.assertLess(entry['seconds'], 90)


if __name__ == '__main__':
    unittest.main()
