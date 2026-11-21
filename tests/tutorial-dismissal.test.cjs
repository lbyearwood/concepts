const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDismissalGuard } = require('../assets/programming-problems.js');

function harness(protectedTutorial) {
  let closed = 0;
  const listeners = new Map();
  const dialog = { addEventListener: (event, listener) => listeners.set(event, listener),
    close() { closed++; }, getBoundingClientRect: () => ({ left: 100, right: 900, top: 0, bottom: 600 }) };
  const close = createDismissalGuard(dialog, () => protectedTutorial);
  return { dialog, listeners, close, get closed() { return closed; } };
}

test('the pilot ignores backdrop/menu-area clicks, Escape and Done, and accepts explicit Close', () => {
  const h = harness(true);
  h.listeners.get('click')({ target: h.dialog, clientX: 40, clientY: 200 });
  h.listeners.get('click')({ target: h.dialog, clientX: 950, clientY: 200 });
  let prevented = false;
  h.listeners.get('cancel')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(h.close('done'), false); assert.equal(h.closed, 0);
  assert.equal(h.close('close-button'), true); assert.equal(h.closed, 1);
});

test('inside/focus-like clicks do not dismiss and the other tutorials keep their existing dismissal paths', () => {
  const h = harness(false);
  h.listeners.get('click')({ target: h.dialog, clientX: 200, clientY: 200 });
  assert.equal(h.closed, 0);
  let prevented = false; h.listeners.get('cancel')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  h.listeners.get('click')({ target: h.dialog, clientX: 40, clientY: 200 });
  assert.equal(h.closed, 1); assert.equal(h.close('done'), true); assert.equal(h.closed, 2);
});
