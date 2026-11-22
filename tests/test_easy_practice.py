"""Independently execute every Easy solution against authored console results."""
import ast
import builtins
from collections import Counter
import contextlib
import io
import json
from pathlib import Path
import re
import sys
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
        self.assertEqual(sum(len(c) for c in CASES.values()),252)
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
                    self.assertGreaterEqual(len(' '.join(line['paragraphs']).split()),17)
                    for q in [line.get('question'),line.get('prediction')]:
                        if q:
                            self.assertEqual(sum(c['correct'] for c in q['choices']),1)
                            self.assertEqual(len(set(c['text'] for c in q['choices'])),3)

    def test_complete_plain_language_briefs_and_labelled_reproducible_values(self):
        def prose(value):
            if isinstance(value,str):
                yield value
            elif isinstance(value,list):
                for item in value:
                    yield from prose(item)
            elif isinstance(value,dict):
                for key,item in value.items():
                    if key not in {'code','id','type','example'}:
                        yield from prose(item)
        for p in PROBLEMS:
            with self.subTest(problem=p['id']):
                self.assertEqual(p['writingStandard'],'developer-13-plain')
                self.assertTrue(p['question']['context'])
                self.assertGreaterEqual(len(p['question']['requirements']),3)
                for text in [*prose(p['question']),*prose(GUIDES[p['id']]),*[b['text'] for s in p['steps'] for b in s['blocks'] if b['type']!='code']]:
                    self.assertNotIn(':',text)
                    self.assertNotRegex(text,re.compile(r'\b(?:you|your|assume|non-negative|kelvin)\b',re.I))
                example=p['question']['example']
                self.assertEqual(example['inputs'],CASES[p['id']][0]['inputs'])
                self.assertEqual(len(example['inputLabels']),len(example['inputs']))
                self.assertEqual(len(set(example['inputLabels'])),len(example['inputLabels']))
                self.assertTrue(all(label and ':' not in label for label in example['inputLabels']))
                self.assertTrue(example['inputs'] or example.get('given'))
                self.assertNotIn(':',example['output'])
                if example.get('given'):
                    assigned=ast.literal_eval(ast.parse(p['solution']).body[0].value)
                    shown=ast.literal_eval(example['given'][example['given'].index('['):])
                    self.assertEqual(shown,assigned,'The supplied list must be the exact list used by the solution')

    def test_independent_cases_exercise_both_outcomes_of_every_decision(self):
        for p in PROBLEMS:
            branches={node.lineno:node.test for node in ast.walk(ast.parse(p['solution'])) if isinstance(node,ast.If)}
            if not branches:
                continue
            seen={line:set() for line in branches}
            for case in CASES[p['id']]:
                code=p['solution']
                if 'patch' in case:
                    old,new=case['patch']
                    self.assertEqual(code.count(old),1)
                    code=code.replace(old,new)
                inputs=iter(case['inputs'])
                ticks=0
                def trace(frame,event,arg):
                    nonlocal ticks
                    if frame.f_code.co_filename==p['id'] and event=='line':
                        ticks+=1
                        if ticks>1000:
                            raise AssertionError('Easy solution did not terminate')
                        if frame.f_lineno in branches:
                            expression=compile(ast.Expression(branches[frame.f_lineno]),p['id']+'-condition','eval')
                            seen[frame.f_lineno].add(bool(eval(expression,frame.f_globals,frame.f_locals)))
                    return trace
                previous=sys.gettrace()
                scope={'__builtins__':dict(vars(builtins),input=lambda prompt='':next(inputs))}
                output=io.StringIO()
                try:
                    sys.settrace(trace)
                    with contextlib.redirect_stdout(output):
                        exec(compile(code,p['id'],'exec'),scope)
                finally:
                    sys.settrace(previous)
                self.assertEqual(output.getvalue(),case['output'])
            for line,outcomes in seen.items():
                with self.subTest(problem=p['id'],line=line):
                    self.assertEqual(outcomes,{True,False})

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
