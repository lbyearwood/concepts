/* Quiet, locally generated key clicks. No files, services or scheduled backlog. */
(() => {
  'use strict';
  function createTypingSound({ createContext, isVisible = () => true, onChange = () => {}, random = Math.random }) {
    let context = null, gain = null, buffer = null, enabled = true, narrating = false, unavailable = false, played = 0;
    const sources = new Set();
    const report = () => onChange({ enabled, narrating, unavailable, ready: context?.state === 'running', played });
    function stop() {
      for (const source of sources) { try { source.stop(); source.disconnect(); } catch (_) {} }
      sources.clear();
    }
    async function unlock() {
      if (!enabled) return false;
      try {
        if (!context || context.state === 'closed') {
          context = createContext();
          if (!context) throw new Error('No Web Audio support');
          gain = context.createGain(); gain.gain.value = 0.045; gain.connect(context.destination);
          buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.018), context.sampleRate);
          const samples = buffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++) {
            const time = i / context.sampleRate;
            samples[i] = ((random() * 2 - 1) * 0.6 + Math.sin(time * Math.PI * 360) * 0.25) * Math.exp(-time * 260);
          }
        }
        if (context.state !== 'running') await context.resume();
        unavailable = false; report(); return context.state === 'running';
      } catch (_) { unavailable = true; enabled = false; stop(); report(); return false; }
    }
    function tap(character) {
      if (!enabled || narrating || !isVisible() || context?.state !== 'running' || character === '\n') return;
      try {
        const source = context.createBufferSource();
        source.buffer = buffer; source.playbackRate.value = character === ' ' ? 0.8 : 0.92 + random() * 0.16;
        source.connect(gain); sources.add(source);
        source.onended = () => { sources.delete(source); source.disconnect(); };
        source.start(); played++; report();
      } catch (_) { unavailable = true; enabled = false; stop(); report(); }
    }
    function setEnabled(value) { enabled = value; if (!enabled) stop(); report(); if (enabled) void unlock(); }
    function setNarrating(value) { narrating = value; if (value) stop(); report(); }
    function dispose() { stop(); if (context && context.state !== 'closed') void context.close().catch(() => {}); }
    return { unlock, tap, stop, dispose, setEnabled, setNarrating, get enabled() { return enabled; } };
  }
  const api = { createTypingSound };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialTypingSound = api;
})();
