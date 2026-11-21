(() => {
  'use strict';
  const trigger = document.querySelector('.lesson-launch');
  const dialog = document.querySelector('.lesson-modal');
  const source = trigger?.dataset.lessonSrc;
  if (!trigger || !dialog || !source || !/^https:\/\/docs\.google\.com\/presentation\/d\/[\w-]{20,}\/preview$/.test(source)) return;

  const frame = dialog.querySelector('iframe');
  const player = dialog.querySelector('.lesson-player');
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
    fitPlayer();
  });
  dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => frame.removeAttribute('src'));
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
})();
