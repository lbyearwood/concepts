/* User-selected recordings, shared mute and cancellation; no queued playback. */
(() => {
  'use strict';
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
  function createTypingSound({ createContext, baseUrl, loadBuffer = fetchBuffer, isVisible = () => true, onChange = () => {} }) {
    let context = null, gains = null, buffers = new Map(), enabled = true, unavailable = false, generation = 0;
    let played = 0, answersPlayed = 0, lastAnswer = '', errorKind = '', typingSource = null, typingPending = null, typingEpoch = 0;
    const sources = new Set();
    const report = () => onChange({ enabled, unavailable, ready: context?.state === 'running', played, answersPlayed, lastAnswer,
      typingActive: !!typingSource, activeEffects: sources.size, errorKind, lastAnswerFile: lastAnswer ? soundFiles[lastAnswer] : '' });
    const visible = () => enabled && isVisible() && context?.state === 'running';
    function stopSource(source) {
      sources.delete(source);
      try { source.stop(); source.disconnect(); } catch (_) {}
    }
    function stopTyping() {
      typingEpoch++; typingPending = null;
      if (typingSource) stopSource(typingSource);
      typingSource = null; report();
    }
    function stop() {
      generation++; stopTyping();
      for (const source of sources) stopSource(source);
      report();
    }
    function bufferFor(kind) {
      if (!buffers.has(kind)) {
        const cache = buffers, current = context;
        const pending = Promise.resolve().then(() => loadBuffer(new URL(soundFiles[kind], baseUrl).href, current))
          .catch(error => { if (cache.get(kind) === pending) cache.delete(kind); throw error; });
        cache.set(kind, pending);
      }
      return buffers.get(kind);
    }
    async function unlock() {
      if (!enabled) return false;
      try {
        if (!context || context.state === 'closed') {
          context = createContext();
          if (!context) throw new Error('No Web Audio support');
          gains = { typing: context.createGain(), answer: context.createGain() };
          gains.typing.gain.value = 0.8; gains.answer.gain.value = 0.22;
          Object.values(gains).forEach(gain => gain.connect(context.destination));
          buffers = new Map();
        }
        if (context.state !== 'running') await context.resume();
        unavailable = false; report(); return context.state === 'running';
      } catch (_) { unavailable = true; enabled = false; stop(); report(); return false; }
    }
    function play(kind, buffer, loop = false) {
      if (!visible()) return null;
      const source = context.createBufferSource();
      try {
        source.buffer = buffer; source.loop = loop;
        source.connect(kind === 'typing' ? gains.typing : gains.answer); sources.add(source);
        source.onended = () => { sources.delete(source); if (typingSource === source) typingSource = null; source.disconnect(); report(); };
        source.start(); return source;
      } catch (error) { stopSource(source); throw error; }
    }
    function tap(character) {
      if (character === '\n' || !visible()) return;
      played++; report();
      if (typingSource || typingPending) return;
      const request = { generation, epoch: typingEpoch, context };
      typingPending = request;
      void bufferFor('typing').then(buffer => {
        if (request.generation !== generation || request.epoch !== typingEpoch || request.context !== context || !visible()) return;
        typingSource = play('typing', buffer, true); errorKind = ''; report();
      }).catch(() => { if (request.generation === generation && request.epoch === typingEpoch) { errorKind = 'typing'; report(); } })
        .finally(() => { if (typingPending === request) typingPending = null; });
    }
    async function answer(correct) {
      stop(); const request = generation, kind = correct ? 'correct' : 'incorrect';
      if (!enabled || !isVisible() || !await unlock() || request !== generation) return false;
      const current = context;
      try {
        const buffer = await bufferFor(kind);
        if (request !== generation || current !== context || !visible()) return false;
        if (!play(kind, buffer)) return false;
        answersPlayed++; lastAnswer = kind; errorKind = ''; report(); return true;
      } catch (_) { if (request === generation) { errorKind = kind; report(); } return false; }
    }
    function setEnabled(value) { enabled = value; if (!enabled) stop(); report(); if (enabled) void unlock(); }
    function dispose() { stop(); if (context && context.state !== 'closed') void context.close().catch(() => {}); }
    return { unlock, tap, answer, stopTyping, stop, dispose, setEnabled, get enabled() { return enabled; } };
  }
  const api = { createTypingSound, soundFiles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialTypingSound = api;
})();
