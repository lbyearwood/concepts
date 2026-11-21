(() => {
  'use strict';
  const dataNode = document.getElementById('problem-data');
  const dialog = document.getElementById('tutorial-modal');
  if (!dataNode || !dialog) return;
  const data = JSON.parse(dataNode.textContent);
  const categoryNames = new Map(data.categories.map(category => [category.id, category.title]));
  const collectionNames = {exam: 'Exam questions', level1: 'Level 1 problems', level2: 'Level 2', level3: 'Level 3'};
  const state = {collection: 'exam', category: 'traversal', problem: null, step: 0, line: 0};
  const list = document.querySelector('.problem-list');
  const categoryTabs = document.querySelector('.problem-categories');
  const categoryPanel = document.getElementById('category-panel');
  const content = dialog.querySelector('.tutorial-step-content');
  const body = dialog.querySelector('.tutorial-body');
  const help = dialog.querySelector('.tutorial-help');
  const footer = dialog.querySelector('.tutorial-footer');
  const { tutorialCodeLines, createTypewriter } = window.CSRCodeWalkthrough;
  const typewriter = createTypewriter();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isTypedTutorial = problem => problem.id === 'problem-1';
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
    const overflow = node.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom;
    if (overflow > 0) body.scrollTop += overflow + 16;
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
    const pre = element('pre', 'tutorial-code-editor');
    const code = element('code');
    pre.setAttribute('aria-label', 'Python code, line ' + (state.line + 1) + ' of ' + lines.length);
    let activeText;
    lines.slice(0, state.line + 1).forEach((line, index) => {
      const row = element('span', 'tutorial-code-line' + (index === state.line ? ' is-current' : ''));
      const text = element('span', 'tutorial-code-text', index === state.line ? '' : line.text);
      row.append(text);
      code.append(row);
      if (index === state.line) activeText = text;
    });
    pre.append(code);
    content.append(pre);
    const instant = !animate || !help.open || reducedMotion.matches;
    pre.classList.toggle('is-typing', !instant);
    pre.setAttribute('aria-busy', String(!instant));
    typewriter.play(lines[state.line].text, {
      instant,
      write: text => {
        activeText.textContent = text;
        if (help.open) keepCodeVisible(activeText);
      },
      done: () => {
        pre.classList.remove('is-typing');
        pre.setAttribute('aria-busy', 'false');
      }
    });
    return activeText;
  }
  function renderStep(animate = true) {
    typewriter.cancel();
    const problem = data.problems.find(item => item.id === state.problem);
    if (!problem) return;
    const typed = isTypedTutorial(problem);
    const lines = typed ? tutorialCodeLines(problem) : null;
    if (typed) {
      state.line = Math.max(0, Math.min(state.line, lines.length - 1));
      state.step = lines[state.line].step;
    }
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
    step.blocks.forEach(block => {
      if (block.type === 'code') {
        if (typed) {
          if (!activeText) activeText = renderTypedCode(lines, animate);
        } else {
          const pre = element('pre');
          pre.append(element('code', '', block.text));
          content.append(pre);
        }
      } else {
        // A stage's check question follows its complete code, not an unfinished branch.
        if (typed && block.type === 'question' && lines[state.line + 1]?.step === state.step) return;
        const className = block.type === 'question' ? 'understanding-question' : block.type === 'error' ? 'common-error' : '';
        content.append(element('p', className, block.text));
      }
    });
    const last = typed ? state.line === lines.length - 1 : state.step === problem.steps.length - 1;
    const progress = 'Step ' + (state.step + 1) + ' of ' + problem.steps.length;
    dialog.querySelector('.tutorial-counter').textContent = typed ? 'Line ' + (state.line + 1) + ' of ' + lines.length + ' · ' + progress : progress;
    dialog.querySelector('.tutorial-back').disabled = typed ? state.line === 0 : state.step === 0;
    dialog.querySelector('[data-next-label]').textContent = last ? 'Done' : typed ? 'Next line' : 'Next';
    dialog.querySelector('.tutorial-next .problem-icon').hidden = last;
    dialog.querySelector('.tutorial-announcement').textContent = help.open ? problem.title + '. Step ' + (state.step + 1) + '. ' + step.title + (typed ? '. Line ' + (state.line + 1) + ' of ' + lines.length : '') : problem.title + '. Exam question. Tutorial collapsed.';
    if (help.open) {
      body.scrollTop += help.getBoundingClientRect().top - body.getBoundingClientRect().top - parseFloat(getComputedStyle(body).paddingTop);
      if (activeText) keepCodeVisible(activeText);
    } else body.scrollTop = 0;
  }
  function openTutorial(id, button) {
    const problem = data.problems.find(item => item.id === id);
    if (!problem) return;
    launcher = button;
    dialog.dataset.problem = problem.id;
    state.problem = id;
    state.step = 0;
    state.line = 0;
    const question = dialog.querySelector('.tutorial-question');
    question.open = true;
    help.open = false;
    footer.hidden = true;
    const questionContent = dialog.querySelector('.tutorial-question-content');
    questionContent.replaceChildren();
    problem.question.context.forEach(text => questionContent.append(element('p', '', text)));
    questionContent.append(element('p', '', 'Write an algorithm that:'));
    const requirements = element('ol');
    problem.question.requirements.forEach(text => requirements.append(element('li', '', text)));
    questionContent.append(requirements);
    renderStep();
    dialog.showModal();
  }
  help.addEventListener('toggle', () => {
    footer.hidden = !help.open;
    if (state.problem && help.open) renderStep();
    else typewriter.cancel();
  });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) typewriter.finish(); });
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
    state.step = Number(button.dataset.step);
    const problem = data.problems.find(item => item.id === state.problem);
    if (isTypedTutorial(problem)) state.line = tutorialCodeLines(problem).findIndex(line => line.step === state.step);
    renderStep();
    dialog.querySelector('[data-step="' + state.step + '"]').focus();
  });
  dialog.querySelector('.tutorial-back').addEventListener('click', () => {
    const problem = data.problems.find(item => item.id === state.problem);
    if (isTypedTutorial(problem)) state.line--;
    else state.step--;
    renderStep(false);
    if (state.step === 0) dialog.querySelector('[data-step="0"]').focus();
  });
  dialog.querySelector('.tutorial-next').addEventListener('click', () => {
    const problem = data.problems.find(item => item.id === state.problem);
    if (isTypedTutorial(problem)) {
      typewriter.finish();
      if (state.line === tutorialCodeLines(problem).length - 1) dialog.close();
      else { state.line++; renderStep(); }
      return;
    }
    if (state.step === problem.steps.length - 1) dialog.close();
    else { state.step++; renderStep(); }
  });
  dialog.querySelector('.tutorial-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    typewriter.cancel();
    state.problem = null;
    if (launcher?.isConnected) launcher.focus();
  });
  renderList();
})();
