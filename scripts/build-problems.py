"""Build the native Programming Problems page from its public tutorial catalogue."""
import argparse
import ast
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'courses/gcse-computer-science/tutorials/programming-problems.html'
CATALOGUE = ROOT / 'data/programming-problems.json'
TEMPLATE = ROOT / 'scripts/templates/programming-problems.html'

def output():
    data = json.loads(CATALOGUE.read_text(encoding='utf-8'))
    category_ids = {category['id'] for category in data['categories']}
    ids = set()
    for problem in data['problems']:
        if problem['id'] in ids or problem['category'] not in category_ids or not problem['steps']:
            raise ValueError(f"Invalid tutorial: {problem['id']}")
        ids.add(problem['id'])
        ast.parse(problem['solution'])
        for step in problem['steps']:
            if not step['title'] or not step['blocks']:
                raise ValueError(f"Empty tutorial step: {problem['id']}")
            if any(block['type'] not in {'paragraph', 'code', 'question', 'error'} for block in step['blocks']):
                raise ValueError(f"Unknown tutorial block: {problem['id']}")
    previous = PAGE.read_text(encoding='utf-8')
    sidebar = re.search(r'  <aside class="site-sidebar".*?</aside>', previous, re.S)
    if not sidebar:
        raise ValueError('Missing shared sidebar')
    categories = []
    for index, category in enumerate(data['categories']):
        count = sum(problem['category'] == category['id'] for problem in data['problems'])
        badge = f' <span class="category-count">{count}</span>' if count else ''
        categories.append(f'        <button id="category-{category["id"]}" type="button" role="tab" aria-selected="{str(index == 0).lower()}" aria-controls="category-panel" data-category="{category["id"]}" tabindex="{0 if index == 0 else -1}">{escape(category["title"])}{badge}</button>')
    problems = [problem for problem in data['problems'] if problem['category'] == 'traversal']
    items = []
    for index, problem in enumerate(problems, 1):
        items.append(f'            <li><button class="problem-row" type="button" data-problem="{problem["id"]}" aria-haspopup="dialog" aria-controls="tutorial-modal"><span class="problem-number">{index:02}</span><span class="problem-title">{escape(problem["title"])}</span><span class="problem-open"><span>Open tutorial</span><span class="problem-icon icon-right" aria-hidden="true"></span></span></button></li>')
    content = TEMPLATE.read_text(encoding='utf-8')
    values = {'__SIDEBAR__': sidebar.group(), '__CATEGORIES__': '\n'.join(categories), '__PROBLEM_LIST__': '\n'.join(items), '__PROBLEM_DATA__': json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')}
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
