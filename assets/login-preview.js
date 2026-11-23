(() => {
  'use strict';
  function initLoginPreview(form) {
    if (!form) return false;
    const fields = form.querySelector('fieldset');
    const password = form.querySelector('#login-password');
    const toggle = form.querySelector('.password-toggle');
    const message = form.querySelector('#login-error');
    if (!fields || !password || !toggle || !message) return false;

    function hidePassword() {
      password.type = 'password';
      toggle.setAttribute('aria-pressed', 'false');
      toggle.setAttribute('aria-label', 'Show password');
    }
    // Every attempt is rejected locally. No credential value is read or sent.
    form.addEventListener('submit', event => {
      event.preventDefault();
      password.value = '';
      hidePassword();
      message.hidden = false;
      message.focus();
    });
    toggle.addEventListener('click', () => {
      const visible = password.type === 'password';
      password.type = visible ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(visible));
      toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    });
    // Without the complete controller, the form stays inert in the HTML.
    fields.disabled = false;
    return true;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initLoginPreview };
    return;
  }
  initLoginPreview(document.getElementById('login-form'));
})();
