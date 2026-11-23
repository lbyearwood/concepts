const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTutorialCopyGuard } = require('../assets/programming-problems.js');

function harness() {
  const listeners = new Map();
  const classes = new Set();
  const notice = { textContent: '' };
  const owner = { activeElement: null };
  const dialog = { open: true, ownerDocument: owner,
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    querySelector: () => notice,
    contains(target) { for (let node = target; node; node = node.parentElement) if (node === this) return true; return false; }
  };
  for (const root of [owner, dialog]) {
    root.addEventListener = (type, fn) => { listeners.set(type, [...(listeners.get(type) || []), fn]); };
    root.removeEventListener = (type, fn) => { listeners.set(type, listeners.get(type).filter(item => item !== fn)); };
  }
  function node(tagName = 'SPAN', parentElement = dialog, attributes = {}) {
    return { tagName, parentElement, ...attributes,
      closest() {
        for (let element = this; element; element = element.parentElement) {
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) || element.contentEditable !== undefined) return element;
        }
        return null;
      }
    };
  }
  const stop = createTutorialCopyGuard(dialog);
  function fire(type, target, options = {}) {
    const event = { type, target, key: '', defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; }, ...options };
    for (const fn of listeners.get(type) || []) fn(event);
    return event.defaultPrevented;
  }
  return { owner, dialog, node, fire, stop, notice, classes, listeners };
}

test('questions, explanations and code refuse clipboard, selection, drag and context-menu actions', () => {
  const h = harness();
  for (const tag of ['P', 'CODE', 'SPAN']) {
    const text = h.node(tag);
    for (const type of ['copy', 'cut', 'selectstart', 'dragstart', 'contextmenu']) assert.equal(h.fire(type, text), true);
  }
  assert.match(h.notice.textContent, /Copying tutorial text and code is disabled/);
  h.owner.activeElement = h.node('BUTTON');
  assert.equal(h.fire('copy', h.owner), true, 'browser menu copy uses focus when the event target is the document');
});

test('ordinary Windows and Mac copy/select shortcuts are guarded without changing navigation or developer shortcuts', () => {
  const h = harness(), text = h.node('CODE');
  for (const modifier of ['ctrlKey', 'metaKey']) {
    for (const key of ['c', 'C', 'x', 'a']) assert.equal(h.fire('keydown', text, { key, [modifier]: true }), true);
  }
  assert.equal(h.fire('keydown', text, { key: 'Insert', ctrlKey: true }), true);
  for (const key of ['Tab', 'ArrowRight', 'ArrowLeft', 'Enter', ' ', 'Escape', 'F12']) {
    assert.equal(h.fire('keydown', text, { key }), false);
  }
  assert.equal(h.fire('keydown', text, { key: 'c', ctrlKey: true, shiftKey: true }), false);
  assert.equal(h.fire('keydown', text, { key: 'c', ctrlKey: true, altKey: true }), false);
  assert.equal(h.fire('keydown', text, { key: 'v', ctrlKey: true }), false);
});

test('newly rendered text-entry fields keep selection, clipboard, paste and native menus', () => {
  const h = harness();
  const fields = [h.node('INPUT', h.dialog, { type: 'text' }), h.node('INPUT', h.dialog, { type: 'number' }),
    h.node('TEXTAREA'), h.node('SELECT'), h.node('DIV', h.dialog, { contentEditable: 'true', isContentEditable: true })];
  fields.push(h.node('SPAN', fields.at(-1)));
  for (const field of fields) {
    for (const type of ['copy', 'cut', 'selectstart', 'dragstart', 'contextmenu']) assert.equal(h.fire(type, field), false);
    for (const key of ['c', 'x', 'a', 'v']) assert.equal(h.fire('keydown', field, { key, ctrlKey: true }), false);
    h.owner.activeElement = field;
    assert.equal(h.fire('copy', h.owner), false);
  }
  assert.equal(h.fire('contextmenu', h.node('CODE')), true, 'an input retaining focus does not allow a menu on tutorial code');
});

test('radio labels and noneditable content stay protected while answer-choice keyboard controls work', () => {
  const h = harness(), radio = h.node('INPUT', h.dialog, { type: 'radio' });
  assert.equal(h.fire('copy', radio), true);
  for (const key of ['ArrowDown', 'ArrowUp', ' ']) assert.equal(h.fire('keydown', radio, { key }), false);
  assert.equal(h.fire('copy', h.node('DIV', h.dialog, { contentEditable: 'false', isContentEditable: false })), true);
});

test('the closed tutorial and the surrounding website keep normal copying', () => {
  const h = harness(), outside = h.node('P', null);
  h.owner.activeElement = outside;
  for (const type of ['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart']) assert.equal(h.fire(type, outside), false);
  assert.equal(h.fire('keydown', outside, { key: 'c', ctrlKey: true }), false);
  h.dialog.open = false;
  h.owner.activeElement = h.node('BUTTON');
  for (const type of ['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart']) assert.equal(h.fire(type, h.node('CODE')), false);
  assert.equal(h.fire('keydown', h.node('CODE'), { key: 'a', metaKey: true }), false);
});

test('close clears the notice and disposal removes every guard', () => {
  const h = harness();
  assert.equal(h.classes.has('tutorial-copy-protected'), true);
  h.fire('copy', h.node('P'));
  h.fire('close', h.dialog);
  assert.equal(h.notice.textContent, '');
  h.stop();
  assert.equal(h.classes.size, 0);
  assert.equal([...h.listeners.values()].flat().length, 0);
  assert.equal(h.fire('copy', h.node('CODE')), false);
});
