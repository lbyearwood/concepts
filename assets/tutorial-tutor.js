(() => {
  'use strict';
  function createNarrationPlayer({ createAudio, onState }) {
    let audio = null;
    let phase = 'ready';
    const update = value => { phase = value; onState(value); };
    function stop() {
      const previous = audio;
      audio = null;
      if (previous) {
        previous.pause();
        previous.removeAttribute('src');
        previous.load();
      }
    }
    function setSource(source) {
      stop();
      const current = createAudio();
      audio = current;
      current.preload = 'none';
      current.src = source;
      for (const [event, value] of [['playing', 'playing'], ['pause', 'paused'], ['ended', 'ended'], ['error', 'error']]) {
        current.addEventListener(event, () => { if (audio === current) update(value); });
      }
      update('ready');
    }
    async function toggle() {
      const current = audio;
      if (!current || phase === 'loading') return;
      if (phase === 'playing') { current.pause(); return; }
      if (current.ended) current.currentTime = 0;
      update('loading');
      try {
        await current.play();
        if (audio === current && !current.paused) update('playing');
      } catch (_) {
        if (audio === current) update('error');
      }
    }
    return { setSource, toggle, stop };
  }
  function checkAnswer(question, index) {
    const choice = question.choices[index];
    return { correct: choice.correct, text: choice.feedback };
  }
  function createTutor(panel, guides) {
    const answers = new Map();
    let pager = null, playButton = null, playIcon = null, audioStatus = null;
    const node = (tag, className, text) => {
      const item = document.createElement(tag);
      if (className) item.className = className;
      if (text !== undefined) item.textContent = text;
      return item;
    };
    const player = createNarrationPlayer({
      createAudio: () => document.createElement('audio'),
      onState: phase => {
        if (!playButton) return;
        const label = ({ playing: 'Pause explanation', paused: 'Resume explanation', ended: 'Replay explanation', loading: 'Loading audio' })[phase] || 'Play explanation';
        playButton.disabled = phase === 'loading';
        playButton.setAttribute('aria-label', label); playButton.title = label;
        playIcon.textContent = phase === 'playing' ? 'Ⅱ' : phase === 'loading' ? '…' : '▶';
        playButton.setAttribute('aria-pressed', String(phase === 'playing'));
        audioStatus.textContent = phase === 'error' ? 'Audio could not play. Try again or read the explanation.' : '';
        pager?.layout();
      }
    });
    function show(problemId, lineIndex, kind = 'explanation') {
      player.stop(); pager = null;
      const guide = guides.problems[problemId], line = guide?.lines[lineIndex];
      panel.hidden = !line;
      if (!line) return;
      panel.replaceChildren();
      panel.classList.toggle('is-question', kind === 'question');
      const heading = node('header', 'tutor-heading');
      const copy = node('div', 'tutor-heading-copy');
      copy.append(node('p', 'tutor-line-label', 'Line ' + (lineIndex + 1) + ' of ' + guide.lines.length));
      copy.append(node('h3', '', kind === 'question' ? 'Question' : line.title));
      playButton = node('button', 'tutor-play'); playButton.type = 'button';
      playIcon = node('span', 'tutor-play-icon', '▶'); playIcon.setAttribute('aria-hidden', 'true');
      playButton.append(playIcon); playButton.addEventListener('click', player.toggle);
      heading.append(copy, playButton); panel.append(heading);
      audioStatus = node('p', 'tutor-audio-status'); audioStatus.setAttribute('role', 'status');
      panel.append(audioStatus);
      if (kind === 'question' && line.question) {
        const question = line.question, key = problemId + ':' + lineIndex;
        panel.append(node('code', 'tutor-question-code', line.code.trim()));
        const prompt = node('p', 'tutor-check-prompt', question.prompt);
        prompt.id = 'tutor-prompt'; panel.append(prompt);
        const viewport = node('div', 'tutor-content');
        viewport.setAttribute('role', 'radiogroup'); viewport.setAttribute('aria-labelledby', prompt.id);
        const announcement = node('p', 'sr-only');
        announcement.setAttribute('role', 'status');
        function answer(index) {
          const result = checkAnswer(question, index); answers.set(key, index);
          viewport.querySelectorAll('[data-feedback]').forEach(item => item.remove());
          const part = node('p', 'tutor-feedback ' + (result.correct ? 'is-correct' : 'is-incorrect'), result.text);
          part.dataset.feedback = 'true'; part.dataset.fitText = 'true';
          part.setAttribute('aria-hidden', 'true'); viewport.append(part);
          announcement.textContent = result.text;
          pager?.layout(); pager?.layout(false, viewport.querySelector('[data-feedback]'));
        }
        question.choices.forEach((choice, index) => {
          const label = node('label', 'tutor-choice'), input = node('input');
          input.type = 'radio'; input.name = 'tutor-answer-' + lineIndex; input.value = String(index);
          input.checked = answers.get(key) === index;
          input.addEventListener('change', () => answer(index));
          label.append(input, node('span', '', choice.text)); viewport.append(label);
        });
        panel.append(viewport, announcement);
        pager = window.CSRTutorialFit.createPager(panel, viewport, () => [...viewport.children], 'answer');
        if (answers.has(key)) answer(answers.get(key));
      } else {
        const viewport = node('div', 'tutor-content tutor-explanation');
        [...line.paragraphs, 'Remember: ' + line.watchOut].forEach((text, index) => {
          const part = node('p', index === line.paragraphs.length ? 'tutor-reminder' : '', text);
          part.dataset.fitText = 'true'; viewport.append(part);
        });
        panel.append(viewport);
        pager = window.CSRTutorialFit.createPager(panel, viewport, () => [...viewport.children], 'explanation');
      }
      player.setSource(new URL('../../../' + line.audio, window.location.href).href);
    }
    function hide() { player.stop(); panel.hidden = true; pager = null; }
    function reset() { answers.clear(); hide(); }
    return { show, hide, reset, layout: () => pager?.layout() };
  }
  const api = { createNarrationPlayer, checkAnswer, createTutor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialTutor = api;
})();
