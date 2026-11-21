/* Original generated character clicks and preloaded selected answer recordings. */
(() => {
  'use strict';
  // Keep the supplied typing recording for provenance; it is not used at runtime.
  const soundFiles = Object.freeze({
    typing: 'dragon-studio-keyboard-typing-sound-effect-335503.mp3',
    correct: 'dragon-studio-correct-472358.mp3',
    incorrect: 'universfield-wrong-answer-126515.mp3'
  });
  async function fetchBuffer(url, context) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Sound unavailable');
    return context.decodeAudioData(await response.arrayBuffer());
  }
  function createTypingSound({ createContext, baseUrl, loadBuffer = fetchBuffer, isVisible = () => true, onChange = () => {}, random = Math.random, now = () => performance.now() }) {
    let context = null, gains = null, typingBuffer = null, buffers = new Map(), decoded = new Map(), enabled = true, unavailable = false, generation = 0;
    let played = 0, answersPlayed = 0, lastAnswer = '', errorKind = '', lastAnswerWaitMs = null;
    const sources = new Set(), typingSources = new Set();
    const report = () => onChange({ enabled, unavailable, ready: context?.state === 'running', played, answersPlayed, lastAnswer,
      typingActive: typingSources.size > 0, activeEffects: sources.size, errorKind, buffersReady: decoded.size,
      answerBuffersReady: decoded.size, typingBufferReady: !!typingBuffer,
      lastAnswerWaitMs, lastAnswerFile: lastAnswer ? soundFiles[lastAnswer] : '' });
    const visible = () => enabled && isVisible() && context?.state === 'running';
    function stopSource(source) {
      sources.delete(source); typingSources.delete(source);
      try { source.stop(); source.disconnect(); } catch (_) {}
    }
    function stopTyping() { for (const source of typingSources) stopSource(source); report(); }
    function stop() { generation++; for (const source of sources) stopSource(source); report(); }
    function bufferFor(kind) {
      if (!buffers.has(kind)) {
        const cache = buffers, current = context;
        const pending = Promise.resolve().then(() => loadBuffer(new URL(soundFiles[kind], baseUrl).href, current))
          .then(buffer => { if (context === current && buffers === cache) { decoded.set(kind, buffer); report(); } return buffer; })
          .catch(error => { if (cache.get(kind) === pending) cache.delete(kind); throw error; });
        cache.set(kind, pending);
      }
      return buffers.get(kind);
    }
    function preload() { for (const kind of ['correct', 'incorrect']) void bufferFor(kind).catch(() => {}); }
    async function unlock() {
      if (!enabled) return false;
      try {
        if (!context || context.state === 'closed') {
          context = createContext();
          if (!context) throw new Error('No Web Audio support');
          gains = { typing: context.createGain(), answer: context.createGain() };
          gains.typing.gain.value = 0.045; gains.answer.gain.value = 0.22;
          Object.values(gains).forEach(gain => gain.connect(context.destination));
          buffers = new Map(); decoded = new Map();
          typingBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.018), context.sampleRate);
          const samples = typingBuffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++) {
            const time = i / context.sampleRate;
            samples[i] = ((random() * 2 - 1) * 0.6 + Math.sin(time * Math.PI * 360) * 0.25) * Math.exp(-time * 260);
          }
        }
        if (context.state !== 'running') await context.resume();
        unavailable = false;
        if (context.state === 'running' && enabled) preload();
        report(); return context.state === 'running';
      } catch (_) { unavailable = true; enabled = false; stop(); report(); return false; }
    }
    function play(kind, buffer, rate = 1) {
      if (!visible()) return null;
      const source = context.createBufferSource();
      try {
        source.buffer = buffer; source.loop = false; source.playbackRate.value = rate;
        source.connect(kind === 'typing' ? gains.typing : gains.answer);
        sources.add(source); if (kind === 'typing') typingSources.add(source);
        source.onended = () => { sources.delete(source); typingSources.delete(source); source.disconnect(); report(); };
        source.start(); return source;
      } catch (error) { stopSource(source); throw error; }
    }
    function tap(character) {
      if (character === '\n' || !visible()) return;
      try {
        if (play('typing', typingBuffer, character === ' ' ? 0.8 : 0.92 + random() * 0.16)) { played++; errorKind = ''; report(); }
      } catch (_) { errorKind = 'typing'; report(); }
    }
    function playAnswer(kind, buffer, startedAt) {
      if (!play(kind, buffer)) return false;
      answersPlayed++; lastAnswer = kind; errorKind = ''; lastAnswerWaitMs = Math.max(0, now() - startedAt); report(); return true;
    }
    function answer(correct) {
      stop(); const request = generation, kind = correct ? 'correct' : 'incorrect', startedAt = now();
      if (!enabled || !isVisible()) return Promise.resolve(false);
      try {
        if (visible() && decoded.has(kind)) return Promise.resolve(playAnswer(kind, decoded.get(kind), startedAt));
      } catch (_) { errorKind = kind; report(); return Promise.resolve(false); }
      return (async () => {
        if (!await unlock() || request !== generation) return false;
        const current = context;
        try {
          const buffer = await bufferFor(kind);
          if (request !== generation || current !== context || !visible()) return false;
          return playAnswer(kind, buffer, startedAt);
        } catch (_) { if (request === generation) { errorKind = kind; report(); } return false; }
      })();
    }
    function setEnabled(value) { enabled = value; if (!enabled) stop(); report(); if (enabled) void unlock(); }
    function dispose() { stop(); if (context && context.state !== 'closed') void context.close().catch(() => {}); }
    return { unlock, tap, answer, stopTyping, stop, dispose, setEnabled, get enabled() { return enabled; } };
  }
  const api = { createTypingSound, soundFiles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialTypingSound = api;
})();
