const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tutorialCodeLines, createTypewriter } = require('../assets/tutorial-typewriter.js');
const catalogue = require('../data/programming-problems.json');

function clock() {
  let next = 0;
  const pending = new Map();
  return {
    schedule: action => { pending.set(++next, action); return next; },
    unschedule: id => pending.delete(id),
    tick: () => {
      const [id, action] = pending.entries().next().value;
      pending.delete(id); action();
    },
    drain() { while (pending.size) this.tick(); },
    get size() { return pending.size; },
    get callback() { return pending.values().next().value; }
  };
}

test('the ten incremental lines reconstruct the exact approved string-search solution', () => {
  const problem = catalogue.problems.find(problem => problem.id === 'problem-1');
  const lines = tutorialCodeLines(problem);
  assert.equal(lines.length, 10);
  assert.equal(lines.map(line => line.text).join('\n'), problem.solution);
  assert.deepEqual(lines.map(line => line.step), [0, 1, 2, 2, 2, 2, 3, 3, 3, 3]);
  assert.equal(lines[5].text, '        break');
  assert.equal(lines[8].text, 'else:');
});

test('playback reveals one character per tick, preserving indentation and Unicode', () => {
  const timer = clock(); const player = createTypewriter(timer);
  const writes = []; let completed = 0;
  const text = '    print("✓")';
  player.play(text, { write: value => writes.push(value), done: () => completed++ });
  assert.deepEqual(writes, ['']); assert.equal(player.playing, true);
  timer.tick(); assert.equal(writes.at(-1), ' ');
  timer.drain();
  assert.equal(writes.at(-1), text); assert.equal(completed, 1);
  assert.equal(writes.length, Array.from(text).length + 1);
  for (let i = 1; i < writes.length; i++) assert.equal(writes[i], Array.from(text).slice(0, i).join(''));
  assert.equal(player.playing, false); assert.equal(timer.size, 0);
});

test('advancing early finishes the current line once and starts a separate new line', () => {
  const timer = clock(); const player = createTypewriter(timer);
  const first = []; const second = []; let completed = 0;
  player.play('found = False', { write: value => first.push(value), done: () => completed++ });
  timer.tick(); player.finish(); player.finish();
  assert.equal(first.at(-1), 'found = False'); assert.equal(completed, 1);
  player.play('for i in range(len(text)):', { write: value => second.push(value) });
  timer.drain();
  assert.equal(first.at(-1), 'found = False');
  assert.equal(second.at(-1), 'for i in range(len(text)):');
  assert.equal(timer.size, 0);
});

test('cancelling on close or navigation prevents a queued old callback changing the next line', () => {
  const timer = clock(); const player = createTypewriter(timer);
  const writes = []; let oldCompleted = false;
  player.play('old line', { write: value => writes.push(value), done: () => { oldCompleted = true; } });
  const stale = timer.callback;
  player.cancel(); assert.equal(timer.size, 0); assert.equal(player.playing, false);
  player.play('new', { write: value => writes.push(value) });
  stale(); assert.deepEqual(writes, ['', '']);
  timer.drain(); assert.equal(writes.at(-1), 'new'); assert.equal(oldCompleted, false);
});

test('reduced-motion and Back playback show the line immediately with no timer', () => {
  const timer = clock(); const player = createTypewriter(timer);
  const writes = []; let completed = 0;
  player.play('slow', { write: value => writes.push(value) });
  player.play('    break', { instant: true, write: value => writes.push(value), done: () => completed++ });
  assert.deepEqual(writes, ['', '    break']); assert.equal(completed, 1);
  assert.equal(timer.size, 0); assert.equal(player.playing, false);
});

test('key clicks follow real typed characters only, with no burst on finish, Back or cancellation', () => {
  const timer = clock(), player = createTypewriter(timer), characters = [];
  const options = { write() {}, onCharacter: character => characters.push(character) };
  player.play('a🙂z', options); timer.tick(); timer.tick();
  assert.deepEqual(characters, ['a', '🙂']);
  player.finish(); assert.deepEqual(characters, ['a', '🙂']);
  player.play('instant', { ...options, instant: true }); assert.equal(timer.size, 0);
  player.play('stale', options); const stale = timer.callback;
  player.cancel(); stale(); assert.deepEqual(characters, ['a', '🙂']);
  player.play('new', options); timer.drain(); assert.deepEqual(characters, ['a', '🙂', 'n', 'e', 'w']);
});
