"""Build the native Programming Problems page from its public tutorial catalogue."""
import argparse
import ast
from contextlib import closing
import json
import re
import sqlite3
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'courses/gcse-computer-science/tutorials/programming-problems.html'
CATALOGUE = ROOT / 'data/programming-problems.json'
GUIDES = ROOT / 'data/tutorial-guides.json'
PRACTICE = ROOT / 'data/practice-problems.json'
PRACTICE_GUIDES = ROOT / 'data/practice-tutorial-guides.json'
TEMPLATE = ROOT / 'scripts/templates/programming-problems.html'

def validate_assessment(question):
    marks = question.get('marks')
    marking = question.get('marking', {})
    points = marking.get('points', [])
    if (type(marks) is not int or not 1 <= marks <= 6
            or marking.get('basis') not in {'ebook', 'csrevision'}
            or len(points) != marks or not all(isinstance(point, str) and point.strip() for point in points)):
        raise ValueError('Each exam question needs a justified allocation of 1 to 6 marks')
    if marking['basis'] == 'ebook' and not (marking.get('sourceTab') and marking.get('sourceTitle')):
        raise ValueError('An eBook allocation needs its exact source tab')

def validate_solution(problem):
    language = problem.get('language', 'python')
    if language == 'python':
        ast.parse(problem['solution'])
        return
    if language != 'sql':
        raise ValueError('Unsupported tutorial language')
    database = problem.get('database', {})
    table, columns = database.get('table', ''), database.get('columns', [])
    if (not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*', table) or not columns
            or any(not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*', c.get('name', ''))
                   or c.get('type') not in {'TEXT', 'INTEGER', 'REAL'} for c in columns)
            or not re.match(r'^SELECT\b', problem['solution'], re.I)
            or not sqlite3.complete_statement(problem['solution'])):
        raise ValueError('Invalid GCSE SQL query or example table')
    with closing(sqlite3.connect(':memory:')) as connection:
        definitions = ', '.join(c['name'] + ' ' + c['type'] for c in columns)
        connection.execute(f'CREATE TABLE {table} ({definitions})')
        placeholders = ','.join('?' for _ in columns)
        connection.executemany(f'INSERT INTO {table} VALUES ({placeholders})', database['rows'])
        connection.execute(problem['solution']).fetchall()

def output():
    data = json.loads(CATALOGUE.read_text(encoding='utf-8'))
    guides = json.loads(GUIDES.read_text(encoding='utf-8'))
    data['practiceProblems'] = json.loads(PRACTICE.read_text(encoding='utf-8'))['problems']
    practice_guides = json.loads(PRACTICE_GUIDES.read_text(encoding='utf-8'))['problems']
    if set(guides['problems']) & set(practice_guides):
        raise ValueError('Practice and exam guide IDs must be separate')
    guides['problems'].update(practice_guides)
    if data.get('interface') != 'console':
        raise ValueError('Programming problems must use console input and output')
    practice_ids = [category['id'] for category in data['practiceCategories']]
    if (not practice_ids or len(set(practice_ids)) != len(practice_ids)
            or any(not re.fullmatch(r'[a-z][a-z0-9-]*', identity) for identity in practice_ids)
            or not all(category['title'].strip() for category in data['practiceCategories'])):
        raise ValueError('Invalid practice categories')
    category_ids = {category['id'] for category in data['categories']}
    ids = set()
    all_problems = data['problems'] + data['practiceProblems']
    for problem in all_problems:
        practice = problem.get('collection') in {'level1', 'level2', 'level3'}
        valid_categories = set(practice_ids) if practice else category_ids
        if (problem['id'] in ids or problem['category'] not in valid_categories or not problem['steps']
                or (problem in data['practiceProblems'] and not practice)):
            raise ValueError(f"Invalid tutorial: {problem['id']}")
        ids.add(problem['id'])
        if not practice:
            validate_assessment(problem['question'])
        validate_solution(problem)
        for step in problem['steps']:
            if not step['title'] or not step['blocks']:
                raise ValueError(f"Empty tutorial step: {problem['id']}")
            if any(block['type'] not in {'paragraph', 'code', 'question', 'error'} for block in step['blocks']):
                raise ValueError(f"Unknown tutorial block: {problem['id']}")
    for problem_id, guide in guides['problems'].items():
        problem = next((item for item in all_problems if item['id'] == problem_id), None)
        if not problem:
            raise ValueError(f'Unknown guided problem: {problem_id}')
        code_lines = problem['solution'].split('\n')
        if [line['code'] for line in guide['lines']] != code_lines:
            raise ValueError(f'Tutor explanations do not match code: {problem_id}')
        checkpoint_ids = set()
        mapped_steps = []
        for index, line in enumerate(guide['lines']):
            if not line['title'] or not line['paragraphs'] or not all(line['paragraphs']) or not line['watchOut']:
                raise ValueError(f'Empty tutor explanation: {problem_id}')
            if 'audio' in line:
                if not re.fullmatch(r'assets/tutorial-audio/[a-z0-9-]+/line-\d{2}\.mp3', line['audio']) or not line.get('narration'):
                    raise ValueError('Invalid retained local audio reference')
            if guide.get('stageReviews'):
                step = line.get('step')
                if not isinstance(step, int) or not 0 <= step < len(problem['steps']):
                    raise ValueError(f'Invalid line/stage mapping: {problem_id}')
                mapped_steps.append(step)
            checks = [('question', line.get('question')), *[('question', q) for q in line.get('additionalQuestions', [])], ('prediction', line.get('prediction'))]
            for kind, question in checks:
                if not question:
                    continue
                identity = question.get('id', '')
                if (not re.fullmatch(r'[a-z][a-z0-9-]+', identity) or identity in checkpoint_ids
                        or not question.get('prompt') or len(question['choices']) < 2
                        or sum(choice['correct'] is True for choice in question['choices']) != 1
                        or not all(choice['text'] and choice['feedback'] for choice in question['choices'])
                        or (kind == 'prediction' and index == len(guide['lines']) - 1)):
                    raise ValueError(f'Invalid tutor {kind}: {problem_id}')
                checkpoint_ids.add(identity)
        if mapped_steps:
            if mapped_steps != sorted(mapped_steps):
                raise ValueError(f'Out-of-order stages: {problem_id}')
            coding_steps = {i for i, step in enumerate(problem['steps']) if any(b['type'] == 'code' for b in step['blocks'])}
            if not coding_steps.issubset(set(mapped_steps)):
                raise ValueError(f'Missing coding stage: {problem_id}')
    if set(guides['problems']) != ids:
        raise ValueError('Every exam and practice problem requires a complete guide')
    previous = PAGE.read_text(encoding='utf-8')
    sidebar = re.search(r'  <aside class="site-sidebar".*?</aside>', previous, re.S)
    if not sidebar:
        raise ValueError('Missing shared sidebar')
    categories, category_options = [], []
    for index, category in enumerate(data['categories']):
        count = sum(problem['category'] == category['id'] for problem in data['problems'])
        badge = f' <span class="category-count">{count}</span>' if count else ''
        categories.append(f'        <button id="category-{category["id"]}" type="button" role="tab" aria-selected="{str(index == 0).lower()}" aria-controls="category-panel" data-category="{category["id"]}" tabindex="{0 if index == 0 else -1}"><span class="category-name">{escape(category["title"])}</span>{badge}</button>')
        option_label = category['title'] + (f' ({count})' if count else '')
        category_options.append(f'          <option value="{category["id"]}">{escape(option_label)}</option>')
    problems = [problem for problem in data['problems'] if problem['category'] == 'traversal']
    practice_categories = []
    for index, category in enumerate(data['practiceCategories']):
        label = escape(category['title'])
        if category.get('shortTitle'):
            label = f'<span class="practice-name-full">{label}</span><span class="practice-name-short" aria-hidden="true">{escape(category["shortTitle"])}</span>'
        practice_categories.append(f'        <button id="practice-category-{category["id"]}" type="button" role="tab" aria-label="{escape(category["title"], quote=True)}" aria-selected="{str(index == 0).lower()}" aria-controls="category-panel" data-practice-category="{category["id"]}" tabindex="{0 if index == 0 else -1}">{label}</button>')
    items = []
    for index, problem in enumerate(problems, 1):
        items.append(f'            <li><button class="problem-row" type="button" data-problem="{problem["id"]}" aria-haspopup="dialog" aria-controls="tutorial-modal"><span class="problem-number">{index:02}</span><span class="problem-title">{escape(problem["title"])}</span><span class="problem-open"><span>Open question</span><span class="problem-icon icon-right" aria-hidden="true"></span></span></button></li>')
    content = TEMPLATE.read_text(encoding='utf-8')
    values = {'__SIDEBAR__': sidebar.group(), '__CATEGORIES__': '\n'.join(categories), '__CATEGORY_OPTIONS__': '\n'.join(category_options), '__PRACTICE_CATEGORIES__': '\n'.join(practice_categories), '__PROBLEM_LIST__': '\n'.join(items), '__PROBLEM_DATA__': json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c'), '__TUTOR_GUIDE_DATA__': json.dumps(guides, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')}
    values['__PRACTICE_CATEGORY_OPTIONS__'] = '\n'.join(
        f'          <option value="{category["id"]}">{escape(category["title"])}</option>'
        for category in data['practiceCategories'])
    for token, value in values.items():
        if content.count(token) != 1:
            raise ValueError(f'Missing or duplicate template token: {token}')
        content = content.replace(token, value)
    return content

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = output()
    changed = PAGE.read_text(encoding='utf-8') != content
    if args.check and changed:
        raise SystemExit('Regenerate with python scripts/build-problems.py')
    if not args.check and changed:
        PAGE.write_text(content, encoding='utf-8', newline='\n')
    print(f'Programming Problems {"checked" if args.check else "built"}; {int(changed)} changed.')

if __name__ == '__main__':
    main()
