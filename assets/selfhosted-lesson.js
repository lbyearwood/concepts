(() => {
  'use strict';
  const trigger = document.querySelector('.lesson-launch');
  const dialog = document.querySelector('.lesson-modal');
  const viewer = dialog && dialog.querySelector('.selfhosted-viewer');
  if (!trigger || !dialog || !viewer) return;

  const stage = viewer.querySelector('.selfhosted-slide-stage');
  const image = viewer.querySelector('.selfhosted-slide-image');
  const status = viewer.querySelector('.selfhosted-slide-status');
  const counter = viewer.querySelector('.selfhosted-slide-counter');
  const previous = viewer.querySelector('.selfhosted-slide-previous');
  const next = viewer.querySelector('.selfhosted-slide-next');
  const fullscreen = viewer.querySelector('.selfhosted-slide-fullscreen');
  const close = dialog.querySelector('.modal-close');

  let slides = [];
  let slideIndex = 0;
  let manifestBase = null;
  let version = '';
  let loaded = false;

  function message(text) {
    status.textContent = text;
    status.hidden = false;
    image.hidden = true;
  }
  function slideUrl(index) {
    const url = new URL(slides[index], manifestBase);
    url.searchParams.set('v', version);
    return url.href;
  }
  function show(index) {
    if (!loaded || index < 0 || index >= slides.length) return;
    slideIndex = index;
    image.src = slideUrl(index);
    image.alt = 'Slide ' + (index + 1) + ' of ' + slides.length;
    image.hidden = false;
    status.hidden = true;
    counter.textContent = (index + 1) + ' / ' + slides.length;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    if (index + 1 < slides.length) {
      const preload = new Image();
      preload.src = slideUrl(index + 1);
    }
  }
  async function load() {
    loaded = false;
    slides = [];
    counter.textContent = 'Loading…';
    previous.disabled = true;
    next.disabled = true;
    message('Loading the slides from CSRevision…');
    try {
      const manifestUrl = new URL(viewer.dataset.manifest, document.baseURI);
      const response = await fetch(manifestUrl.href, { cache: 'no-store' });
      if (!response.ok) throw new Error('Slides have not yet been synchronised.');
      const data = await response.json();
      if (!Array.isArray(data.slides) || !data.slides.length ||
        data.slides.length > 180 ||
        !data.slides.every(name => typeof name === 'string' && /^slide-\d{3}\.webp$/.test(name))) {
        throw new Error('The slide list is not valid.');
      }
      // Paths come from our own manifest only; no Google content loads here.
      manifestBase = new URL('./', manifestUrl);
      version = String(data.updatedAt || '1');
      slides = data.slides;
      loaded = true;
      show(0);
    } catch (error) {
      counter.textContent = 'Unavailable';
      message('The self-hosted slides are not available yet. The automatic update must complete successfully before students can view them here.');
      console.warn('CSRevision slides:', error.message);
    }
  }

  trigger.disabled = false;
  trigger.addEventListener('click', () => {
    dialog.showModal();
    load();
  });
  previous.addEventListener('click', () => show(slideIndex - 1));
  next.addEventListener('click', () => show(slideIndex + 1));
  close.addEventListener('click', () => dialog.close());

  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (stage.requestFullscreen) {
        await stage.requestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen unavailable:', error);
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  });
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !dialog.open) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(slideIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(slideIndex + 1);
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  image.addEventListener('error', () => {
    if (dialog.open) message('This slide could not load. Try closing and reopening the presentation.');
  });
})();
