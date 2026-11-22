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
  function createProblemSession(problems) {
    const positions = new Map();
    return {
      save(id, position) { positions.set(id, { ...position }); },
      get(id) { const position = positions.get(id); return position ? { ...position } : null; },
      clear() { positions.clear(); },
      neighbour(id, direction) {
        if (direction !== -1 && direction !== 1) return null;
        const problem = problems.find(item => item.id === id);
        if (!problem) return null;
        const group = problems.filter(item => item.category === problem.category);
        return group[group.findIndex(item => item.id === id) + direction] || null;
      }
    };
  }
  function findPositionFrame(frames, lines, position, stepForFrame) {
    const find = kind => frames.findIndex(frame => frame.line === position.line && frame.kind === kind && stepForFrame(frame, lines) === position.step);
    const exact = find(position.kind);
    return exact >= 0 ? exact : Math.max(0, find('explanation'));
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { createDismissalGuard, createProblemSession, findPositionFrame }; return; }
  const dataNode = document.getElementById('problem-data');
  const dialog = document.getElementById('tutorial-modal');
  if (!dataNode || !dialog) return;
  const data = JSON.parse(dataNode.textContent);
  const categoryNames = new Map(data.categories.map(category => [category.id, category.title]));
  const practiceNames = new Map(data.practiceCategories.map(category => [category.id, category.title]));
  const collectionNames = {exam: 'Exam questions', level1: 'Easy', level2: 'Medium', level3: 'Hard'};
  const state = {collection: 'exam', category: 'traversal', practiceCategory: data.practiceCategories[0].id, problem: null, step: 0, line: 0, frame: 0, started: false};
  const session = createProblemSession(data.problems);
  const viewPages = new Map(), disclosureSync = new Map();
  let renderedView = null;
  const requestClose = createDismissalGuard(dialog, () => !!guides.problems[state.problem]);
  const list = document.querySelector('.problem-list');
  const categoryTabs = document.querySelector('.problem-categories');
  const categoryPicker = document.querySelector('.exam-category-picker');
  const categorySelect = document.getElementById('exam-category-select');
  const compactCategories = window.matchMedia('(max-width:600px), (max-height:500px) and (max-width:900px)');
  const practiceTabs = document.querySelector('.practice-categories');
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
  const viewKey = () => state.problem + ':' + state.line + ':' + state.step + ':' + dialog.dataset.tutorialView;
  function rememberViewPages() {
    if (!renderedView) return;
    const previous = viewPages.get(renderedView) || {};
    viewPages.set(renderedView, { code: codePager?.getPosition() ?? previous.code, tutor: tutor.getPosition() ?? previous.tutor });
  }
  function restoreViewPages() {
    const pages = viewPages.get(renderedView);
    if (!pages) return;
    codePager?.restorePosition(pages.code);
    tutor.restorePosition(pages.tutor);
  }
  function rememberProblem() {
    if (!state.problem) return;
    rememberViewPages();
    session.save(state.problem, { line: state.line, step: state.step, kind: dialog.dataset.tutorialView,
      questionOpen: question.open, helpOpen: help.open, started: state.started, examPage: examPager?.getPosition() });
  }
  function setDisclosure(details, open) {
    if (details.open === open) return;
    disclosureSync.set(details, open);
    details.open = open;
  }
  function isSyncedToggle(details) {
    const expected = disclosureSync.get(details);
    disclosureSync.delete(details);
    return expected === details.open;
  }
  function updateProblemNavigation(problem) {
    const nav = dialog.querySelector('.tutorial-problem-nav');
    nav.setAttribute('aria-label', 'Problems in ' + categoryNames.get(problem.category));
    for (const [selector, direction, label] of [['.tutorial-problem-previous', -1, 'Previous'], ['.tutorial-problem-next', 1, 'Next']]) {
      const button = nav.querySelector(selector), target = session.neighbour(problem.id, direction);
      button.disabled = !target;
      button.setAttribute('aria-label', label + ' problem in ' + categoryNames.get(problem.category));
      button.title = target ? label + ' problem: ' + target.title : label === 'Previous' ? 'First problem in this category' : 'Last problem in this category';
    }
  }
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
    codePager?.layout(); tutor.layout();
  }
  function syncCategoryPanel() {
    const exam = state.collection === 'exam', picker = exam && compactCategories.matches;
    categoryPanel.setAttribute('role', picker ? 'region' : 'tabpanel');
    categoryPanel.setAttribute('aria-labelledby', picker ? 'problem-category-title' : exam ? 'category-' + state.category : 'practice-category-' + state.practiceCategory);
  }
  compactCategories.addEventListener('change', syncCategoryPanel);
  function renderList() {
    const exam = state.collection === 'exam';
    document.querySelectorAll('[data-collection]').forEach(button => {
      const selected = button.dataset.collection === state.collection;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.getElementById('problem-panel').setAttribute('aria-labelledby', 'collection-' + state.collection);
    categoryTabs.hidden = !exam;
    categoryPicker.hidden = !exam;
    categorySelect.value = state.category;
    practiceTabs.hidden = exam;
    document.querySelector('.practice-console-note').hidden = exam;
    document.querySelectorAll('[data-category]').forEach(button => {
      const selected = button.dataset.category === state.category;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[data-practice-category]').forEach(button => {
      const selected = button.dataset.practiceCategory === state.practiceCategory;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    // Practice categories are ready for the user's later console problems.
    const title = exam ? categoryNames.get(state.category) : collectionNames[state.collection] + ' · ' + practiceNames.get(state.practiceCategory);
    syncCategoryPanel();
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
    empty.textContent = exam ? 'No problems in this section yet.' : 'No problems in this category yet.';
    document.querySelector('.problem-list-instruction').textContent = exam ? 'Choose a problem to open its exam question' : 'Choose a console problem';
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
    rememberViewPages();
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
    renderedView = viewKey();
    state.step = Math.max(0, Math.min(state.step, problem.steps.length - 1));
    const step = problem.steps[state.step];
    dialog.querySelector('.tutorial-path').textContent = 'Exam questions / ' + categoryNames.get(problem.category);
    document.getElementById('tutorial-title').textContent = problem.title;
    updateProblemNavigation(problem);
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
    if (typed && help.open) { fitWorkspace(); codePager?.layout(true); restoreViewPages(); }
    else if (help.open) {
      body.scrollTop += help.getBoundingClientRect().top - body.getBoundingClientRect().top - parseFloat(getComputedStyle(body).paddingTop);
      if (activeText) keepCodeVisible(activeText);
    } else body.scrollTop = 0;
  }
  function openTutorial(id, button) {
    const problem = data.problems.find(item => item.id === id);
    if (!problem) return;
    rememberProblem();
    typewriter.cancel(); typingSound.stop(); tutor.hide();
    codePager = null; renderedView = null;
    const saved = session.get(id);
    launcher = button || list.querySelector('[data-problem="' + id + '"]') || launcher;
    dialog.dataset.problem = problem.id;
    dialog.dataset.guided = String(isTypedTutorial(problem));
    dialog.setAttribute('closedby', isTypedTutorial(problem) ? 'none' : 'closerequest');
    state.problem = id;
    state.step = saved?.step || 0;
    state.line = saved?.line || 0;
    state.started = saved?.started || false;
    state.frame = saved && isTypedTutorial(problem) ? Math.min(findPositionFrame(framesFor(problem), tutorialCodeLines(problem, guides.problems[id]), saved, frameStep), limitFor(problem, framesFor(problem))) : 0;
    setDisclosure(question, saved?.questionOpen ?? true);
    setDisclosure(help, saved?.helpOpen ?? false);
    footer.hidden = !help.open;
    const questionContent = dialog.querySelector('.tutorial-question-content');
    questionContent.replaceChildren();
    const questionText = isTypedTutorial(problem) ? element('div', 'tutorial-question-text') : questionContent;
    problem.question.context.forEach(text => questionText.append(element('p', '', text)));
    questionText.append(element('p', '', 'Write an algorithm that:'));
    const requirements = element('ol');
    problem.question.requirements.forEach((text, index) => { const item = element('li', '', text); item.value = index + 1; requirements.append(item); });
    questionText.append(requirements);
    questionText.append(element('p', 'tutorial-question-marks', '(' + problem.question.marks + ' marks)'));
    examPager = null;
    if (isTypedTutorial(problem)) {
      questionContent.append(questionText);
      examPager = window.CSRTutorialFit.createPager(questionContent, questionText, () => [...questionText.querySelectorAll(':scope > p, :scope > ol > li')], 'exam question');
    }
    renderStep(false);
    if (!dialog.open) dialog.showModal();
    if (isTypedTutorial(problem)) void typingSound.unlock();
    fitWorkspace();
    examPager?.restorePosition(saved?.examPage);
    restoreViewPages();
  }
  help.addEventListener('toggle', () => {
    if (isSyncedToggle(help)) return;
    if (!!guides.problems[state.problem] && help.open) question.open = false;
    footer.hidden = !help.open;
    if (state.problem && help.open) { const animate = !state.started; state.started = true; renderStep(animate); }
    else { rememberViewPages(); typewriter.cancel(); typingSound.stop(); tutor.hide(); fitWorkspace(); }
  });
  help.querySelector('summary').addEventListener('click', () => { if (!!guides.problems[state.problem] && !help.open) void typingSound.unlock(); });
  soundToggle.addEventListener('click', () => typingSound.setEnabled(!typingSound.enabled));
  document.addEventListener('visibilitychange', () => { if (document.hidden) typingSound.stop(); });
  window.addEventListener('pagehide', typingSound.dispose);
  question.addEventListener('toggle', () => { if (isSyncedToggle(question)) return; if (!!guides.problems[state.problem] && question.open && help.open) help.open = false; fitWorkspace(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) typewriter.finish(); });
  compactView.addEventListener('change', () => {
    if (!guides.problems[state.problem]) return;
    const problem = data.problems.find(item => item.id === state.problem), frames = framesFor(problem);
    const kind = dialog.dataset.tutorialView;
    const lines = tutorialCodeLines(problem, guides.problems[problem.id]);
    state.frame = Math.min(findPositionFrame(frames, lines, {line: state.line, step: state.step, kind}, frameStep), limitFor(problem, frames));
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
  categorySelect.addEventListener('change', () => {
    state.category = categorySelect.value;
    renderList();
  });
  practiceTabs.addEventListener('click', event => {
    const button = event.target.closest('[data-practice-category]');
    if (!button) return;
    state.practiceCategory = button.dataset.practiceCategory;
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
  dialog.querySelector('.tutorial-problem-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-problem-direction]');
    if (!button || button.disabled) return;
    const target = session.neighbour(state.problem, Number(button.dataset.problemDirection));
    if (!target) return;
    openTutorial(target.id);
    (button.disabled ? dialog.querySelector('[data-problem-direction="' + (-Number(button.dataset.problemDirection)) + '"]') : button).focus();
  });
  dialog.querySelector('.tutorial-close').addEventListener('click', () => requestClose('close-button'));
  dialog.addEventListener('close', () => {
    typewriter.cancel();
    typingSound.stop();
    tutor.reset();
    session.clear(); viewPages.clear(); disclosureSync.clear(); renderedView = null;
    codePager = null; examPager = null;
    state.problem = null;
    if (launcher?.isConnected) launcher.focus();
  });
  renderList();
})();
