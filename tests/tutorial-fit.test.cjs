const { test } = require('node:test');
const assert = require('node:assert/strict');
const { packPages, textParts } = require('../assets/tutorial-fit.js');
const { walkthroughFrames, checkpointLimit, tutorialCodeLines } = require('../assets/tutorial-typewriter.js');
const data = require('../data/programming-problems.json');
const guides = require('../data/tutorial-guides.json');

test('questions follow their explanations in Next/Back order without extra tabs', () => {
  const frames = walkthroughFrames(data.problems[0], guides.problems['problem-1']);
  assert.equal(frames.length, 15);
  assert.deepEqual(frames.filter(frame => frame.kind === 'question').map(frame => frame.line), [1, 2, 3, 5, 9]);
  frames.forEach((frame, index) => {
    if (frame.kind === 'question') assert.deepEqual(frames[index - 1], { line: frame.line, kind: 'explanation' });
  });
  assert.deepEqual(frames.at(-1), { line: 9, kind: 'question' });
  const compact = walkthroughFrames(data.problems[0], guides.problems['problem-1'], true);
  assert.equal(compact.length, 25);
  assert.equal(compact.filter(frame => frame.kind === 'code').length, 10);
  assert.deepEqual(compact.slice(0, 2), [{ line: 0, kind: 'code' }, { line: 0, kind: 'explanation' }]);
});

test('unanswered or wrong checkpoints bound every forward target in desktop and compact flows', () => {
  const guide = guides.problems['problem-1'], lines = tutorialCodeLines(data.problems[0]);
  for (const compact of [false, true]) {
    const frames = walkthroughFrames(data.problems[0], guide, compact), answers = new Map();
    const limit = () => checkpointLimit(frames, guide, line => answers.get(line) === true);
    const checkpoints = frames.map((frame, index) => ({ ...frame, index })).filter(frame => frame.kind === 'question');
    assert.equal(limit(), checkpoints[0].index);
    const stage3 = frames.findIndex(frame => lines[frame.line].step === 2);
    assert.ok(stage3 > limit(), 'stage jump cannot skip the first question');
    for (const checkpoint of checkpoints) {
      assert.equal(limit(), checkpoint.index);
      answers.set(checkpoint.line, false); assert.equal(limit(), checkpoint.index);
      assert.ok(checkpoint.index + 1 > limit());
      answers.set(checkpoint.line, true);
      assert.ok(limit() >= checkpoint.index);
    }
    assert.equal(limit(), frames.length - 1);
    answers.set(checkpoints[0].line, false);
    assert.equal(limit(), checkpoints[0].index, 'a newly selected wrong answer relocks forward progress');
    assert.ok(0 <= limit(), 'earlier views remain reachable');
  }
});

test('fitted pages preserve every item in order and respect the available height', () => {
  const heights = [20, 30, 50, 40, 55, 60, 20], pages = packPages(heights, 100);
  assert.deepEqual(pages.flat(), heights.map((_, index) => index));
  pages.forEach(page => assert.ok(page.reduce((sum, index) => sum + heights[index], 0) <= 100));
  assert.deepEqual(packPages([20, 30, 50], 100), [[0, 1, 2]]);
  assert.deepEqual(packPages([], 100), [[]]);
});

test('short narration parts preserve all text for small-screen paging', () => {
  for (const line of guides.problems['problem-1'].lines) {
    for (const text of [...line.paragraphs, line.watchOut]) {
      const parts = textParts(text);
      assert.equal(parts.join(' '), text);
      parts.forEach(part => assert.ok(part.split(' ').length <= 12));
    }
  }
});
