/* Semantic database examples and a brief celebration that keeps the last lesson visible. */
(() => {
  'use strict';
  function renderDatabaseTable(database) {
    const table = document.createElement('table');
    table.className = 'exam-db-table';
    const caption = document.createElement('caption'); caption.textContent = database.table;
    const head = document.createElement('thead'), headings = document.createElement('tr');
    database.columns.forEach(column => {
      const cell = document.createElement('th'); cell.setAttribute('scope', 'col'); cell.textContent = column.name; headings.append(cell);
    });
    head.append(headings);
    const body = document.createElement('tbody');
    database.rows.forEach(values => {
      const row = document.createElement('tr');
      values.forEach(value => { const cell = document.createElement('td'); cell.textContent = String(value); row.append(cell); });
      body.append(row);
    });
    table.append(caption, head, body);
    return table;
  }
  function createCompletion({badge, overlay, next, label, reducedMotion = () => false,
    schedule = setTimeout, unschedule = clearTimeout, random = Math.random}) {
    const celebrated = new Set(); let timer = null;
    function stop() {
      if (timer !== null) unschedule(timer);
      timer = null; overlay.replaceChildren(); overlay.hidden = true;
    }
    function update({problemId, atEnd, allCorrect, visible, count}) {
      const finished = !!(problemId && atEnd && allCorrect && visible);
      badge.hidden = !finished;
      next.classList.toggle('is-complete', finished);
      if (atEnd) label.textContent = finished ? 'Completed' : 'Finish';
      if (!finished) { stop(); return false; }
      badge.textContent = '✓ Tutorial complete';
      badge.setAttribute('aria-label', 'Tutorial complete. All ' + count + ' checkpoints answered correctly.');
      if (celebrated.has(problemId)) return true;
      celebrated.add(problemId);
      stop();
      if (reducedMotion()) return true;
      overlay.hidden = false;
      overlay.style.setProperty('--confetti-distance', Math.max(120, overlay.clientHeight) + 'px');
      const colours = ['#3600ff', '#00cdbb', '#ffeb28', '#d90058', '#a8ef15'];
      for (let index = 0; index < 48; index++) {
        const piece = document.createElement('span');
        piece.style.left = random() * 100 + '%';
        piece.style.animationDelay = random() * 400 + 'ms';
        piece.style.setProperty('--confetti-colour', colours[index % colours.length]);
        piece.style.setProperty('--confetti-drift', (random() - .5) * 180 + 'px');
        overlay.append(piece);
      }
      timer = schedule(() => { timer = null; stop(); }, 2700);
      return true;
    }
    function reset() { stop(); celebrated.clear(); badge.hidden = true; next.classList.toggle('is-complete', false); }
    return {update, stop, reset};
  }
  const api = {renderDatabaseTable, createCompletion};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialPresentation = api;
})();
