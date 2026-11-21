/* Line playback is separate from the page so cancellation can be tested without a browser. */
(() => {
  'use strict';
  function tutorialCodeLines(problem, guide) {
    if (guide?.stageReviews) return guide.lines.map(line => ({ step: line.step, text: line.code }));
    return problem.steps.flatMap((step, stepIndex) => step.blocks
      .filter(block => block.type === 'code')
      .flatMap(block => block.text.split('\n').map(text => ({ step: stepIndex, text }))));
  }
  function walkthroughFrames(problem, guide, compact = false) {
    const lines = tutorialCodeLines(problem, guide);
    const forLine = line => [
      ...(compact ? [{ line, kind: 'code' }] : []),
      { line, kind: 'explanation' },
      ...['question', 'prediction'].filter(kind => guide.lines[line][kind])
        .map(kind => ({ line, kind, checkpoint: guide.lines[line][kind].id }))
    ];
    if (!guide.stageReviews) return lines.flatMap((_, line) => forLine(line));
    let lastLine = 0;
    return problem.steps.flatMap((_, step) => {
      const stageLines = lines.flatMap((item, line) => item.step === step ? [line] : []);
      if (stageLines.length) lastLine = stageLines.at(-1);
      return [...stageLines.flatMap(forLine), { line: lastLine, step, kind: 'review' }];
    });
  }
  function frameStep(frame, lines) { return frame.step ?? lines[frame.line].step; }
  function checkpointLimit(frames, isCorrect) {
    const locked = frames.findIndex(frame => frame.checkpoint && !isCorrect(frame.checkpoint));
    return locked < 0 ? frames.length - 1 : locked;
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
    function play(text, { write, done = () => {}, onCharacter = () => {}, instant = false }) {
      cancel();
      const line = { characters: Array.from(text), position: 0, write, done, onCharacter };
      active = line;
      if (instant || line.characters.length === 0) { finish(); return; }
      write('');
      function tick() {
        if (active !== line) return;
        timer = null;
        line.position++;
        write(line.characters.slice(0, line.position).join(''));
        line.onCharacter(line.characters[line.position - 1]);
        if (line.position === line.characters.length) {
          active = null;
          done();
        } else timer = schedule(tick, interval);
      }
      timer = schedule(tick, interval);
    }
    return { play, cancel, finish, get playing() { return active !== null; } };
  }
  const api = { tutorialCodeLines, createTypewriter, walkthroughFrames, checkpointLimit, frameStep };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRCodeWalkthrough = api;
})();
