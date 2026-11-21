(() => {
  'use strict';
  const trigger = document.querySelector('.lesson-launch');
  const dialog = document.querySelector('.lesson-modal');
  const source = trigger?.dataset.lessonSrc;
  if (!trigger || !dialog || !source || !/^https:\/\/docs\.google\.com\/presentation\/d\/[\w-]{20,}\/preview$/.test(source)) return;

  const frame = dialog.querySelector('iframe');
  const player = dialog.querySelector('.lesson-player');
  const fullscreenRoot = dialog.querySelector('.lesson-fullscreen-container');
  const fullscreenButton = dialog.querySelector('.lesson-fullscreen');
  const fullscreenLabel = fullscreenButton.querySelector('span');
  const fullscreenStatus = dialog.querySelector('.lesson-fullscreen-status');

  function isNativeFullscreen() {
    return !!document.fullscreenElement && fullscreenRoot.contains(document.fullscreenElement);
  }
  function updateFullscreenButton() {
    const native = isNativeFullscreen();
    const expanded = dialog.classList.contains('is-expanded');
    fullscreenLabel.textContent = native ? 'Exit full screen' : expanded ? 'Exit expanded view' : 'Full screen';
    fullscreenButton.setAttribute('aria-pressed', String(native || expanded));
    fitPlayer();
  }
  function clearExpandedView() {
    dialog.classList.remove('is-expanded');
    fullscreenStatus.hidden = true;
    fullscreenStatus.textContent = '';
  }
  async function leaveFullscreen() {
    clearExpandedView();
    if (isNativeFullscreen()) {
      try { await document.exitFullscreen(); } catch { /* Closing the dialog also ends its fullscreen view. */ }
    }
    updateFullscreenButton();
  }
  async function closeLesson() {
    await leaveFullscreen();
    dialog.close();
  }
  fullscreenButton.addEventListener('click', async () => {
    if (isNativeFullscreen() || dialog.classList.contains('is-expanded')) {
      await leaveFullscreen();
      return;
    }
    try {
      // Request fullscreen from a div: the Fullscreen API excludes <dialog>.
      // Keep this call directly in the click handler to retain user activation.
      if (!document.fullscreenEnabled || !fullscreenRoot.requestFullscreen) throw new Error('Fullscreen unavailable');
      await fullscreenRoot.requestFullscreen();
      clearExpandedView();
    } catch {
      dialog.classList.add('is-expanded');
      fullscreenStatus.textContent = 'Full screen is unavailable in this browser. The lesson now fills this window.';
      fullscreenStatus.hidden = false;
    }
    updateFullscreenButton();
  });
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  function fitPlayer() {
    if (!player.clientWidth || player.clientHeight <= 29) return;
    // This deck uses 4:3 slides; reserve the published player's control strip.
    const width = Math.min(player.clientWidth, (player.clientHeight - 29) * 4 / 3);
    frame.style.width = `${width}px`;
    frame.style.height = `${width * 3 / 4 + 29}px`;
  }
  new ResizeObserver(fitPlayer).observe(player);
  trigger.disabled = false;
  trigger.addEventListener('click', () => {
    // Reopen the live school file each time so a closed lesson cannot retain
    // an older loaded copy or keep playing media in the background.
    frame.src = source;
    dialog.showModal();
    clearExpandedView();
    updateFullscreenButton();
    fitPlayer();
  });
  dialog.querySelector('.modal-close').addEventListener('click', closeLesson);
  dialog.addEventListener('close', () => { frame.removeAttribute('src'); leaveFullscreen(); });
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) closeLesson();
  });
})();
