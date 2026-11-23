const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/login-preview.js'), 'utf8');

function harness(missing) {
  const calls = [], module = {exports: {}};
  const forbid = () => { throw Error('Preview must not transmit or persist details'); };
  vm.runInNewContext(source, {module, fetch: forbid, XMLHttpRequest: forbid,
    localStorage: {setItem: forbid}, sessionStorage: {setItem: forbid}});
  let secret = 'Fictional test password';
  const password = {type: 'password'};
  Object.defineProperty(password, 'value', {get: () => { throw Error('Credential read'); }, set: value => {secret = value;}});
  const toggle = {attrs: {}, addEventListener: (name, action) => {calls.push('toggle-listener'); toggle.action = action;},
    setAttribute: (name, value) => {toggle.attrs[name] = value;}};
  const message = {hidden: true, focus: () => calls.push('error-focus')};
  let disabled = true;
  const fields = {};
  Object.defineProperty(fields, 'disabled', {get: () => disabled, set: value => {disabled = value; calls.push('fields-enabled');}});
  const nodes = {'fieldset': fields, '#login-password': password, '.password-toggle': toggle, '#login-error': message};
  if (missing) delete nodes[missing];
  const form = {querySelector: selector => nodes[selector],
    addEventListener: (name, action) => {calls.push('submit-listener'); form.submitHandler = action;}, submit: forbid};
  return {init: module.exports.initLoginPreview, form, password, toggle, message, fields, calls,
    passwordValue: () => secret, setPassword: value => {secret = value;}};
}

test('fields activate only after both local handlers have been attached', () => {
  const h = harness();
  assert.equal(h.fields.disabled, true);
  assert.equal(h.init(h.form), true);
  assert.deepEqual(h.calls, ['submit-listener', 'toggle-listener', 'fields-enabled']);
  assert.equal(h.fields.disabled, false);
});

test('every submit is rejected locally without reading, sending or retaining a password', () => {
  const h = harness(); h.init(h.form);
  for (const value of ['', 'test', 'Another fictional value']) {
    h.setPassword(value);
    let prevented = false;
    h.form.submitHandler({preventDefault: () => {prevented = true;}});
    assert.equal(prevented, true);
    assert.equal(h.message.hidden, false);
    assert.equal(h.passwordValue(), '');
    assert.equal(h.calls.at(-1), 'error-focus');
  }
});

test('show/hide is local and a failed attempt restores the hidden empty password', () => {
  const h = harness(); h.init(h.form);
  h.toggle.action();
  assert.equal(h.password.type, 'text');
  assert.equal(h.toggle.attrs['aria-label'], 'Hide password');
  assert.equal(h.toggle.attrs['aria-pressed'], 'true');
  h.toggle.action();
  assert.equal(h.password.type, 'password');
  h.toggle.action();
  h.form.submitHandler({preventDefault() {}});
  assert.equal(h.password.type, 'password');
  assert.equal(h.passwordValue(), '');
  assert.equal(h.toggle.attrs['aria-label'], 'Show password');
  assert.equal(h.toggle.attrs['aria-pressed'], 'false');
});

test('missing markup leaves the form inert', () => {
  const h = harness('#login-error');
  assert.equal(h.init(null), false);
  assert.equal(h.init(h.form), false);
  assert.equal(h.fields.disabled, true);
  assert.deepEqual(h.calls, []);
});
