const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createProblemSession, findPositionFrame } = require('../assets/programming-problems.js');
const { walkthroughFrames, tutorialCodeLines, frameStep } = require('../assets/tutorial-typewriter.js');
const { createPager } = require('../assets/tutorial-fit.js');
const catalogue = require('../data/programming-problems.json');
const guides = require('../data/tutorial-guides.json').problems;

test('header neighbours follow catalogue order and stop at every category boundary', () => {
  const session = createProblemSession(catalogue.problems);
  for (const [start, end] of [[1,8], [9,12], [13,17], [18,22]]) {
    for (let id = start; id <= end; id++) {
      assert.equal(session.neighbour('problem-' + id, -1)?.id || null, id === start ? null : 'problem-' + (id - 1));
      assert.equal(session.neighbour('problem-' + id, 1)?.id || null, id === end ? null : 'problem-' + (id + 1));
    }
  }
  assert.equal(session.neighbour('unknown', 1), null);
  assert.equal(session.neighbour('problem-1', 0), null);
});

test('all 22 positions remain independent while switching and Close clears the entire attempt', () => {
  const session = createProblemSession(catalogue.problems);
  for (const [index, problem] of catalogue.problems.entries()) {
    assert.equal(session.get(problem.id), null);
    session.save(problem.id, {line: index, step: index % 4, kind: index % 2 ? 'prediction' : 'question',
      questionOpen: false, helpOpen: true, started: true, examPage: index % 3});
  }
  for (const [index, problem] of catalogue.problems.entries()) {
    const position = session.get(problem.id);
    assert.equal(position.line, index);
    assert.equal(position.kind, index % 2 ? 'prediction' : 'question');
    assert.equal(position.helpOpen, true);
    // An active problem changing must not silently mutate another cached view.
    position.line = -1;
    assert.equal(session.get(problem.id).line, index);
  }
  session.clear();
  catalogue.problems.forEach(problem => assert.equal(session.get(problem.id), null));
});

for (const problem of catalogue.problems) test(problem.id + ' restores the same line, checkpoint or original stage across fitted layouts', () => {
  const lines = tutorialCodeLines(problem, guides[problem.id]);
  for (const compact of [false, true]) {
    const original = walkthroughFrames(problem, guides[problem.id], compact);
    const other = walkthroughFrames(problem, guides[problem.id], !compact);
    original.forEach((frame, index) => {
      const position = {line: frame.line, kind: frame.kind, step: frameStep(frame, lines)};
      assert.equal(findPositionFrame(original, lines, position, frameStep), index);
      const mapped = other[findPositionFrame(other, lines, position, frameStep)];
      assert.equal(mapped.line, frame.line);
      assert.equal(mapped.kind, frame.kind === 'code' ? 'explanation' : frame.kind);
      assert.equal(frameStep(mapped, lines), position.step);
      if (frame.checkpoint) assert.equal(mapped.checkpoint, frame.checkpoint);
    });
  }
});

test('fitted content restores its saved item and keeps that item reachable after a resize', () => {
  class Node {
    constructor(height = 0) { this.children = []; this.events = {}; this.dataset = {}; this.height = height; this.textContent = 'item'; }
    append(...nodes) { this.children.push(...nodes); }
    addEventListener(name, handler) { this.events[name] = handler; }
    setAttribute() {}
    getBoundingClientRect() { return {height: this.height}; }
  }
  global.document = {createElement: () => new Node()};
  global.getComputedStyle = () => ({paddingTop: '0', paddingBottom: '0', marginTop: '0', marginBottom: '0'});
  try {
    const items = Array.from({length: 8}, () => new Node(30));
    const host = new Node(), viewport = {clientHeight: 90};
    const pager = createPager(host, viewport, () => items, 'test');
    pager.layout(); host.children[0].children[2].events.click();
    const saved = pager.getPosition();
    assert.equal(saved, 3);
    viewport.clientHeight = 60; pager.layout();
    assert.equal(items[saved].hidden, false);
    const restored = createPager(new Node(), viewport, () => items, 'test');
    restored.layout(); restored.restorePosition(saved);
    assert.equal(items[saved].hidden, false);
    restored.restorePosition(999);
    assert.equal(items.at(-1).hidden, false);
    restored.restorePosition(undefined);
    assert.equal(items.at(-1).hidden, false);
  } finally { delete global.document; delete global.getComputedStyle; }
});
