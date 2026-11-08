(() => {
  'use strict';
  const values = [18, 7, 25, 11, 32, 4, 16, 9];
  const $ = id => document.getElementById(id);
  let target = Number($('search-target').value);
  let current = 0;

  function lastComparison() {
    const match = values.indexOf(target);
    return match === -1 ? values.length : match + 1;
  }

  function render() {
    const checked = current;
    const index = checked - 1;
    const found = checked > 0 && values[index] === target;
    const finished = found || checked === values.length;
    const steps = lastComparison() + 1;
    let title, copy, takeaway, outcomeHeading, outcomeText;

    if (checked === 0) {
      title = 'Start at the beginning';
      copy = `We are looking for <strong>${target}</strong>. Linear search starts with the <strong>first item, at index 0</strong>, then checks one item at a time. The list does not need to be sorted.`;
      takeaway = 'Start with the first item. Do not skip any items.';
      outcomeHeading = 'Ready';
      outcomeText = 'Next will compare the first item with the target.';
    } else if (found) {
      title = 'Match found — stop';
      copy = `<strong>${values[index]} matches ${target}</strong>. The target is at <strong>index ${index}</strong> — item ${index + 1} in the list. The search stops here; later items are not checked.`;
      takeaway = 'Stop as soon as the first match is found.';
      outcomeHeading = `Found at index ${index}`;
      outcomeText = `${checked} comparison${checked === 1 ? '' : 's'} made. The remaining items are not needed.`;
    } else if (finished) {
      title = 'End of the list — not found';
      copy = `<strong>${values[index]} does not match ${target}</strong>. All <strong>${values.length} items</strong> have now been checked. There are no items left, so the target is <strong>not in the list</strong>.`;
      takeaway = 'Only report “not found” after every item has been checked.';
      outcomeHeading = 'Not found';
      outcomeText = `${target} is not in the list. All ${checked} comparisons are complete.`;
    } else {
      title = `Check item ${index + 1}`;
      copy = `Compare <strong>${values[index]}</strong>, at <strong>index ${index}</strong>, with the target <strong>${target}</strong>. They are different, so the search must move to the next item.`;
      takeaway = 'If there is no match, move one place to the right.';
      outcomeHeading = 'No match — keep going';
      outcomeText = `Next will check index ${index + 1}, which contains ${values[index + 1]}.`;
    }

    $('lesson-heading').textContent = title;
    $('lesson-copy').innerHTML = copy;
    $('takeaway').textContent = takeaway;
    $('comparison-text').textContent = checked === 0 ? 'Ready to search' : `${values[index]} ${found ? '=' : '≠'} ${target}`;
    $('comparison-count').textContent = String(checked);
    $('outcome-heading').textContent = outcomeHeading;
    $('outcome-text').textContent = outcomeText;
    $('search-outcome').className = 'search-outcome' + (found ? ' is-found' : finished ? ' is-missing' : '');
    $('step-counter').textContent = `Step ${current + 1} of ${steps}`;

    const items = values.map((value, i) => {
      const item = document.createElement('li');
      let status = 'Not checked';
      item.className = 'search-item';
      if (i < checked) { item.classList.add('checked'); status = 'No match'; }
      if (i === index) { item.classList.add(found ? 'found' : 'current'); if (found) status = 'Match'; }
      item.innerHTML = `<span class="item-index">Index ${i}</span><strong class="item-value">${value}</strong><span class="item-status">${status}</span>`;
      item.setAttribute('aria-label', `Index ${i}: ${value}. ${status}.`);
      if (i === index) item.setAttribute('aria-current', 'step');
      return item;
    });
    $('search-items').replaceChildren(...items);
    $('progress').replaceChildren(...Array.from({length: steps}, (_, i) => {
      const pip = document.createElement('span');
      pip.className = i < current ? 'past' : i === current ? 'current' : '';
      return pip;
    }));
    $('back-button').disabled = current === 0;
    $('next-button').disabled = finished;
    $('next-button').querySelector('[data-next-label]').textContent = finished ? 'Finished' : 'Next';
    $('announcement').textContent = `Step ${current + 1} of ${steps}. ${title}. ${$('comparison-text').textContent}. ${outcomeText}`;
    window.dispatchEvent(new Event('conceptchange'));
  }

  function next() { if (current < lastComparison()) { current++; render(); } }
  function back() { if (current > 0) { current--; render(); } }
  function reset() { current = 0; render(); }
  $('next-button').addEventListener('click', next);
  $('back-button').addEventListener('click', back);
  $('reset-button').addEventListener('click', reset);
  $('search-target').addEventListener('change', () => { target = Number($('search-target').value); reset(); });
  window.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || event.target.closest('input,select,textarea')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); back(); }
    if (event.key.toLowerCase() === 'r') { event.preventDefault(); reset(); }
  });
  render();
})();
