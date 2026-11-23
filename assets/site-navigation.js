(() => {
  'use strict';
  const compactQuery = '(max-width: 1024px), (max-width: 1366px) and (hover: none) and (pointer: coarse)';

  function createSiteNavigation(shell, compact) {
    const owner = shell.ownerDocument;
    const root = owner.documentElement;
    const panel = shell.querySelector('.sidebar-panel');
    const header = shell.querySelector('.site-mobile-header');
    const toggle = shell.querySelector('.sidebar-toggle');
    const close = shell.querySelector('.sidebar-close');
    const backdrop = shell.querySelector('.sidebar-backdrop');
    let opened = false;
    const background = new Map();

    function unlockBackground() {
      for (const [element, inert] of background) element.inert = inert;
      background.clear();
    }
    function render() {
      root.classList.toggle('site-nav-open', opened);
      toggle.setAttribute('aria-expanded', String(opened));
      backdrop.hidden = !opened;
      panel.inert = compact.matches && !opened;
      if (compact.matches) panel.setAttribute('role', 'dialog');
      else panel.removeAttribute('role');
      if (opened) panel.setAttribute('aria-modal', 'true');
      else panel.removeAttribute('aria-modal');
    }
    function closeMenu(restoreFocus = true) {
      if (!opened) return;
      opened = false;
      unlockBackground();
      if (restoreFocus && compact.matches) toggle.focus();
      render();
    }
    function openMenu() {
      if (!compact.matches || opened) return;
      opened = true;
      render();
      const siblings = [...owner.body.children, header];
      for (const element of siblings) {
        if (element === shell || ['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName)) continue;
        background.set(element, element.inert);
        element.inert = true;
      }
      close.focus();
    }
    function resize() {
      const active = owner.activeElement;
      const wasOpened = opened;
      closeMenu(false);
      // A CSS-hidden control may already have handed focus back to the body.
      if (compact.matches && (panel.contains(active) || active === owner.body)) toggle.focus();
      else if (!compact.matches && (active === close || (wasOpened && active === owner.body))) {
        (panel.querySelector('[aria-current="page"]') || panel.querySelector('a')).focus();
      }
      render();
    }
    function keydown(event) {
      if (!opened) return;
      // Keep menu keys from reaching the teaching model's window shortcuts.
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      } else if (event.key === 'Tab') {
        const focusable = [...panel.querySelectorAll('a[href], button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
          .filter(element => {
            if (!element.getClientRects().length || element.closest('[hidden], [inert]')) return false;
            // Closed details can still report geometry for their hidden links.
            for (let ancestor = element.parentElement; ancestor && ancestor !== panel; ancestor = ancestor.parentElement) {
              if (ancestor.tagName === 'DETAILS' && !ancestor.open && ancestor.querySelector('summary') !== element) return false;
            }
            return true;
          });
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && (owner.activeElement === first || !panel.contains(owner.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (owner.activeElement === last || !panel.contains(owner.activeElement))) {
          event.preventDefault(); first?.focus();
        }
      }
    }
    const toggleMenu = () => opened ? closeMenu() : openMenu();
    const dismiss = () => closeMenu();
    const followLink = event => { if (event.target.closest('a[href]')) closeMenu(); };
    toggle.addEventListener('click', toggleMenu);
    close.addEventListener('click', dismiss);
    backdrop.addEventListener('click', dismiss);
    panel.addEventListener('click', followLink);
    owner.addEventListener('keydown', keydown);
    compact.addEventListener('change', resize);
    root.classList.add('navigation-ready');
    render();
    return { open: openMenu, close: closeMenu, get isOpen() { return opened; },
      destroy() {
        closeMenu(false);
        toggle.removeEventListener('click', toggleMenu);
        close.removeEventListener('click', dismiss);
        backdrop.removeEventListener('click', dismiss);
        panel.removeEventListener('click', followLink);
        owner.removeEventListener('keydown', keydown);
        compact.removeEventListener('change', resize);
        panel.inert = false;
        panel.removeAttribute('role');
        root.classList.remove('navigation-ready');
      }
    };
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { createSiteNavigation, compactQuery }; return; }
  const shell = document.querySelector('.site-sidebar');
  if (shell) createSiteNavigation(shell, window.matchMedia(compactQuery));
})();
