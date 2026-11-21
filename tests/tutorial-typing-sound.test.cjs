const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createTypingSound, soundFiles } = require('../assets/tutorial-typing-sound.js');
const settle = () => new Promise(resolve => setImmediate(resolve));

function harness() {
  let visible = true, creates = 0;
  const events = [], sources = [], states = [], loads = [];
  const context = {
    state: 'suspended', destination: {},
    createGain: () => ({ gain: {}, connect() {} }),
    createBufferSource() {
      const source = { connect(target) { this.gain = target; }, disconnect() { events.push('disconnect'); },
        start() { events.push('start'); }, stop() { events.push('stop'); this.stopped = true; } };
      sources.push(source); return source;
    },
    async resume() { this.state = 'running'; }, async close() { this.state = 'closed'; }
  };
  const settings = { loader: async url => ({ url }) };
  const sound = createTypingSound({ createContext: () => { creates++; return context; },
    baseUrl: 'https://example.test/assets/tutorial-sounds/',
    loadBuffer: (url, ctx) => { loads.push({ url, ctx }); return settings.loader(url); },
    isVisible: () => visible, onChange: state => states.push(state) });
  return { sound, context, events, sources, states, loads, settings, get creates() { return creates; }, hide() { visible = false; } };
}

test('outcomes map to the exact user-supplied MP3 bytes and original filenames', () => {
  const expected = {
    typing: ['dragon-studio-keyboard-typing-sound-effect-335503.mp3', 'cd043f1b6a0f52388b2754e5b648f343baeda4b1af93cf5e35582839568eef4c'],
    correct: ['dragon-studio-correct-472358.mp3', 'a106868fd8a145542ed741b1a784a9324c3b6bcbadbef1cb5680f6ac0dad0097'],
    incorrect: ['universfield-wrong-answer-126515.mp3', '16098fa3e3c9b98a9b53397f935edbcc8bb6970d991a0fbad6305811585d7796']
  };
  const root = path.join(__dirname, '../assets/tutorial-sounds');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
  for (const [kind, [file, digest]] of Object.entries(expected)) {
    assert.equal(soundFiles[kind], file); assert.equal(manifest.sounds[kind].file, file);
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), digest);
    assert.equal(manifest.sounds[kind].sha256, digest);
    assert.equal(bytes.length, manifest.sounds[kind].bytes);
  }
});

test('opening prepares context without loading or playing; real typing loads once and loops one source', async () => {
  const h = harness(); h.sound.tap('a'); assert.equal(h.creates, 0);
  await h.sound.unlock(); assert.equal(h.loads.length, 0); assert.equal(h.sources.length, 0);
  h.sound.tap('a'); h.sound.tap('b'); await settle(); h.sound.tap('c');
  assert.equal(h.creates, 1); assert.equal(h.loads.length, 1); assert.equal(h.sources.length, 1);
  assert.ok(h.loads[0].url.endsWith(soundFiles.typing)); assert.equal(h.sources[0].loop, true);
  assert.equal(h.states.at(-1).typingActive, true);
  h.sound.stopTyping(); assert.equal(h.sources[0].stopped, true); assert.equal(h.states.at(-1).typingActive, false);
  h.sound.tap('d'); await settle(); assert.equal(h.sources.length, 2); assert.equal(h.loads.length, 1);
});

test('correct and wrong answers use their selected recording once, reuse decoding and never overlap', async () => {
  const h = harness(); await h.sound.unlock();
  assert.equal(await h.sound.answer(true), true); const correct = h.sources.at(-1);
  assert.ok(correct.buffer.url.endsWith(soundFiles.correct)); assert.equal(correct.loop, false);
  assert.equal(await h.sound.answer(false), true); const wrong = h.sources.at(-1);
  assert.equal(correct.stopped, true); assert.ok(wrong.buffer.url.endsWith(soundFiles.incorrect));
  assert.equal(wrong.loop, false); assert.ok(wrong.gain.gain.value <= 0.3);
  await h.sound.answer(true); assert.equal(wrong.stopped, true);
  assert.equal(h.sources.at(-1).buffer, correct.buffer); assert.equal(h.loads.length, 2);
  assert.equal(h.states.at(-1).answersPlayed, 3); assert.equal(h.states.at(-1).lastAnswerFile, soundFiles.correct);
});

test('the shared mute stops active effects and suppresses every recording without replay on enable', async () => {
  const h = harness(); await h.sound.unlock(); h.sound.tap('a'); await settle();
  h.sound.setEnabled(false); const before = h.sources.length, loads = h.loads.length;
  h.sound.tap('b'); await h.sound.answer(true); await h.sound.answer(false);
  assert.equal(h.sources[0].stopped, true); assert.equal(h.sources.length, before); assert.equal(h.loads.length, loads);
  h.sound.setEnabled(true); await settle(); assert.equal(h.sources.length, before);
  await h.sound.answer(false); h.sound.setEnabled(false); assert.equal(h.sources.at(-1).stopped, true);
});

test('a typing decode finishing after line completion, navigation or mute cannot start stale audio', async () => {
  for (const cancel of [h => h.sound.stopTyping(), h => h.sound.stop(), h => h.sound.setEnabled(false), h => h.hide()]) {
    const h = harness(); let resolve;
    h.settings.loader = url => new Promise(done => { resolve = () => done({ url }); });
    await h.sound.unlock(); h.sound.tap('a'); await settle(); cancel(h); resolve(); await settle();
    assert.equal(h.sources.length, 0);
  }
});

test('rapid line changes share an in-flight decode but only the current typing line starts', async () => {
  const h = harness(); let resolve;
  h.settings.loader = url => new Promise(done => { resolve = () => done({ url }); });
  await h.sound.unlock(); h.sound.tap('a'); await settle(); h.sound.stop(); h.sound.tap('b');
  resolve(); await settle();
  assert.equal(h.loads.length, 1); assert.equal(h.sources.length, 1); assert.equal(h.states.at(-1).typingActive, true);
});

test('late answer loads are ignored after mute, navigation, hidden view or page exit', async () => {
  for (const cancel of [h => h.sound.stop(), h => h.sound.setEnabled(false), h => h.hide(), h => h.sound.dispose()]) {
    const h = harness(); let resolve;
    h.settings.loader = url => new Promise(done => { resolve = () => done({ url }); });
    const pending = h.sound.answer(true); await settle(); cancel(h); resolve();
    assert.equal(await pending, false); assert.equal(h.sources.length, 0);
  }
  const h = harness(); const ready = new Map();
  h.settings.loader = url => new Promise(resolve => ready.set(url, () => resolve({ url })));
  const old = h.sound.answer(true); await settle(); const latest = h.sound.answer(false); await settle();
  for (const resolve of ready.values()) resolve();
  assert.equal(await old, false); assert.equal(await latest, true); assert.equal(h.sources.length, 1);
  assert.ok(h.sources[0].buffer.url.endsWith(soundFiles.incorrect));
});

test('a still-current first answer waits for decoding and plays exactly once when ready', async () => {
  for (const correct of [true, false]) {
    const h = harness(); let resolve;
    h.settings.loader = url => new Promise(done => { resolve = () => done({ url }); });
    const pending = h.sound.answer(correct); await settle();
    assert.equal(h.sources.length, 0); assert.equal(h.sound.enabled, true);
    resolve(); assert.equal(await pending, true); assert.equal(h.sources.length, 1);
    assert.equal(h.states.at(-1).answersPlayed, 1);
    assert.equal(h.states.at(-1).lastAnswer, correct ? 'correct' : 'incorrect');
  }
});

test('resume rejection, missing audio and decode/playback failures do not break the written tutorial', async () => {
  const unsupported = createTypingSound({ createContext: () => null });
  assert.equal(await unsupported.unlock(), false); assert.doesNotThrow(() => unsupported.tap('a'));
  const h = harness(); let first = true;
  h.settings.loader = async url => { if (first) { first = false; throw new Error('temporary download failure'); } return { url }; };
  assert.equal(await h.sound.answer(true), false); assert.equal(h.states.at(-1).errorKind, 'correct');
  assert.equal(await h.sound.answer(true), true); assert.equal(h.loads.length, 2);
  h.context.createBufferSource = () => { throw new Error('audio unavailable'); };
  assert.equal(await h.sound.answer(false), false);
  const suspended = harness(); suspended.context.resume = async () => { throw new Error('resume denied'); };
  assert.equal(await suspended.sound.answer(false), false); assert.equal(suspended.sources.length, 0);
});

test('completion stops only typing, while navigation stops answer effects and clears the active state', async () => {
  const h = harness(); await h.sound.answer(true);
  h.sound.stopTyping(); assert.notEqual(h.sources[0].stopped, true);
  h.sound.stop(); assert.equal(h.sources[0].stopped, true); assert.equal(h.states.at(-1).activeEffects, 0);
  h.sound.dispose(); assert.equal(h.context.state, 'closed');
});
