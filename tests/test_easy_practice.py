"""Independently execute every Easy solution against authored console results."""
import ast
from collections import Counter
import json
from pathlib import Path
import unittest
from test_exam_expansion import run_console

ROOT=Path(__file__).resolve().parents[1]
PROBLEMS=json.loads((ROOT/'data/practice-problems.json').read_text(encoding='utf-8'))['problems']
GUIDES=json.loads((ROOT/'data/practice-tutorial-guides.json').read_text(encoding='utf-8'))['problems']
CASES=json.loads((ROOT/'tests/fixtures/easy-practice-cases.json').read_text(encoding='utf-8'))
CATEGORIES=json.loads((ROOT/'data/programming-problems.json').read_text(encoding='utf-8'))['practiceCategories']

class EasyPracticeTests(unittest.TestCase):
    def test_exact_easy_scope_and_complete_independent_cases(self):
        self.assertEqual(len(PROBLEMS),90)
        self.assertEqual(Counter(p['category'] for p in PROBLEMS),{c['id']:10 for c in CATEGORIES})
        self.assertEqual({p['collection'] for p in PROBLEMS},{'level1'})
        ids={p['id'] for p in PROBLEMS}
        self.assertEqual(len(ids),90)
        self.assertEqual(ids,set(GUIDES))
        self.assertEqual(ids,set(CASES))
        self.assertEqual(sum(len(c) for c in CASES.values()),191)
        for p in PROBLEMS:
            with self.subTest(problem=p['id']):
                tree=ast.parse(p['solution'])
                self.assertFalse(any(isinstance(n,(ast.FunctionDef,ast.ClassDef,ast.While,ast.ListComp,ast.DictComp,ast.Lambda)) for n in ast.walk(tree)))
                self.assertLessEqual(len(p['solution'].splitlines()),9)
                self.assertFalse(any(isinstance(n,ast.Import) and any(a.name!='random' for a in n.names) for n in ast.walk(tree)))
                self.assertNotIn('marks',p['question'],'Practice problems must not acquire invented OCR tariffs')
                self.assertEqual(p['question']['example']['output'],CASES[p['id']][0]['output'])
                guide=GUIDES[p['id']]
                self.assertEqual('\n'.join(l['code'] for l in guide['lines']),p['solution'])
                self.assertEqual(sum('question' in l for l in guide['lines']),3)
                self.assertEqual(sum('prediction' in l for l in guide['lines']),1)
                for line in guide['lines']:
                    self.assertGreaterEqual(len(' '.join(line['paragraphs']).split()),20)
                    for q in [line.get('question'),line.get('prediction')]:
                        if q:
                            self.assertEqual(sum(c['correct'] for c in q['choices']),1)
                            self.assertEqual(len(set(c['text'] for c in q['choices'])),3)

def execution_case(problem):
    def verify(self):
        for index,case in enumerate(CASES[problem['id']]):
            with self.subTest(case=index):
                output,_,_=run_console(problem,case)
                self.assertEqual(output,case['output'])
    return verify
for problem in PROBLEMS:
    setattr(EasyPracticeTests,'test_'+problem['id'].replace('-','_'),execution_case(problem))

if __name__=='__main__': unittest.main()
