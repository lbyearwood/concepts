const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createNarrationPlayer, checkAnswer } = require('../assets/tutorial-tutor.js');
const guides = require('../data/tutorial-guides.json');

function harness() {
  const created = [], states = [];
  function createAudio() {
    const events = new Map();
    const audio = { paused: true, ended: false, plays: 0, currentTime: 0,
      addEventListener: (key, value) => events.set(key, value),
      fire: key => events.get(key)?.(),
      pause() { this.paused = true; this.fire('pause'); },
      play() { this.plays++; this.paused = false; this.fire('playing'); return Promise.resolve(); },
      removeAttribute(key) { delete this[key]; }, load() {} };
    created.push(audio); return audio;
  }
  return { created, states, player: createNarrationPlayer({ createAudio, onState: state => states.push(state) }) };
}

test('a new line prepares audio without autoplay or eager preload', async () => {
  const h = harness(); h.player.setSource('line-01.mp3');
  assert.equal(h.created[0].plays, 0); assert.equal(h.created[0].preload, 'none');
  assert.deepEqual(h.states, ['ready']);
  await h.player.toggle(); assert.equal(h.created[0].plays, 1); assert.equal(h.states.at(-1), 'playing');
  await h.player.toggle(); assert.equal(h.states.at(-1), 'paused');
  await h.player.toggle(); assert.equal(h.created[0].plays, 2); assert.equal(h.states.at(-1), 'playing');
});

test('moving to a new line unloads old narration and ignores its stale events', async () => {
  const h = harness(); h.player.setSource('line-01.mp3'); await h.player.toggle();
  const old = h.created[0]; h.player.setSource('line-02.mp3');
  assert.equal(old.paused, true); assert.equal(old.src, undefined);
  old.fire('error'); old.fire('ended');
  assert.equal(h.states.at(-1), 'ready'); assert.equal(h.created[1].plays, 0);
});

test('late rejection from a stopped line cannot overwrite the next line state', async () => {
  const h = harness(); h.player.setSource('line-01.mp3');
  let reject; h.created[0].play = () => new Promise((_, fail) => { reject = fail; });
  const playing = h.player.toggle();
  h.player.setSource('line-02.mp3'); reject(new Error('old request interrupted')); await playing;
  assert.equal(h.states.at(-1), 'ready'); assert.equal(h.created[1].plays, 0);
});

test('playback failure is recoverable and ending supports replay from the start', async () => {
  const h = harness(); h.player.setSource('line-01.mp3');
  const audio = h.created[0], play = audio.play;
  audio.play = () => Promise.reject(new Error('blocked')); await h.player.toggle();
  assert.equal(h.states.at(-1), 'error');
  audio.play = play; await h.player.toggle();
  audio.ended = true; audio.paused = true; audio.currentTime = 12; audio.fire('ended');
  await h.player.toggle(); assert.equal(audio.currentTime, 0); assert.equal(h.states.at(-1), 'playing');
  h.player.stop(); assert.equal(audio.paused, true); assert.equal(audio.src, undefined);
});

test('misconception choices give their own feedback and exactly one correct answer', () => {
  const lines = guides.problems['problem-1'].lines;
  assert.equal(lines.length, 10);
  assert.equal(lines.filter(line => line.question).length, 5);
  for (const line of lines.filter(line => line.question)) {
    assert.equal(line.question.choices.filter(choice => choice.correct).length, 1);
    line.question.choices.forEach((choice, index) => assert.deepEqual(checkAnswer(line.question, index), { correct: choice.correct, text: choice.feedback }));
  }
  assert.match(checkAnswer(lines[1].question, 0).text, /not been searched/);
});
