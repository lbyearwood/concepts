/* Line playback is separate from the page so cancellation can be tested without a browser. */
(() => {
  'use strict';
  function tutorialCodeLines(problem) {
    return problem.steps.flatMap((step, stepIndex) => step.blocks
      .filter(block => block.type === 'code')
      .flatMap(block => block.text.split('\n').map(text => ({ step: stepIndex, text }))));
  }
  function createTypewriter({ schedule = setTimeout, unschedule = clearTimeout, interval = 32 } = {}) {
    let active = null;
    let timer = null;
    function cancel() {
      if (timer !== null) unschedule(timer);
      timer = null;
      active = null;
    }
    function finish() {
      if (!active) return;
      const line = active;
      cancel();
      line.write(line.characters.join(''));
      line.done();
    }
    function play(text, { write, done = () => {}, instant = false }) {
      cancel();
      const line = { characters: Array.from(text), position: 0, write, done };
      active = line;
      if (instant || line.characters.length === 0) { finish(); return; }
      write('');
      function tick() {
        if (active !== line) return;
        timer = null;
        line.position++;
        write(line.characters.slice(0, line.position).join(''));
        if (line.position === line.characters.length) {
          active = null;
          done();
        } else timer = schedule(tick, interval);
      }
      timer = schedule(tick, interval);
    }
    return { play, cancel, finish, get playing() { return active !== null; } };
  }
  const api = { tutorialCodeLines, createTypewriter };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRCodeWalkthrough = api;
})();
