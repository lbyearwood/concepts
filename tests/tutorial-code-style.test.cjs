const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tokenizeCode, tokenizePython, visibleTokens, tutorSegments, renderCode, renderPython, renderTutorText } = require('../assets/tutorial-code-style.js');
const guide = require('../data/tutorial-guides.json').problems['problem-1'];
const allGuides = Object.values(require('../data/tutorial-guides.json').problems);

test('every typed prefix and completed line preserves the exact approved Python', () => {
  for (const { code } of allGuides.flatMap(guide => guide.lines)) {
    assert.equal(tokenizePython(code).map(token => token.text).join(''), code);
    for (let count = 0; count <= code.length; count++) {
      assert.equal(visibleTokens(code, count).map(token => token.text).join(''), code.slice(0, count));
    }
  }
  const text = '    print("<script> & \\"quoted\\" ✓🙂") # keep spaces';
  assert.equal(tokenizePython(text).map(token => token.text).join(''), text);
});

test('file methods, subroutines, inclusive operators and formatted strings retain actual Python tokens', () => {
  assert.equal(tokenizePython('open("x", "r")')[0].type, 'builtin');
  for (const name of ['readline', 'rstrip', 'write', 'close', 'split', 'append', 'lower', 'replace']) {
    assert.equal(tokenizePython('file.' + name + '()').find(t => t.text === name).type, 'builtin');
  }
  assert.equal(tokenizePython('def valid_score(score):')[0].type, 'keyword');
  assert.equal(tokenizePython('pass')[0].type, 'keyword');
  assert.equal(visibleTokens('f"{count}"', 1)[0].type, 'string');
  assert.equal(tokenizePython('f"{count}"')[0].text, 'f"{count}"');
  const text = 'score is tested before result is returned.';
  assert.deepEqual(tutorSegments(text, ['score','result']).filter(p => p.type === 'code').map(p => p.text), ['score','result']);
});

test('function names and strings have their final colour from the first typed character', () => {
  assert.deepEqual(visibleTokens('input("Enter some text: ")', 1), [{ text: 'i', type: 'builtin' }]);
  assert.deepEqual(visibleTokens('"Enter some text: "', 6), [{ text: '"Enter', type: 'string' }]);
  const source = tokenizePython("if text[i] == 'a':");
  assert.equal(source.find(token => token.text === 'if').type, 'keyword');
  assert.equal(source.find(token => token.text === 'text').type, 'identifier');
  assert.equal(source.find(token => token.text === "'a'").type, 'string');
  assert.equal(tokenizePython('found = False').at(-1).type, 'constant');
  assert.equal(tokenizePython('range(5)')[2].type, 'number');
});

test('inline expressions stay whole and formatting does not alter teaching text', () => {
  const text = 'input() stores text. found = False, text[i], range(len(text)) and if found use the saved flag.';
  const segments = tutorSegments(text);
  assert.equal(segments.map(segment => segment.text).join(''), text);
  const code = segments.filter(segment => segment.type === 'code').map(segment => segment.text);
  for (const expression of ['input()', 'found = False', 'text[i]', 'range(len(text))', 'if found']) assert.ok(code.includes(expression));
  assert.deepEqual(tutorSegments('A match has been found.').filter(segment => segment.type === 'code'), []);
  for (const line of guide.lines) {
    const texts = [line.title, ...line.paragraphs, line.watchOut, ...(line.question ? [line.question.prompt, ...line.question.choices.flatMap(choice => [choice.text, choice.feedback])] : [])];
    for (const text of texts) assert.equal(tutorSegments(text).map(segment => segment.text).join(''), text);
  }
});

function dom() {
  class Node {
    constructor(tag) { this.tagName = tag; this.children = []; this.className = ''; this.value = ''; }
    append(...nodes) { for (const node of nodes) this.children.push(...(node.tagName === '#fragment' ? node.children : [node])); }
    replaceChildren(...nodes) { this.children = []; this.value = ''; this.append(...nodes); }
    set textContent(value) { this.value = value; this.children = []; }
    get textContent() { return this.value + this.children.map(node => node.textContent).join(''); }
    get firstChild() { return this.children[0]; }
  }
  return {
    createElement: tag => new Node(tag), createDocumentFragment: () => new Node('#fragment'),
    createTextNode: text => { const node = new Node('#text'); node.textContent = text; return node; }
  };
}

test('SQL query prefixes keep their exact text and SQL keyword colours', () => {
  for (const problem of require('../data/programming-problems.json').problems.filter(p=>p.language==='sql')) {
    for (const line of problem.solution.split('\n')) {
      for(let count=0;count<=line.length;count++) assert.equal(visibleTokens(line,count,'sql').map(t=>t.text).join(''),line.slice(0,count));
      for(const token of tokenizeCode(line,'sql').filter(t=>['SELECT','FROM','WHERE','AND','OR','ORDER','BY','ASC','LIKE'].includes(t.text))) assert.equal(token.type,'keyword');
    }
  }
  assert.equal(visibleTokens('SELECT Name',1,'sql')[0].type,'keyword');
  assert.equal(visibleTokens('ORDER BY Price ASC;',1,'sql')[0].type,'keyword');
  for (const word of ['ORDER', 'BY', 'ASC', 'LIKE']) assert.ok(tutorSegments(word, [], 'sql').some(segment => segment.type === 'code' && segment.text === word));
  assert.equal(tokenizeCode("WHERE Genre = 'Puzzle';",'sql').find(t=>t.text==="'Puzzle'").type,'string');
  global.document=dom();
  try {
    const target=document.createElement('code');
    renderCode(target,'SELECT Name',1,'sql');
    assert.equal(target.textContent,'S');assert.equal(target.firstChild.className,'syntax-keyword');
    renderTutorText(target,'SELECT chooses Name from Students.', ['Name','Students'],'sql');
    assert.ok(target.children.filter(n=>n.tagName==='code').some(n=>n.textContent==='SELECT'));
  } finally {delete global.document;}
});

test('new GCSE Python constructs use readable colours while retaining source', () => {
  for(const word of ['import','elif']) assert.equal(tokenizePython(word)[0].type,'keyword');
  for(const word of ['randint','upper','isdigit']) assert.equal(tokenizePython('value.'+word+'()').find(t=>t.text===word).type,'builtin');
});

test('DOM rendering keeps copying exact, treats markup as text and emphasizes labels', () => {
  global.document = dom();
  try {
    const target = document.createElement('code'), source = '    print("<img src=x onerror=alert(1)>")';
    renderPython(target, source);
    assert.equal(target.textContent, source);
    assert.ok(target.children.every(node => node.tagName === 'span'));
    assert.equal(target.children.find(node => node.className === 'syntax-string').textContent, '"<img src=x onerror=alert(1)>"');
    for (const label of ['Remember: ', '✅ Correct. ', '❌ Incorrect. ']) {
      const text = label + 'input() returns text; found = False until a match.';
      renderTutorText(target, text); assert.equal(target.textContent, text);
      assert.equal(target.firstChild.tagName, 'strong');
      assert.ok(target.children.some(node => node.className === 'tutor-inline-code'));
    }
  } finally { delete global.document; }
});
