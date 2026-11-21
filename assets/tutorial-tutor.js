(() => {
  'use strict';
  function checkAnswer(question, index) {
    const choice = question.choices[index];
    return { correct: choice.correct, text: choice.feedback };
  }
  function createTutor(panel, guides, { onAnswer = () => {} } = {}) {
    const answers = new Map();
    const checkpoints = new Map(Object.entries(guides.problems).map(([id, guide]) => [id,
      new Map(guide.lines.flatMap(line => [line.question, line.prediction].filter(Boolean).map(question => [question.id, question])))
    ]));
    let pager = null;
    const node = (tag, className, text) => {
      const item = document.createElement(tag);
      if (className) item.className = className;
      if (text !== undefined) item.textContent = text;
      return item;
    };
    const { renderTutorText, renderPython } = window.CSRTutorialCodeStyle;
    function isCorrect(problemId, checkpointId) {
      const question = checkpoints.get(problemId)?.get(checkpointId);
      const selected = answers.get(problemId + ':' + checkpointId);
      return !!question && selected !== undefined && question.choices[selected]?.correct === true;
    }
    function show(problemId, lineIndex, kind = 'explanation') {
      pager = null;
      const guide = guides.problems[problemId], line = guide?.lines[lineIndex];
      panel.hidden = !line;
      if (!line) return;
      panel.replaceChildren();
      const question = kind === 'question' || kind === 'prediction' ? line[kind] : null;
      panel.classList.toggle('is-question', !!question);
      const heading = node('header', 'tutor-heading');
      const copy = node('div', 'tutor-heading-copy');
      copy.append(node('p', 'tutor-line-label', 'Line ' + (lineIndex + 1) + ' of ' + guide.lines.length));
      const title = node('h3'); renderTutorText(title, kind === 'prediction' ? 'Predict the next step' : question ? 'Question' : line.title); copy.append(title);
      heading.append(copy); panel.append(heading);
      if (question) {
        const key = problemId + ':' + question.id;
        const contextCode = node('code', 'tutor-question-code'); renderPython(contextCode, line.code.trim()); panel.append(contextCode);
        const prompt = node('p', 'tutor-check-prompt', question.prompt);
        renderTutorText(prompt, question.prompt);
        const finalQuestion = kind === 'question' && lineIndex === guide.lines.length - 1;
        const instruction = node('span', 'tutor-check-instruction', finalQuestion ? 'Choose the correct answer to complete the tutorial.' : 'Choose the correct answer to continue.');
        instruction.id = 'tutor-check-instruction'; prompt.append(instruction);
        prompt.id = 'tutor-prompt'; panel.append(prompt);
        const viewport = node('div', 'tutor-content');
        viewport.setAttribute('role', 'radiogroup'); viewport.setAttribute('aria-labelledby', prompt.id);
        const announcement = node('p', 'sr-only');
        announcement.setAttribute('role', 'status');
        function answer(index) {
          const result = checkAnswer(question, index); answers.set(key, index);
          viewport.querySelectorAll('[data-feedback]').forEach(item => item.remove());
          const body = result.text.replace(/^Correct\.\s*/, '');
          const label = result.correct ? '✅ Correct. ' : '❌ Incorrect. ';
          const part = node('p', 'tutor-feedback ' + (result.correct ? 'is-correct' : 'is-incorrect'));
          renderTutorText(part, label + body);
          part.dataset.feedback = 'true'; part.dataset.fitText = 'true';
          part.setAttribute('aria-hidden', 'true'); viewport.append(part);
          announcement.textContent = (result.correct ? 'Correct. ' : 'Incorrect. ') + body;
          instruction.textContent = result.correct ? finalQuestion ? 'You have completed the tutorial.' : 'Next is unlocked. Continue when you are ready.' : 'Try again. Choose the correct answer to continue.';
          announcement.textContent += ' ' + instruction.textContent;
          pager?.layout(); pager?.layout(false, viewport.querySelector('[data-feedback]'));
        }
        question.choices.forEach((choice, index) => {
          const label = node('label', 'tutor-choice'), input = node('input');
          input.type = 'radio'; input.name = 'tutor-answer-' + question.id; input.value = String(index);
          input.checked = answers.get(key) === index;
          input.addEventListener('change', () => { answer(index); onAnswer(choice.correct); });
          const text = node('span'); renderTutorText(text, choice.text); label.append(input, text); viewport.append(label);
        });
        panel.append(viewport, announcement);
        pager = window.CSRTutorialFit.createPager(panel, viewport, () => [...viewport.children], 'answer', renderTutorText);
        if (answers.has(key)) answer(answers.get(key));
      } else {
        const viewport = node('div', 'tutor-content tutor-explanation');
        [...line.paragraphs, 'Remember: ' + line.watchOut].forEach((text, index) => {
          const part = node('p', index === line.paragraphs.length ? 'tutor-reminder' : '');
          renderTutorText(part, text);
          part.dataset.fitText = 'true'; viewport.append(part);
        });
        panel.append(viewport);
        pager = window.CSRTutorialFit.createPager(panel, viewport, () => [...viewport.children], 'explanation', renderTutorText);
      }
    }
    function hide() { panel.hidden = true; pager = null; }
    function reset() { answers.clear(); hide(); }
    return { show, hide, reset, isCorrect, layout: () => pager?.layout() };
  }
  const api = { checkAnswer, createTutor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialTutor = api;
})();
