/* Quiet, locally generated key/answer effects. One mute switch; no queued backlog. */
(() => {
  'use strict';
  function createTypingSound({ createContext, isVisible = () => true, onChange = () => {}, random = Math.random }) {
    let context = null, gain = null, enabled = true, unavailable = false, played = 0, answersPlayed = 0, lastAnswer = '', generation = 0;
    let buffers = new Map();
    const sources = new Set();
    const report = () => onChange({ enabled, unavailable, ready: context?.state === 'running', played, answersPlayed, lastAnswer });
    function stop() {
      generation++;
      for (const source of sources) { try { source.stop(); source.disconnect(); } catch (_) {} }
      sources.clear();
    }
    function getBuffer(kind) {
      if (buffers.has(kind)) return buffers.get(kind);
      const duration = kind === 'correct' ? 0.42 : kind === 'incorrect' ? 0.18 : 0.018;
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        const time = i / context.sampleRate, wave = frequency => Math.sin(time * Math.PI * 2 * frequency);
        samples[i] = kind === 'typing'
          ? ((random() * 2 - 1) * 0.6 + wave(180) * 0.25) * Math.exp(-time * 260)
          : kind === 'correct'
            ? (wave(880) + wave(1320) * 0.28 + wave(1760) * 0.13) / 1.41 * Math.min(1, time / 0.004) * Math.exp(-time * 9)
            : (wave(140) + wave(280) * 0.35 + wave(420) * 0.2) / 1.55 * Math.min(1, time / 0.004, (duration - time) / 0.03) * 0.8;
      }
      buffers.set(kind, buffer); return buffer;
    }
    async function unlock() {
      if (!enabled) return false;
      try {
        if (!context || context.state === 'closed') {
          context = createContext();
          if (!context) throw new Error('No Web Audio support');
          gain = context.createGain(); gain.gain.value = 0.045; gain.connect(context.destination);
          buffers = new Map(); getBuffer('typing');
        }
        if (context.state !== 'running') await context.resume();
        unavailable = false; report(); return context.state === 'running';
      } catch (_) { unavailable = true; enabled = false; stop(); report(); return false; }
    }
    function play(kind, rate = 1) {
      if (!enabled || !isVisible() || context?.state !== 'running') return false;
      try {
        const source = context.createBufferSource();
        source.buffer = getBuffer(kind); source.playbackRate.value = rate;
        source.connect(gain); sources.add(source);
        source.onended = () => { sources.delete(source); source.disconnect(); };
        source.start();
        if (kind === 'typing') played++;
        else { answersPlayed++; lastAnswer = kind; }
        report(); return true;
      } catch (_) { unavailable = true; enabled = false; stop(); report(); return false; }
    }
    function tap(character) { if (character !== '\n') play('typing', character === ' ' ? 0.8 : 0.92 + random() * 0.16); }
    async function answer(correct) {
      stop(); const request = generation;
      if (!enabled || !isVisible() || !await unlock() || request !== generation) return false;
      return play(correct ? 'correct' : 'incorrect');
    }
    function setEnabled(value) { enabled = value; if (!enabled) stop(); report(); if (enabled) void unlock(); }
    function dispose() { stop(); if (context && context.state !== 'closed') void context.close().catch(() => {}); }
    return { unlock, tap, answer, stop, dispose, setEnabled, get enabled() { return enabled; } };
  }
  const api = { createTypingSound };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialTypingSound = api;
})();
