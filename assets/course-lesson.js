(() => {
  'use strict';
  const trigger = document.querySelector('.lesson-launch');
  const dialog = document.querySelector('.lesson-modal');
  const source = trigger?.dataset.lessonSrc;
  if (!trigger || !dialog || !source) return;

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
    if (!frame.getAttribute('src')) frame.src = source;
    dialog.showModal();
    fitPlayer();
  });
  dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
})();
