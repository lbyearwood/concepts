(() => {
  'use strict';
  const viewport = document.querySelector('.concept-viewport');
  const canvas = viewport?.querySelector('.app');
  if (!canvas) return;

  let frame = 0;
  function fit() {
    frame = 0;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    // Keep the whole teaching model together, then fit it to the available area.
    const layoutWidth = Math.max(640, width);
    canvas.style.width = `${layoutWidth}px`;
    const naturalWidth = Math.max(layoutWidth, canvas.scrollWidth);
    const scale = Math.min(1, width / naturalWidth, (height - 2) / canvas.offsetHeight);
    canvas.style.transform = `scale(${scale})`;
    canvas.style.left = `${Math.max(0, (width - naturalWidth * scale) / 2)}px`;
  }
  function scheduleFit() {
    if (!frame) frame = requestAnimationFrame(fit);
  }
  const observer = new ResizeObserver(scheduleFit);
  observer.observe(viewport);
  observer.observe(canvas);
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);
  window.addEventListener('conceptchange', fit);
  document.fonts.ready.then(scheduleFit);
  fit();

  const dialog = document.querySelector('.keywords-modal');
  const trigger = document.querySelector('.keywords-button');
  trigger?.addEventListener('click', () => dialog.showModal());
  dialog?.querySelector('.modal-close').addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
})();
