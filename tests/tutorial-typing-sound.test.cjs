const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTypingSound } = require('../assets/tutorial-typing-sound.js');

function harness() {
  let visible = true, creates = 0;
  const events = [], sources = [], states = [], samples = [];
  const context = {
    state: 'suspended', sampleRate: 48000, destination: {},
    createGain: () => ({ gain: {}, connect() {} }),
    createBuffer: (channels, length) => { const data = new Float32Array(length); samples.push(data); return { getChannelData: () => data }; },
    createBufferSource() {
      const source = { playbackRate: {}, connect(target) { this.gain = target; }, disconnect() { events.push('disconnect'); },
        start() { events.push('start'); }, stop() { events.push('stop'); } };
      sources.push(source); return source;
    },
    async resume() { this.state = 'running'; }, async close() { this.state = 'closed'; }
  };
  const sound = createTypingSound({ createContext: () => { creates++; return context; }, isVisible: () => visible, onChange: state => states.push(state), random: () => 0.7 });
  return { sound, context, events, sources, states, samples, get creates() { return creates; }, hide() { visible = false; } };
}

test('sound is prepared only after a gesture, stays quiet and reuses its buffer/context', async () => {
  const h = harness(); h.sound.tap('a');
  assert.equal(h.creates, 0); assert.equal(h.sources.length, 0);
  await h.sound.unlock(); h.sound.tap('a'); h.sound.tap('b'); await h.sound.unlock();
  assert.equal(h.creates, 1); assert.equal(h.samples.length, 1); assert.equal(h.sources.length, 2);
  assert.ok(h.samples[0].some(value => value !== 0)); assert.ok(h.samples[0].every(Number.isFinite));
  assert.ok(h.samples[0].length / h.context.sampleRate < 0.025);
  assert.ok(h.sources[0].gain.gain.value <= 0.05);
  assert.equal(h.sources[0].buffer, h.sources[1].buffer);
  assert.equal(h.states.at(-1).played, 2);
});

test('muting cancels active sounds and does not queue characters for later', async () => {
  const h = harness(); await h.sound.unlock(); h.sound.tap('x');
  h.sound.setEnabled(false); h.sound.tap('y');
  assert.equal(h.events.filter(event => event === 'stop').length, 1);
  assert.equal(h.sources.length, 1);
  h.sound.setEnabled(true); assert.equal(h.sources.length, 1);
  h.sound.tap('z'); assert.equal(h.sources.length, 2);
});

test('narration has priority, pausing releases sound and hidden views stay silent', async () => {
  const h = harness(); await h.sound.unlock(); h.sound.tap('a');
  h.sound.setNarrating(true); h.sound.tap('b'); assert.equal(h.sources.length, 1);
  assert.ok(h.events.includes('stop'));
  h.sound.setNarrating(false); h.sound.tap('c'); assert.equal(h.sources.length, 2);
  h.hide(); h.sound.tap('d'); assert.equal(h.sources.length, 2);
});

test('navigation stop/disposal cancel sources and suspended contexts do not schedule a backlog', async () => {
  const h = harness(); await h.sound.unlock(); h.sound.tap('a'); h.sound.stop();
  assert.equal(h.events.filter(event => event === 'stop').length, 1);
  h.context.state = 'suspended'; h.sound.tap('b');
  await h.sound.unlock(); assert.equal(h.sources.length, 1);
  h.sound.tap('c'); h.sound.dispose();
  assert.equal(h.context.state, 'closed'); assert.equal(h.events.filter(event => event === 'stop').length, 2);
});

test('unsupported audio and playback errors cannot interrupt the code walkthrough', async () => {
  const unsupported = createTypingSound({ createContext: () => null });
  assert.equal(await unsupported.unlock(), false); assert.equal(unsupported.enabled, false);
  assert.doesNotThrow(() => unsupported.tap('a'));
  const h = harness(); await h.sound.unlock();
  h.context.createBufferSource = () => { throw new Error('audio device unavailable'); };
  assert.doesNotThrow(() => h.sound.tap('a')); assert.equal(h.sound.enabled, false);
  assert.equal(h.states.at(-1).unavailable, true);
});
