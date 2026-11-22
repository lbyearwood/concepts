"""Independent console/SQLite cases for the forty new GCSE questions."""
import ast
import builtins
import contextlib
from collections import Counter
import importlib.util
import io
import json
from pathlib import Path
import random
import sqlite3
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT/'data/programming-problems.json').read_text(encoding='utf-8'))
PROBLEMS = {p['id']:p for p in DATA['problems']}
CASES = json.loads((ROOT/'tests/fixtures/exam-expansion-cases.json').read_text(encoding='utf-8'))
spec = importlib.util.spec_from_file_location('expansion_builder', ROOT/'scripts/build-problems.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

def run_console(problem, case):
    code = problem['solution']
    if 'patch' in case:
        old, new = case['patch']
        assert code.count(old) == 1
        code = code.replace(old,new)
    inputs, draws = iter(case.get('inputs', [])), iter(case.get('random', []))
    seen = []
    def draw(low, high):
        value = next(draws)
        assert low <= value <= high, (low, value, high)
        seen.append(value)
        return value
    steps = 0
    def trace(frame, event, arg):
        nonlocal steps
        if frame.f_code.co_filename == problem['id']:
            steps += 1
            if steps > 20000: raise AssertionError('Solution did not terminate')
        return trace
    scope = {'__builtins__':dict(vars(builtins),input=lambda prompt='':next(inputs))}
    output = io.StringIO()
    previous = sys.gettrace()
    try:
        sys.settrace(trace)
        with patch.object(random,'randint',side_effect=draw), contextlib.redirect_stdout(output):
            exec(compile(code,problem['id'],'exec'),scope)
    finally:
        sys.settrace(previous)
    assert list(inputs) == [], 'Solution skipped a required input'
    assert list(draws) == [], 'Solution skipped a required random draw'
    return output.getvalue(), scope, seen

def run_sql(problem, case):
    database = problem['database']
    with contextlib.closing(sqlite3.connect(':memory:')) as connection:
        columns = ', '.join(c['name']+' '+c['type'] for c in database['columns'])
        connection.execute(f'CREATE TABLE {database["table"]} ({columns})')
        placeholders = ','.join('?' for _ in database['columns'])
        connection.executemany(f'INSERT INTO {database["table"]} VALUES ({placeholders})',case.get('databaseRows',database['rows']))
        before = connection.total_changes
        result = connection.execute(problem['solution']).fetchall()
        assert connection.total_changes == before, 'A search query changed its data'
        return result

class ExamExpansionTests(unittest.TestCase):
    def test_five_per_new_category_and_no_practice_additions(self):
        added = [p for p in DATA['problems'] if int(p['id'].split('-')[1]) >= 23]
        self.assertEqual(set(CASES), {p['id'] for p in added})
        self.assertEqual(len(added),40)
        self.assertEqual(Counter(p['category'] for p in added), {c['id']:5 for c in DATA['categories'][4:]})
        self.assertTrue(all(p['question']['marking']['basis']=='csrevision' for p in added))
        for problem in added:
            with self.subTest(problem=problem['id']):
                builder.validate_solution(problem)
                if problem.get('language','python') == 'python':
                    tree = ast.parse(problem['solution'])
                    self.assertFalse(any(isinstance(n,(ast.ListComp,ast.SetComp,ast.DictComp,ast.Lambda,ast.AsyncFunctionDef)) for n in ast.walk(tree)))
                    self.assertEqual({n.names[0].name for n in ast.walk(tree) if isinstance(n,ast.Import)} - {'random'},set())
                else:
                    self.assertEqual(problem['language'],'sql')
                    self.assertNotRegex(problem['solution'].upper(),r'\b(JOIN|GROUP|ORDER|COUNT|INSERT|UPDATE|DELETE)\b')

    def test_random_draw_placement_and_real_list_selection(self):
        output,scope,draws = run_console(PROBLEMS['problem-44'],CASES['problem-44'][1])
        self.assertEqual(scope['index'],len(scope['topics'])-1)
        self.assertIn(scope['topics'][scope['index']],output)
        _,_,draws = run_console(PROBLEMS['problem-45'],CASES['problem-45'][0])
        self.assertEqual(len(draws),1,'the secret must not change across guesses')
        _,scope,draws = run_console(PROBLEMS['problem-46'],CASES['problem-46'][2])
        self.assertNotEqual(scope['first'],scope['second'])
        self.assertEqual(len(draws),4,'duplicate draws must retry without replacing first')
        _,_,draws = run_console(PROBLEMS['problem-47'],CASES['problem-47'][0])
        self.assertEqual(len(draws),100,'each simulation trial needs its own random draw')

    def test_sql_and_unknown_language_validation_fail_closed(self):
        problem = dict(PROBLEMS['problem-58'],language='javascript')
        with self.assertRaises(ValueError): builder.validate_solution(problem)
        for code in ('DELETE FROM Students;','SELECT Missing FROM Students;','SELECT Name FROM Students; SELECT Name FROM Students;'):
            problem = dict(PROBLEMS['problem-58'],solution=code)
            with self.assertRaises((ValueError,sqlite3.Error)): builder.validate_solution(problem)

def cases_for(identity):
    def verify(self):
        problem=PROBLEMS[identity]
        for index,case in enumerate(CASES[identity]):
            with self.subTest(case=index):
                if problem.get('language') == 'sql':
                    self.assertEqual(Counter(run_sql(problem,case)),Counter(tuple(row) for row in case['rows']))
                else:
                    actual,_,_ = run_console(problem,case)
                    self.assertEqual(actual,case['output'])
    return verify
for identity in CASES:
    setattr(ExamExpansionTests,'test_'+identity.replace('-','_'),cases_for(identity))

if __name__ == '__main__': unittest.main()
