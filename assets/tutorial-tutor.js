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
    let playButton = null;
    let playLabel = null;
    let playIcon = null;
    let audioStatus = null;
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
        playButton.disabled = phase === 'loading';
        playLabel.textContent = ({ playing: 'Pause explanation', paused: 'Resume explanation', ended: 'Replay explanation', loading: 'Loading audio…' })[phase] || 'Play explanation';
        playIcon.textContent = phase === 'playing' ? 'Ⅱ' : '▶';
        playButton.setAttribute('aria-pressed', String(phase === 'playing'));
        audioStatus.textContent = phase === 'error' ? 'Audio could not play. Try again, or read the explanation below.' : '';
      }
    });
    function show(problemId, lineIndex) {
      player.stop();
      const guide = guides.problems[problemId];
      const line = guide?.lines[lineIndex];
      panel.hidden = !line;
      if (!line) return;
      panel.replaceChildren();
      const heading = node('header', 'tutor-heading');
      heading.append(node('p', 'tutor-line-label', 'Your tutor · Line ' + (lineIndex + 1) + ' of ' + guide.lines.length));
      heading.append(node('h3', '', line.title));
      playButton = node('button', 'tutor-play');
      playIcon = node('span', 'tutor-play-icon', '▶');
      playIcon.setAttribute('aria-hidden', 'true');
      playLabel = node('span', '', 'Play explanation');
      playButton.append(playIcon, playLabel);
      playButton.type = 'button';
      playButton.addEventListener('click', player.toggle);
      audioStatus = node('p', 'tutor-audio-status');
      audioStatus.setAttribute('role', 'status');
      heading.append(playButton, audioStatus);
      panel.append(heading);
      const explanation = node('div', 'tutor-explanation');
      line.paragraphs.forEach(text => explanation.append(node('p', '', text)));
      panel.append(explanation);
      const reminder = node('div', 'tutor-reminder');
      reminder.append(node('strong', '', 'Remember'), node('p', '', line.watchOut));
      explanation.append(reminder);
      if (line.question) {
        const question = line.question;
        const key = problemId + ':' + lineIndex;
        const fieldset = node('fieldset', 'tutor-check');
        fieldset.append(node('legend', '', 'Check your understanding'), node('p', 'tutor-check-prompt', question.prompt));
        const feedback = node('p', 'tutor-feedback');
        feedback.setAttribute('role', 'status');
        feedback.hidden = true;
        const views = node('div', 'tutor-views');
        views.setAttribute('role', 'group');
        views.setAttribute('aria-label', 'Tutor content');
        const explainButton = node('button', '', 'Explanation');
        const checkButton = node('button', '', 'Quick check');
        explainButton.type = checkButton.type = 'button';
        fieldset.hidden = true;
        function selectView(check) {
          explanation.hidden = check;
          fieldset.hidden = !check;
          explainButton.setAttribute('aria-pressed', String(!check));
          checkButton.setAttribute('aria-pressed', String(check));
          panel.scrollTop = 0;
        }
        explainButton.addEventListener('click', () => selectView(false));
        checkButton.addEventListener('click', () => selectView(true));
        views.append(explainButton, checkButton);
        heading.append(views);
        selectView(false);
        function answer(index) {
          const result = checkAnswer(question, index);
          answers.set(key, index);
          feedback.textContent = result.text;
          feedback.className = 'tutor-feedback ' + (result.correct ? 'is-correct' : 'is-incorrect');
          feedback.hidden = false;
          const overflow = feedback.getBoundingClientRect().bottom - panel.getBoundingClientRect().bottom;
          if (overflow > 0 && !fieldset.hidden) panel.scrollTop += overflow + 12;
        }
        question.choices.forEach((choice, index) => {
          const label = node('label', 'tutor-choice');
          const input = node('input');
          input.type = 'radio';
          input.name = 'tutor-answer-' + lineIndex;
          input.value = String(index);
          input.checked = answers.get(key) === index;
          input.addEventListener('change', () => answer(index));
          label.append(input, node('span', '', choice.text));
          fieldset.append(label);
        });
        fieldset.append(feedback);
        panel.append(fieldset);
        if (answers.has(key)) answer(answers.get(key));
      }
      panel.scrollTop = 0;
      player.setSource(new URL('../../../' + line.audio, window.location.href).href);
    }
    function hide() { player.stop(); panel.hidden = true; }
    function reset() { answers.clear(); hide(); }
    return { show, hide, reset };
  }
  const api = { createNarrationPlayer, checkAnswer, createTutor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialTutor = api;
})();
