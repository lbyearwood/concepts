const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSiteNavigation } = require('../assets/site-navigation.js');

function harness(compact = true) {
  const owner = { activeElement: null }, all = [];
  function target(tagName = 'DIV', parentElement = null) {
    const events = new Map(), attrs = new Map(), classes = new Set();
    const item = { tagName, parentElement, events, attrs, classes, inert: false, hidden: false,
      classList: { add: key => classes.add(key), remove: key => classes.delete(key),
        toggle(key, enabled) { if (enabled) classes.add(key); else classes.delete(key); } },
      addEventListener(type, fn) { events.set(type, [...(events.get(type) || []), fn]); },
      removeEventListener(type, fn) { events.set(type, events.get(type).filter(listener => listener !== fn)); },
      fire(type, event = {}) { for (const fn of events.get(type) || []) fn(event); },
      setAttribute: (key, value) => attrs.set(key, value), removeAttribute: key => attrs.delete(key),
      focus() { owner.activeElement = this; },
      contains(node) { for (; node; node = node.parentElement) if (node === this) return true; return false; },
      getClientRects() { return this.hidden ? [] : [{}]; },
      closest(selector) {
        for (let node = this; node; node = node.parentElement) {
          if (selector === 'a[href]' && node.tagName === 'A') return node;
          if (selector === '[hidden], [inert]' && (node.hidden || node.inert)) return node;
        }
        return null;
      }
    };
    all.push(item); return item;
  }
  Object.assign(owner, target('DOCUMENT'));
  owner.documentElement = target('HTML');
  const body = target('BODY'), shell = target('ASIDE', body), main = target('MAIN', body), footer = target('FOOTER', body), script = target('SCRIPT', body);
  const panel = target('DIV', shell), header = target('HEADER', shell), toggle = target('BUTTON', header), close = target('BUTTON', panel), backdrop = target('BUTTON', shell);
  const home = target('A', panel), current = target('A', panel), hidden = target('A', panel);
  hidden.hidden = true; footer.inert = true; owner.body = body; body.children = [shell, main, footer, script];
  shell.ownerDocument = owner;
  shell.querySelector = selector => ({ '.sidebar-panel': panel, '.site-mobile-header': header,
    '.sidebar-toggle': toggle, '.sidebar-close': close, '.sidebar-backdrop': backdrop })[selector];
  panel.querySelector = selector => selector === '[aria-current="page"]' ? current : home;
  panel.querySelectorAll = () => [close, home, current, hidden];
  const media = target(); media.matches = compact;
  const navigation = createSiteNavigation(shell, media);
  return { owner, root: owner.documentElement, main, footer, script, panel, header, toggle, close, backdrop, home, current, all, navigation, node: target,
    resize(matches) { media.matches = matches; media.fire('change'); },
    key(key, shiftKey = false) {
      const event = { key, shiftKey, prevented: false, stopped: false,
        preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
      owner.fire('keydown', event); return event;
    }
  };
}

test('the compact menu starts closed, unfocusable and correctly labelled', () => {
  const h = harness();
  assert.equal(h.navigation.isOpen, false); assert.equal(h.panel.inert, true);
  assert.equal(h.toggle.attrs.get('aria-expanded'), 'false');
  assert.equal(h.panel.attrs.get('role'), 'dialog'); assert.equal(h.panel.attrs.has('aria-modal'), false);
  assert.equal(h.backdrop.hidden, true); assert.equal(h.main.inert, false);
});

test('opening locks only background content, moves focus and preserves pre-existing inert state', () => {
  const h = harness(); h.toggle.fire('click'); h.navigation.open();
  assert.equal(h.navigation.isOpen, true); assert.equal(h.panel.inert, false);
  assert.equal(h.panel.attrs.get('aria-modal'), 'true'); assert.equal(h.toggle.attrs.get('aria-expanded'), 'true');
  assert.equal(h.owner.activeElement, h.close); assert.equal(h.backdrop.hidden, false);
  assert.equal(h.header.inert, true); assert.equal(h.main.inert, true); assert.equal(h.script.inert, false);
  h.navigation.close();
  assert.equal(h.main.inert, false); assert.equal(h.header.inert, false); assert.equal(h.footer.inert, true);
});

test('Close, outside tap and Escape dismiss, unlock and return keyboard focus', () => {
  for (const way of ['close', 'backdrop', 'Escape']) {
    const h = harness(); h.navigation.open();
    if (way === 'Escape') { const event = h.key('Escape'); assert.equal(event.prevented, true); }
    else h[way].fire('click');
    assert.equal(h.navigation.isOpen, false); assert.equal(h.main.inert, false);
    assert.equal(h.owner.activeElement, h.toggle); assert.equal(h.panel.inert, true);
    assert.equal(h.root.classes.has('site-nav-open'), false);
  }
});

test('Tab wraps around visible menu controls, including recovery from unexpected outside focus', () => {
  const h = harness(); h.navigation.open();
  assert.equal(h.key('Tab', true).prevented, true); assert.equal(h.owner.activeElement, h.current);
  assert.equal(h.key('Tab').prevented, true); assert.equal(h.owner.activeElement, h.close);
  h.home.focus(); assert.equal(h.key('Tab').prevented, false);
  h.main.focus(); assert.equal(h.key('Tab').prevented, true); assert.equal(h.owner.activeElement, h.close);
});

test('menu keys do not advance the teaching model and native keyboard actions keep their defaults', () => {
  const h = harness(); h.navigation.open();
  for (const key of ['ArrowRight', 'ArrowLeft', 'Enter', ' ', 'r']) {
    const event = h.key(key); assert.equal(event.stopped, true); assert.equal(event.prevented, false);
  }
  h.navigation.close(); assert.equal(h.key('ArrowRight').stopped, false);
});

test('focus skips links inside closed groups even when the browser reports their geometry', () => {
  const h = harness(), group = h.node('DETAILS', h.panel);
  group.open = false;
  const summary = h.node('SUMMARY', group), hiddenLink = h.node('A', group);
  group.querySelector = () => summary;
  h.panel.querySelectorAll = () => [h.close, h.home, h.current, summary, hiddenLink];
  h.navigation.open();
  assert.equal(hiddenLink.getClientRects().length, 1);
  h.key('Tab', true);
  assert.equal(h.owner.activeElement, summary);
  h.key('Tab');
  assert.equal(h.owner.activeElement, h.close);
});

test('desktop navigation stays visible and accessible without a modal state', () => {
  const h = harness(false); h.navigation.open();
  assert.equal(h.navigation.isOpen, false); assert.equal(h.panel.inert, false);
  assert.equal(h.panel.attrs.has('role'), false); assert.equal(h.main.inert, false);
  assert.equal(h.root.classes.has('site-nav-open'), false);
});

test('rotating/resizing releases the modal and restores a usable focus target on each layout', () => {
  const h = harness(); h.navigation.open(); h.resize(false);
  assert.equal(h.navigation.isOpen, false); assert.equal(h.panel.inert, false); assert.equal(h.main.inert, false);
  assert.equal(h.owner.activeElement, h.current); assert.equal(h.panel.attrs.has('aria-modal'), false);
  h.resize(true);
  assert.equal(h.panel.inert, true); assert.equal(h.owner.activeElement, h.toggle);
  assert.equal(h.navigation.isOpen, false);
});

test('following a link releases the drawer while expanding a group keeps it open', () => {
  const h = harness(); h.navigation.open();
  h.panel.fire('click', { target: h.close }); assert.equal(h.navigation.isOpen, true);
  h.panel.fire('click', { target: h.current });
  assert.equal(h.navigation.isOpen, false); assert.equal(h.main.inert, false);
  assert.equal(h.owner.activeElement, h.toggle);
});

test('resize recovers focus when the browser has already blurred a newly hidden control', () => {
  const h = harness(); h.navigation.open(); h.owner.body.focus(); h.resize(false);
  assert.equal(h.owner.activeElement, h.current);
  h.owner.body.focus(); h.resize(true);
  assert.equal(h.owner.activeElement, h.toggle);
  assert.equal(h.main.inert, false); assert.equal(h.panel.inert, true);
});

test('disposal removes listeners and restores background access', () => {
  const h = harness(); h.navigation.open(); h.navigation.destroy();
  assert.equal(h.main.inert, false); assert.equal(h.panel.inert, false); assert.equal(h.footer.inert, true);
  assert.equal(h.root.classes.has('navigation-ready'), false);
  assert.equal(h.all.flatMap(item => [...item.events.values()].flat()).length, 0);
});
