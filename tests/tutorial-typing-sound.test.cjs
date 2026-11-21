const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createTypingSound, soundFiles } = require('../assets/tutorial-typing-sound.js');
const settle = () => new Promise(resolve => setImmediate(resolve));

function harness() {
  let visible = true, creates = 0;
  const sources = [], states = [], loads = [], samples = [];
  const context = {
    state: 'suspended', sampleRate: 48000, destination: {},
    createGain: () => ({ gain: {}, connect() {} }),
    createBuffer: (channels, length) => { const data = new Float32Array(length); samples.push(data); return { getChannelData: () => data }; },
    createBufferSource() {
      const source = { playbackRate: {}, connect(target) { this.gain = target; }, disconnect() {},
        start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(source); return source;
    },
    async resume() { this.state = 'running'; }, async close() { this.state = 'closed'; }
  };
  const settings = { loader: async url => ({ url }) };
  const sound = createTypingSound({ createContext: () => { creates++; return context; },
    baseUrl: 'https://example.test/assets/tutorial-sounds/',
    loadBuffer: (url, ctx) => { loads.push({ url, ctx }); return settings.loader(url); },
    isVisible: () => visible, onChange: state => states.push(state), random: () => 0.7 });
  return { sound, context, sources, states, loads, samples, settings, get creates() { return creates; }, hide() { visible = false; } };
}
function delayed(h) {
  const ready = new Map();
  h.settings.loader = url => new Promise(resolve => ready.set(url, () => resolve({ url })));
  return () => { for (const resolve of ready.values()) resolve(); };
}

test('chosen answer MP3s and the retained inactive typing recording preserve their exact source bytes', () => {
  const expected = {
    typing: ['dragon-studio-keyboard-typing-sound-effect-335503.mp3', 'cd043f1b6a0f52388b2754e5b648f343baeda4b1af93cf5e35582839568eef4c'],
    correct: ['dragon-studio-correct-472358.mp3', 'a106868fd8a145542ed741b1a784a9324c3b6bcbadbef1cb5680f6ac0dad0097'],
    incorrect: ['universfield-wrong-answer-126515.mp3', '16098fa3e3c9b98a9b53397f935edbcc8bb6970d991a0fbad6305811585d7796']
  };
  const root = path.join(__dirname, '../assets/tutorial-sounds'), manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
  for (const [kind, [file, digest]] of Object.entries(expected)) {
    assert.equal(soundFiles[kind], file); assert.equal(manifest.sounds[kind].file, file);
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), digest);
    assert.equal(manifest.sounds[kind].sha256, digest); assert.equal(bytes.length, manifest.sounds[kind].bytes);
    assert.equal(manifest.sounds[kind].active, kind !== 'typing');
  }
});

test('the opening gesture prepares both answer buffers once without playing or loading the typing MP3', async () => {
  const h = harness(); h.sound.tap('a'); assert.equal(h.creates, 0);
  await h.sound.unlock(); await settle();
  assert.equal(h.loads.length, 2); assert.equal(h.sources.length, 0); assert.equal(h.creates, 1);
  assert.equal(h.states.at(-1).answerBuffersReady, 2);
  assert.ok(h.loads.some(item => item.url.endsWith(soundFiles.correct)));
  assert.ok(h.loads.some(item => item.url.endsWith(soundFiles.incorrect)));
  assert.ok(h.loads.every(item => !item.url.endsWith(soundFiles.typing)));
  await h.sound.unlock(); await settle(); assert.equal(h.loads.length, 2);
});

test('even one short character gets an immediate quiet generated click while MP3 loads are pending', async () => {
  const h = harness(), resolve = delayed(h); await h.sound.unlock();
  h.sound.tap('a'); assert.equal(h.sources.length, 1); assert.equal(h.sources[0].started, true);
  h.sound.tap('b'); assert.equal(h.sources.length, 2);
  assert.equal(h.sources[0].loop, false); assert.equal(h.sources[0].buffer, h.sources[1].buffer);
  assert.equal(h.samples.length, 1); assert.ok(h.samples[0].length / h.context.sampleRate <= 0.0181);
  assert.ok(h.samples[0].every(value => Number.isFinite(value) && Math.abs(value) <= 1));
  assert.ok(h.samples[0].some(value => value !== 0)); assert.equal(h.sources[0].gain.gain.value, 0.045);
  assert.equal(h.states.at(-1).played, 2); h.sources[0].onended(); h.sources[1].onended();
  assert.equal(h.states.at(-1).typingActive, false); resolve(); await settle();
});

test('a prepared first answer starts synchronously on selection, without fetching or decoding then', async () => {
  const h = harness(); await h.sound.unlock(); await settle();
  const pending = h.sound.answer(true);
  assert.equal(h.sources.length, 1); assert.equal(h.sources[0].started, true);
  assert.equal(h.loads.length, 2); assert.equal(await pending, true);
  const correct = h.sources[0]; await h.sound.answer(false);
  assert.equal(correct.stopped, true); assert.ok(h.sources[1].buffer.url.endsWith(soundFiles.incorrect));
  assert.equal(h.sources[1].playbackRate.value, 1); assert.equal(h.sources[1].gain.gain.value, 0.22);
  await h.sound.answer(true); assert.equal(h.sources[1].stopped, true); assert.equal(h.loads.length, 2);
  assert.equal(h.sources[2].buffer, correct.buffer);
});

test('an unusually early still-current answer shares preload and plays once when its clip is ready', async () => {
  for (const correct of [true, false]) {
    const h = harness(), resolve = delayed(h); await h.sound.unlock();
    const pending = h.sound.answer(correct); await settle();
    assert.equal(h.sources.length, 0); assert.equal(h.loads.length, 2);
    resolve(); assert.equal(await pending, true); assert.equal(h.sources.length, 1);
    assert.equal(h.states.at(-1).answersPlayed, 1);
    assert.equal(h.states.at(-1).lastAnswer, correct ? 'correct' : 'incorrect');
  }
});

test('shared mute stops generated clicks and answer recordings; enabling never replays an old effect', async () => {
  const h = harness(); await h.sound.unlock(); await settle(); h.sound.tap('a');
  h.sound.setEnabled(false); assert.equal(h.sources[0].stopped, true);
  h.sound.tap('b'); await h.sound.answer(true); await h.sound.answer(false); assert.equal(h.sources.length, 1);
  h.sound.setEnabled(true); await settle(); assert.equal(h.sources.length, 1);
  await h.sound.answer(false); h.sound.setEnabled(false); assert.equal(h.sources[1].stopped, true);
  assert.equal(h.states.at(-1).activeEffects, 0); assert.equal(h.loads.length, 2);
});

test('preload completion after mute, navigation, hiding or Close cannot replay a stale answer', async () => {
  for (const cancel of [h => h.sound.stop(), h => h.sound.setEnabled(false), h => h.hide(), h => h.sound.dispose()]) {
    const h = harness(), resolve = delayed(h); await h.sound.unlock();
    const pending = h.sound.answer(true); await settle(); cancel(h); resolve();
    assert.equal(await pending, false); assert.equal(h.sources.length, 0);
  }
});

test('rapid choices reuse the in-flight preloads and play only the current answer', async () => {
  const h = harness(), resolve = delayed(h); await h.sound.unlock();
  const old = h.sound.answer(true); const latest = h.sound.answer(false); await settle(); resolve();
  assert.equal(await old, false); assert.equal(await latest, true);
  assert.equal(h.sources.length, 1); assert.equal(h.loads.length, 2);
  assert.ok(h.sources[0].buffer.url.endsWith(soundFiles.incorrect));
});

test('a failed preload does not stop keyboard clicks and a later real choice retries its file', async () => {
  const h = harness(); let failCorrect = true;
  h.settings.loader = async url => {
    if (url.endsWith(soundFiles.correct) && failCorrect) { failCorrect = false; throw new Error('temporary download failure'); }
    return { url };
  };
  await h.sound.unlock(); await settle(); h.sound.tap('x'); assert.equal(h.sources.length, 1);
  assert.equal(h.sound.enabled, true); assert.equal(await h.sound.answer(true), true);
  assert.equal(h.loads.filter(item => item.url.endsWith(soundFiles.correct)).length, 2);
});

test('unsupported context and a rejected resume leave learning usable without stale sound', async () => {
  const unsupported = createTypingSound({ createContext: () => null });
  assert.equal(await unsupported.unlock(), false); assert.doesNotThrow(() => unsupported.tap('a'));
  const h = harness(); h.context.resume = async () => { throw new Error('resume denied'); };
  assert.equal(await h.sound.answer(false), false); assert.equal(h.sources.length, 0);
});

test('navigation/disposal stop active sources and a late resume cannot resurrect a cancelled answer', async () => {
  const h = harness(); await h.sound.unlock(); await settle(); h.sound.tap('x'); await h.sound.answer(true);
  h.sound.stop(); assert.ok(h.sources.every(source => source.stopped)); assert.equal(h.states.at(-1).activeEffects, 0);
  h.sound.dispose(); assert.equal(h.context.state, 'closed');
  const suspended = harness(); let resume;
  suspended.context.resume = () => new Promise(resolve => { resume = () => { suspended.context.state = 'running'; resolve(); }; });
  const pending = suspended.sound.answer(true); suspended.sound.stop(); resume();
  assert.equal(await pending, false); assert.equal(suspended.sources.length, 0);
});
