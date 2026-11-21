const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkAnswer, createTutor } = require('../assets/tutorial-tutor.js');
const guides = require('../data/tutorial-guides.json');
const codeStyle = require('../assets/tutorial-code-style.js');

function harness() {
  class Node {
    constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.events = {}; this.className = ''; this.value = ''; this.attributes = {}; this.classList = { toggle: (name, on) => { this.className = on ? name : ''; } }; }
    append(...nodes) { for (const node of nodes.flatMap(n => n.tagName === '#fragment' ? n.children : [n])) { node.parent = this; this.children.push(node); } }
    replaceChildren(...nodes) { this.children = []; this.value = ''; this.append(...nodes); }
    set textContent(text) { this.value = text; this.children = []; }
    get textContent() { return this.value + this.children.map(node => node.textContent).join(''); }
    get firstChild() { return this.children[0]; }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(name, handler) { this.events[name] = handler; }
    remove() { this.parent.children = this.parent.children.filter(node => node !== this); }
    querySelectorAll(selector) { return walk(this).filter(node => selector === '[data-feedback]' ? node.dataset.feedback : node.tagName === selector); }
    querySelector(selector) { return this.querySelectorAll(selector)[0]; }
  }
  function walk(node) { return node.children.flatMap(child => [child, ...walk(child)]); }
  global.document = { createElement: tag => { assert.notEqual(tag, 'audio', 'written tutor must never construct spoken audio'); return new Node(tag); },
    createTextNode: text => { const node = new Node('#text'); node.textContent = text; return node; }, createDocumentFragment: () => new Node('#fragment') };
  global.window = { CSRTutorialCodeStyle: codeStyle, CSRTutorialFit: { createPager: () => ({ layout() {} }) } };
  const panel = new Node('aside'), sounds = [];
  const tutor = createTutor(panel, guides, { onAnswer: correct => sounds.push(correct) });
  return { panel, tutor, sounds, nodes: () => walk(panel), cleanup() { delete global.document; delete global.window; } };
}

test('written explanations and Remember are intact without any playback button or audio element', () => {
  const h = harness();
  try {
    h.tutor.show('problem-1', 1);
    assert.ok(h.panel.textContent.includes('Why start with False?'));
    for (const text of guides.problems['problem-1'].lines[1].paragraphs) assert.ok(h.panel.textContent.includes(text));
    assert.ok(h.panel.textContent.includes('Remember: ' + guides.problems['problem-1'].lines[1].watchOut));
    assert.equal(h.nodes().filter(node => node.tagName === 'button' || node.tagName === 'audio').length, 0);
    assert.ok(h.nodes().some(node => node.className === 'tutor-inline-code'));
  } finally { h.cleanup(); }
});

test('only real answer changes trigger effects; restoration is silent and a new attempt clears answers', () => {
  const h = harness();
  try {
    h.tutor.show('problem-1', 1, 'question');
    assert.equal(h.tutor.isCorrect('problem-1', 'understand-initial-flag'), false);
    let inputs = h.nodes().filter(node => node.tagName === 'input');
    inputs[0].events.change(); assert.equal(h.tutor.isCorrect('problem-1', 'understand-initial-flag'), false);
    inputs[1].events.change(); assert.equal(h.tutor.isCorrect('problem-1', 'understand-initial-flag'), true);
    assert.deepEqual(h.sounds, [false, true]);
    assert.ok(h.panel.textContent.includes('✅ Correct.'));
    h.tutor.show('problem-1', 0); h.tutor.show('problem-1', 1, 'question');
    inputs = h.nodes().filter(node => node.tagName === 'input');
    assert.equal(inputs[1].checked, true); assert.deepEqual(h.sounds, [false, true]);
    assert.equal(h.tutor.isCorrect('problem-1', 'understand-initial-flag'), true);
    h.tutor.hide(); h.tutor.show('problem-1', 1, 'question');
    assert.deepEqual(h.sounds, [false, true]);
    h.tutor.reset(); h.tutor.show('problem-1', 1, 'question');
    assert.equal(h.nodes().filter(node => node.tagName === 'input' && node.checked).length, 0);
    assert.equal(h.nodes().filter(node => node.dataset.feedback).length, 0);
    assert.equal(h.tutor.isCorrect('problem-1', 'understand-initial-flag'), false);
    assert.deepEqual(h.sounds, [false, true]);
  } finally { h.cleanup(); }
});

test('choosing a wrong answer after a correct one removes the current checkpoint pass', () => {
  const h = harness();
  try {
    h.tutor.show('problem-1', 1, 'question');
    const inputs = h.nodes().filter(node => node.tagName === 'input');
    inputs[1].events.change(); assert.equal(h.tutor.isCorrect('problem-1', 'understand-initial-flag'), true);
    inputs[0].events.change(); assert.equal(h.tutor.isCorrect('problem-1', 'understand-initial-flag'), false);
    assert.ok(h.panel.textContent.includes('Try again.'));
    assert.deepEqual(h.sounds, [true, false]);
  } finally { h.cleanup(); }
});

test('a prediction shares the current code but never another checkpoint answer or the next explanation', () => {
  const h = harness();
  try {
    h.tutor.show('problem-1', 1, 'question');
    h.nodes().filter(node => node.tagName === 'input')[1].events.change();
    h.tutor.show('problem-1', 1, 'prediction');
    assert.ok(h.panel.textContent.includes('Predict the next step'));
    assert.equal(h.nodes().filter(node => node.tagName === 'input' && node.checked).length, 0);
    assert.equal(h.tutor.isCorrect('problem-1', 'predict-start-scan'), false);
    assert.ok(h.panel.textContent.includes('found = False'));
    assert.ok(!h.panel.textContent.includes(guides.problems['problem-1'].lines[2].code));
    assert.ok(!h.panel.textContent.includes(guides.problems['problem-1'].lines[2].title));
    h.nodes().filter(node => node.tagName === 'input')[1].events.change();
    assert.equal(h.tutor.isCorrect('problem-1', 'predict-start-scan'), true);
    h.tutor.show('problem-1', 1, 'question');
    assert.equal(h.nodes().filter(node => node.tagName === 'input')[1].checked, true);
    h.tutor.show('problem-1', 1, 'prediction');
    assert.equal(h.nodes().filter(node => node.tagName === 'input')[1].checked, true);
    assert.deepEqual(h.sounds, [true, true], 'restoring either checkpoint is silent');
    h.nodes().filter(node => node.tagName === 'input')[0].events.change();
    assert.equal(h.tutor.isCorrect('problem-1', 'predict-start-scan'), false);
    assert.equal(h.tutor.isCorrect('problem-1', 'understand-initial-flag'), true);
    h.tutor.reset();
    for (const id of ['predict-start-scan', 'understand-initial-flag']) assert.equal(h.tutor.isCorrect('problem-1', id), false);
    h.tutor.show('problem-1', 4, 'prediction');
    assert.ok(!h.panel.textContent.includes('break'));
    assert.equal(h.nodes().filter(node => node.tagName === 'input' && node.checked).length, 0);
  } finally { h.cleanup(); }
});

test('misconception choices give their own feedback and exactly one correct answer', () => {
  const lines = guides.problems['problem-1'].lines;
  assert.equal(lines.length, 10);
  assert.equal(lines.filter(line => line.question).length, 5);
  const questions = lines.flatMap(line => [line.question, line.prediction].filter(Boolean));
  assert.equal(questions.length, 7);
  assert.equal(new Set(questions.map(question => question.id)).size, 7);
  for (const question of questions) {
    assert.equal(question.choices.filter(choice => choice.correct).length, 1);
    assert.equal(new Set(question.choices.map(choice => choice.feedback)).size, question.choices.length);
    question.choices.forEach((choice, index) => assert.deepEqual(checkAnswer(question, index), { correct: choice.correct, text: choice.feedback }));
  }
  assert.match(checkAnswer(lines[1].question, 0).text, /not been searched/);
});
