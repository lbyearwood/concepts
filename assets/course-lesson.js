(() => {
  'use strict';
  const trigger = document.querySelector('.lesson-launch');
  const dialog = document.querySelector('.lesson-modal');
  const source = trigger?.dataset.lessonSrc;
  if (!trigger || !dialog || !source) return;

  const frame = dialog.querySelector('iframe');
  trigger.hidden = false;
  trigger.addEventListener('click', () => {
    if (!frame.getAttribute('src')) frame.src = source;
    dialog.showModal();
  });
  dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
})();
