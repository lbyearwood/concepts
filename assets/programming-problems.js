(() => {
  'use strict';
  function createDismissalGuard(dialog, isProtected) {
    function requestClose(reason) {
      if (isProtected() && reason !== 'close-button') return false;
      dialog.close(); return true;
    }
    dialog.addEventListener('cancel', event => { if (isProtected()) event.preventDefault(); });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) requestClose('outside');
    });
    return requestClose;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { createDismissalGuard }; return; }
  const dataNode = document.getElementById('problem-data');
  const dialog = document.getElementById('tutorial-modal');
  if (!dataNode || !dialog) return;
  const data = JSON.parse(dataNode.textContent);
  const categoryNames = new Map(data.categories.map(category => [category.id, category.title]));
  const collectionNames = {exam: 'Exam questions', level1: 'Level 1 problems', level2: 'Level 2', level3: 'Level 3'};
  const state = {collection: 'exam', category: 'traversal', problem: null, step: 0, line: 0, frame: 0};
  const requestClose = createDismissalGuard(dialog, () => !!guides.problems[state.problem]);
  const list = document.querySelector('.problem-list');
  const categoryTabs = document.querySelector('.problem-categories');
  const categoryPanel = document.getElementById('category-panel');
  const content = dialog.querySelector('.tutorial-step-content');
  const body = dialog.querySelector('.tutorial-body');
  const help = dialog.querySelector('.tutorial-help');
  const footer = dialog.querySelector('.tutorial-footer');
  const question = dialog.querySelector('.tutorial-question');
  const guides = JSON.parse(document.getElementById('tutorial-guide-data').textContent);
  const soundToggle = dialog.querySelector('.typing-sound-toggle');
  const typingSound = window.CSRTutorialTypingSound.createTypingSound({
    baseUrl: new URL('../../../assets/tutorial-sounds/', window.location.href).href,
    createContext: () => { const Context = window.AudioContext || window.webkitAudioContext; return Context ? new Context() : null; },
    isVisible: () => !document.hidden && dialog.open && help.open && !!guides.problems[state.problem],
    onChange: status => {
      soundToggle.setAttribute('aria-pressed', String(status.enabled));
      soundToggle.setAttribute('aria-label', status.enabled ? 'Mute all sound effects' : 'Enable sound effects');
      soundToggle.title = status.unavailable ? 'Sound unavailable; click to retry' : status.enabled ? status.answerBuffersReady === 2 ? 'Typing and answer sounds on' : 'Sound on; recordings preparing' : 'All sound effects off';
      soundToggle.querySelector('.typing-sound-label').textContent = status.enabled ? 'Sound on' : 'Sound off';
      soundToggle.dataset.audioReady = String(status.ready);
      soundToggle.dataset.clicksPlayed = String(status.played);
      soundToggle.dataset.answersPlayed = String(status.answersPlayed);
      soundToggle.dataset.lastAnswer = status.lastAnswer;
      soundToggle.dataset.lastAnswerFile = status.lastAnswerFile;
      soundToggle.dataset.typingActive = String(status.typingActive);
      soundToggle.dataset.activeEffects = String(status.activeEffects);
      soundToggle.dataset.soundError = status.errorKind;
      soundToggle.dataset.answerBuffersReady = String(status.answerBuffersReady);
      soundToggle.dataset.typingBufferReady = String(status.typingBufferReady);
      soundToggle.dataset.buffersReady = String(status.buffersReady);
      soundToggle.dataset.answerStartDelayMs = status.lastAnswerWaitMs === null ? '' : status.lastAnswerWaitMs.toFixed(1);
    }
  });
  const tutor = window.CSRTutorialTutor.createTutor(dialog.querySelector('.tutorial-tutor'), guides, {
    problems: data.problems,
    onAnswer: correct => { refreshCheckpointControls(); void typingSound.answer(correct); }
  });
  const { renderPython } = window.CSRTutorialCodeStyle;
  let codePager = null, examPager = null;
  new ResizeObserver(fitWorkspace).observe(body);
  const { tutorialCodeLines, createTypewriter, walkthroughFrames, checkpointLimit, frameStep } = window.CSRCodeWalkthrough;
  const typewriter = createTypewriter();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactView = window.matchMedia('(max-width:600px), (max-height:500px)');
  const framesFor = problem => walkthroughFrames(problem, guides.problems[problem.id], compactView.matches);
  const isTypedTutorial = problem => !!guides.problems[problem.id];
  const limitFor = (problem, frames) => checkpointLimit(frames, id => tutor.isCorrect(problem.id, id));
  function canVisitFrame(target) {
    const problem = data.problems.find(item => item.id === state.problem);
    return target >= 0 && target <= limitFor(problem, framesFor(problem));
  }
  function refreshCheckpointControls() {
    const next = dialog.querySelector('.tutorial-next');
    next.removeAttribute('aria-describedby');
    const problem = data.problems.find(item => item.id === state.problem);
    if (!problem || !isTypedTutorial(problem)) return;
    const frames = framesFor(problem), lines = tutorialCodeLines(problem, guides.problems[problem.id]), limit = limitFor(problem, frames);
    next.disabled = state.frame >= limit;
    if (frames[state.frame].checkpoint) next.setAttribute('aria-describedby', 'tutor-check-instruction');
    dialog.querySelectorAll('[data-step]').forEach(button => {
      const target = frames.findIndex(frame => frameStep(frame, lines) === Number(button.dataset.step));
      button.disabled = target > limit;
      button.title = button.disabled ? 'Answer the earlier question correctly first.' : '';
    });
  }
  let launcher = null;
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const icon = direction => {
    const node = element('span', 'problem-icon icon-' + direction);
    node.setAttribute('aria-hidden', 'true');
    return node;
  };
  function keepCodeVisible(node) {
    if (!!guides.problems[state.problem]) { codePager?.layout(true); return; }
    const overflow = node.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom;
    if (overflow > 0) body.scrollTop += overflow + 16;
  }
  function fitWorkspace() {
    if (!guides.problems[state.problem]) return;
    const bottom = body.getBoundingClientRect().bottom - parseFloat(getComputedStyle(body).paddingBottom);
    if (question.open && !help.open) {
      const gap = parseFloat(getComputedStyle(body).gap) || 0;
      const height = bottom - question.querySelector('summary').getBoundingClientRect().bottom - help.querySelector('summary').getBoundingClientRect().height - gap;
      dialog.style.setProperty('--exam-content-height', Math.max(0, Math.floor(height)) + 'px');
      examPager?.layout(); return;
    }
    if (!help.open) return;
    const top = help.querySelector('summary').getBoundingClientRect().bottom;
    dialog.style.setProperty('--tutorial-workspace-height', Math.max(0, Math.floor(bottom - top)) + 'px');
    codePager?.layout(true); tutor.layout();
  }
  function renderList() {
    const exam = state.collection === 'exam';
    document.querySelectorAll('[data-collection]').forEach(button => {
      const selected = button.dataset.collection === state.collection;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.getElementById('problem-panel').setAttribute('aria-labelledby', 'collection-' + state.collection);
    categoryTabs.hidden = !exam;
    document.querySelectorAll('[data-category]').forEach(button => {
      const selected = button.dataset.category === state.category;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    // The level collections are empty until their problems are supplied.
    const title = exam ? categoryNames.get(state.category) : collectionNames[state.collection];
    categoryPanel.setAttribute('role', exam ? 'tabpanel' : 'region');
    categoryPanel.setAttribute('aria-labelledby', exam ? 'category-' + state.category : 'problem-category-title');
    document.getElementById('problem-category-title').textContent = title;
    const problems = exam ? data.problems.filter(problem => problem.category === state.category) : [];
    list.setAttribute('aria-label', title + (title.endsWith('problems') ? '' : ' problems'));
    list.replaceChildren();
    problems.forEach((problem, index) => {
      const item = element('li');
      const button = element('button', 'problem-row');
      button.type = 'button';
      button.dataset.problem = problem.id;
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', 'tutorial-modal');
      const open = element('span', 'problem-open');
      open.append(element('span', '', 'Open question'), icon('right'));
      button.append(element('span', 'problem-number', String(index + 1).padStart(2, '0')), element('span', 'problem-title', problem.title), open);
      item.append(button);
      list.append(item);
    });
    const empty = document.querySelector('.problem-empty');
    empty.hidden = problems.length > 0;
    empty.textContent = exam ? 'No problems in this section yet.' : 'No problems have been added to this level yet.';
    document.querySelector('.problem-list-scroll').scrollTop = 0;
    document.querySelector('.problem-announcement').textContent = title + '. ' + problems.length + (problems.length === 1 ? ' problem.' : ' problems.');
  }
  function renderTypedCode(lines, animate) {
    const space = element('div', 'tutorial-code-space');
    const pre = element('pre', 'tutorial-code-editor');
    const code = element('code');
    pre.setAttribute('aria-label', 'Python code, line ' + (state.line + 1) + ' of ' + lines.length);
    let activeText;
    lines.slice(0, state.line + 1).forEach((line, index) => {
      const row = element('span', 'tutorial-code-line' + (index === state.line ? ' is-current' : ''));
      row.dataset.line = String(index + 1);
      const text = element('span', 'tutorial-code-text');
      renderPython(text, line.text, index === state.line ? 0 : line.text.length);
      row.append(text);
      code.append(row);
      if (index === state.line) activeText = text;
    });
    pre.append(code);
    space.append(pre); content.append(space);
    codePager = window.CSRTutorialFit.createPager(space, pre, () => [...code.children], 'code');
    const instant = !animate || !help.open || reducedMotion.matches;
    pre.classList.toggle('is-typing', !instant);
    pre.setAttribute('aria-busy', String(!instant));
    typewriter.play(lines[state.line].text, {
      instant,
      write: text => {
        renderPython(activeText, lines[state.line].text, text.length);
        if (help.open) keepCodeVisible(activeText);
      },
      onCharacter: character => typingSound.tap(character),
      done: () => {
        pre.classList.remove('is-typing');
        pre.setAttribute('aria-busy', 'false');
      }
    });
    return activeText;
  }
  function renderStep(animate = true) {
    typewriter.cancel();
    typingSound.stop();
    codePager = null;
    const problem = data.problems.find(item => item.id === state.problem);
    if (!problem) return;
    const typed = isTypedTutorial(problem);
    soundToggle.hidden = !typed;
    const lines = typed ? tutorialCodeLines(problem, guides.problems[problem.id]) : null;
    const frames = typed ? framesFor(problem) : null;
    let kind = 'explanation';
    if (typed) {
      state.frame = Math.max(0, Math.min(state.frame, frames.length - 1));
      state.line = frames[state.frame].line; kind = frames[state.frame].kind;
      state.step = frameStep(frames[state.frame], lines);
    }
    dialog.dataset.tutorialView = kind;
    state.step = Math.max(0, Math.min(state.step, problem.steps.length - 1));
    const step = problem.steps[state.step];
    dialog.querySelector('.tutorial-path').textContent = 'Exam questions / ' + categoryNames.get(problem.category);
    document.getElementById('tutorial-title').textContent = problem.title;
    dialog.querySelector('.tutorial-step-title').textContent = 'Step ' + (state.step + 1) + '. ' + step.title;
    const steps = dialog.querySelector('.tutorial-steps');
    steps.replaceChildren();
    problem.steps.forEach((item, index) => {
      const button = element('button', 'tutorial-step-button', String(index + 1));
      button.type = 'button';
      button.dataset.step = String(index);
      button.setAttribute('aria-label', 'Step ' + (index + 1) + '. ' + item.title);
      if (index === state.step) button.setAttribute('aria-current', 'step');
      steps.append(button);
    });
    content.replaceChildren();
    let activeText;
    if (typed) {
      const guide = guides.problems[problem.id];
      const intro = guide.stageReviews ? kind === 'review' ? 'Review this stage alongside the code.' : guide.lines[state.line].title + '.' : guide.lines[state.line].stageDescription || step.blocks.find(block => block.type === 'paragraph')?.text;
      if (intro) content.append(element('p', '', intro));
      activeText = renderTypedCode(lines, animate && (kind === 'code' || kind === 'explanation'));
    } else {
      step.blocks.forEach(block => {
      if (block.type === 'code') {
        const pre = element('pre');
        pre.append(element('code', '', block.text));
        content.append(pre);
      } else {
        const className = block.type === 'question' ? 'understanding-question' : block.type === 'error' ? 'common-error' : '';
        content.append(element('p', className, block.text));
      }
    });
    }
    if (typed && help.open && kind !== 'code') tutor.show(problem.id, state.line, kind, state.step);
    else tutor.hide();
    const last = typed ? state.frame === frames.length - 1 : state.step === problem.steps.length - 1;
    const progress = 'Step ' + (state.step + 1) + ' of ' + problem.steps.length;
    const counter = dialog.querySelector('.tutorial-counter');
    counter.hidden = typed; counter.textContent = typed ? '' : progress;
    dialog.querySelector('.tutorial-back').disabled = typed ? state.frame === 0 : state.step === 0;
    dialog.querySelector('.tutorial-next').disabled = typed && last;
    dialog.querySelector('[data-next-label]').textContent = last ? typed ? 'End' : 'Done' : typed ? frames[state.frame + 1].kind === 'review' ? 'Review' : frames[state.frame + 1].line === state.line ? frames[state.frame + 1].kind === 'prediction' ? 'Predict' : frames[state.frame + 1].kind === 'question' ? 'Question' : 'Explain line' : 'Next line' : 'Next';
    dialog.querySelector('.tutorial-next .problem-icon').hidden = last;
    refreshCheckpointControls();
    dialog.querySelector('.tutorial-announcement').textContent = help.open ? problem.title + '. Step ' + (state.step + 1) + '. ' + step.title + (typed ? '. Line ' + (state.line + 1) + ' of ' + lines.length + (kind === 'prediction' ? '. Predict the next step.' : '') : '') : problem.title + '. Exam question. Tutorial collapsed.';
    if (typed && help.open) fitWorkspace();
    else if (help.open) {
      body.scrollTop += help.getBoundingClientRect().top - body.getBoundingClientRect().top - parseFloat(getComputedStyle(body).paddingTop);
      if (activeText) keepCodeVisible(activeText);
    } else body.scrollTop = 0;
  }
  function openTutorial(id, button) {
    const problem = data.problems.find(item => item.id === id);
    if (!problem) return;
    launcher = button;
    tutor.reset();
    dialog.dataset.problem = problem.id;
    dialog.dataset.guided = String(isTypedTutorial(problem));
    dialog.setAttribute('closedby', isTypedTutorial(problem) ? 'none' : 'closerequest');
    state.problem = id;
    state.step = 0;
    state.line = 0;
    state.frame = 0;
    question.open = true;
    help.open = false;
    footer.hidden = true;
    const questionContent = dialog.querySelector('.tutorial-question-content');
    questionContent.replaceChildren();
    const questionText = isTypedTutorial(problem) ? element('div', 'tutorial-question-text') : questionContent;
    problem.question.context.forEach(text => questionText.append(element('p', '', text)));
    questionText.append(element('p', '', 'Write an algorithm that:'));
    const requirements = element('ol');
    problem.question.requirements.forEach((text, index) => { const item = element('li', '', text); item.value = index + 1; requirements.append(item); });
    questionText.append(requirements);
    examPager = null;
    if (isTypedTutorial(problem)) {
      questionContent.append(questionText);
      examPager = window.CSRTutorialFit.createPager(questionContent, questionText, () => [...questionText.querySelectorAll(':scope > p, :scope > ol > li')], 'exam question');
    }
    renderStep();
    dialog.showModal();
    if (isTypedTutorial(problem)) void typingSound.unlock();
    fitWorkspace();
  }
  help.addEventListener('toggle', () => {
    if (!!guides.problems[state.problem] && help.open) question.open = false;
    footer.hidden = !help.open;
    if (state.problem && help.open) renderStep();
    else { typewriter.cancel(); typingSound.stop(); tutor.hide(); fitWorkspace(); }
  });
  help.querySelector('summary').addEventListener('click', () => { if (!!guides.problems[state.problem] && !help.open) void typingSound.unlock(); });
  soundToggle.addEventListener('click', () => typingSound.setEnabled(!typingSound.enabled));
  document.addEventListener('visibilitychange', () => { if (document.hidden) typingSound.stop(); });
  window.addEventListener('pagehide', typingSound.dispose);
  question.addEventListener('toggle', () => { if (!!guides.problems[state.problem] && question.open && help.open) help.open = false; fitWorkspace(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) typewriter.finish(); });
  compactView.addEventListener('change', () => {
    if (!guides.problems[state.problem]) return;
    const problem = data.problems.find(item => item.id === state.problem), frames = framesFor(problem);
    const kind = dialog.dataset.tutorialView;
    const lines = tutorialCodeLines(problem, guides.problems[problem.id]);
    state.frame = frames.findIndex(frame => frame.line === state.line && frame.kind === kind && frameStep(frame, lines) === state.step);
    if (state.frame < 0) state.frame = frames.findIndex(frame => frame.line === state.line && frame.kind === 'explanation');
    renderStep(false);
  });
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-problem]');
    if (button) openTutorial(button.dataset.problem, button);
  });
  document.querySelector('.problem-collections').addEventListener('click', event => {
    const button = event.target.closest('[data-collection]');
    if (!button) return;
    state.collection = button.dataset.collection;
    renderList();
  });
  categoryTabs.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    renderList();
  });
  document.querySelectorAll('[role="tablist"]').forEach(tablist => {
    tablist.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = [...tablist.querySelectorAll('[role="tab"]')];
      const current = tabs.indexOf(event.target);
      if (current < 0) return;
      event.preventDefault();
      let next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].click();
      tabs[next].focus();
    });
  });
  dialog.querySelector('.tutorial-steps').addEventListener('click', event => {
    const button = event.target.closest('[data-step]');
    if (!button) return;
    const targetStep = Number(button.dataset.step);
    const problem = data.problems.find(item => item.id === state.problem);
    if (isTypedTutorial(problem)) {
      void typingSound.unlock();
      const lines = tutorialCodeLines(problem, guides.problems[problem.id]);
      const target = framesFor(problem).findIndex(frame => frameStep(frame, lines) === targetStep);
      if (!canVisitFrame(target)) return;
      state.frame = target;
    } else state.step = targetStep;
    renderStep();
    dialog.querySelector('[data-step="' + state.step + '"]').focus();
  });
  dialog.querySelector('.tutorial-back').addEventListener('click', () => {
    const problem = data.problems.find(item => item.id === state.problem);
    if (isTypedTutorial(problem)) state.frame--;
    else state.step--;
    renderStep(false);
    if (state.step === 0) dialog.querySelector('[data-step="0"]').focus();
  });
  dialog.querySelector('.tutorial-next').addEventListener('click', () => {
    const problem = data.problems.find(item => item.id === state.problem);
    if (isTypedTutorial(problem)) {
      if (!canVisitFrame(state.frame + 1)) return;
      void typingSound.unlock();
      typewriter.finish();
      const frames = framesFor(problem);
      if (state.frame === frames.length - 1) requestClose('done');
      else { const line = state.line; state.frame++; renderStep(frames[state.frame].line !== line); }
      return;
    }
    if (state.step === problem.steps.length - 1) requestClose('done');
    else { state.step++; renderStep(); }
  });
  dialog.querySelector('.tutorial-close').addEventListener('click', () => requestClose('close-button'));
  dialog.addEventListener('close', () => {
    typewriter.cancel();
    typingSound.stop();
    tutor.reset();
    state.problem = null;
    if (launcher?.isConnected) launcher.focus();
  });
  renderList();
})();
