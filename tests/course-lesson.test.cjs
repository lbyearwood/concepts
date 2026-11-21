// Exercise real lesson code against fullscreen browser boundaries, no Google writes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../assets/course-lesson.js'), 'utf8');

function target() {
  const events = new Map();
  return { addEventListener: (name, action) => events.set(name, action),
    fire: async (name, value = {}) => events.get(name)?.(value) };
}
function harness(options = {}) {
  const trigger = Object.assign(target(), { dataset: { lessonSrc: 'https://docs.google.com/presentation/d/synthetic_school_deck_12345/preview' } });
  const frame = { style: {}, removeAttribute: name => { if (name === 'src') delete frame.src; } };
  const player = { clientWidth: 1000, clientHeight: 600 };
  const label = { textContent: 'Full screen' };
  const button = Object.assign(target(), { attrs: {}, querySelector: () => label,
    setAttribute: (key, value) => { button.attrs[key] = value; } });
  const status = { hidden: true, textContent: '' };
  const close = target();
  const classes = new Set();
  const dialog = Object.assign(target(), {
    classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) },
    showModal: () => { dialog.open = true; },
    close: () => { dialog.open = false; dialog.fire('close'); },
    getBoundingClientRect: () => ({ left: 10, top: 10, right: 990, bottom: 690 })
  });
  const document = Object.assign(target(), { fullscreenElement: null, fullscreenEnabled: !options.unavailable,
    querySelector: q => q === '.lesson-launch' ? trigger : dialog,
    exitFullscreen: async () => { document.fullscreenElement = null; await document.fire('fullscreenchange'); } });
  const root = { contains: element => element === root || element === frame,
    requestFullscreen: async () => {
      if (options.denied) throw new Error('Browser declined request');
      document.fullscreenElement = root; await document.fire('fullscreenchange');
    } };
  dialog.querySelector = q => ({ iframe: frame, '.lesson-player': player,
    '.lesson-fullscreen-container': root, '.lesson-fullscreen': button,
    '.lesson-fullscreen-status': status, '.modal-close': close })[q];
  vm.runInNewContext(code, { document, ResizeObserver: class { observe() {} } });
  return { trigger, frame, dialog, button, label, status, document, root, close };
}

test('fullscreen enter and exit preserve the loaded lesson and reflect browser state', async () => {
  const h = harness(); await h.trigger.fire('click'); const source = h.frame.src;
  await h.button.fire('click');
  assert.equal(h.document.fullscreenElement, h.root); assert.equal(h.label.textContent, 'Exit full screen');
  assert.equal(h.button.attrs['aria-pressed'], 'true');
  await h.button.fire('click');
  assert.equal(h.document.fullscreenElement, null); assert.equal(h.label.textContent, 'Full screen');
  assert.equal(h.button.attrs['aria-pressed'], 'false'); assert.equal(h.frame.src, source); assert.ok(h.dialog.open);
});
test('browser Escape/fullscreenchange resets the button while keeping the lesson open', async () => {
  const h = harness(); await h.trigger.fire('click'); await h.button.fire('click');
  h.document.fullscreenElement = null; await h.document.fire('fullscreenchange');
  assert.equal(h.label.textContent, 'Full screen'); assert.ok(h.dialog.open); assert.ok(h.frame.src);
});
test('denied fullscreen expands the window with an honest status and reversible control', async () => {
  const h = harness({ denied: true }); await h.trigger.fire('click'); await h.button.fire('click');
  assert.equal(h.document.fullscreenElement, null); assert.ok(h.dialog.classList.contains('is-expanded'));
  assert.equal(h.label.textContent, 'Exit expanded view'); assert.equal(h.status.hidden, false);
  await h.button.fire('click');
  assert.equal(h.label.textContent, 'Full screen'); assert.equal(h.status.hidden, true);
  assert.equal(h.dialog.classList.contains('is-expanded'), false);
});
test('unsupported fullscreen remains usable through the expanded view', async () => {
  const h = harness({ unavailable: true }); await h.trigger.fire('click'); await h.button.fire('click');
  assert.equal(h.label.textContent, 'Exit expanded view'); assert.ok(h.frame.src);
});
test('Close exits native fullscreen before unloading the iframe', async () => {
  const h = harness(); await h.trigger.fire('click'); await h.button.fire('click'); await h.close.fire('click');
  assert.equal(h.document.fullscreenElement, null); assert.equal(h.dialog.open, false); assert.equal(h.frame.src, undefined);
});
test('Close clears fallback state and a reopened lesson starts in normal view', async () => {
  const h = harness({ denied: true }); await h.trigger.fire('click'); await h.button.fire('click'); await h.close.fire('click');
  await h.trigger.fire('click');
  assert.equal(h.dialog.classList.contains('is-expanded'), false); assert.equal(h.status.hidden, true);
  assert.equal(h.label.textContent, 'Full screen'); assert.equal(h.button.attrs['aria-pressed'], 'false');
});
