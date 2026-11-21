/* Small, measured pages keep content accessible without internal scroll areas. */
(() => {
  'use strict';
  function packPages(heights, limit) {
    const pages = []; let page = [], used = 0;
    heights.forEach((height, index) => {
      if (page.length && used + height > limit) { pages.push(page); page = []; used = 0; }
      page.push(index); used += height;
    });
    if (page.length) pages.push(page);
    return pages.length ? pages : [[]];
  }
  function textParts(text, words = 12) {
    const all = text.split(/\s+/), parts = [];
    for (let i = 0; i < all.length; i += words) parts.push(all.slice(i, i + words).join(' '));
    return parts;
  }
  function createPager(host, viewport, getItems, name, decorate = (node, text) => { node.textContent = text; }) {
    const nav = document.createElement('div'); nav.className = 'fit-pager';
    const previous = document.createElement('button'), next = document.createElement('button'), label = document.createElement('span');
    previous.type = next.type = 'button'; previous.textContent = '‹'; next.textContent = '›';
    previous.setAttribute('aria-label', 'Previous ' + name + ' page'); next.setAttribute('aria-label', 'Next ' + name + ' page');
    nav.append(previous, label, next); host.append(nav);
    let pages = [[]], items = [], index = 0;
    function display() {
      items.forEach((item, i) => { item.hidden = !pages[index].includes(i); });
      previous.disabled = index === 0; next.disabled = index === pages.length - 1;
      label.textContent = (index + 1) + ' / ' + pages.length;
      nav.hidden = pages.length < 2;
    }
    function layout(followLast = false, reveal) {
      items = getItems(); items.forEach(item => { item.hidden = false; }); nav.hidden = true;
      if (viewport.clientHeight < 2) return;
      const available = () => {
        const style = getComputedStyle(viewport);
        return Math.max(1, viewport.clientHeight - parseFloat(style.paddingTop || 0) - parseFloat(style.paddingBottom || 0));
      };
      function heights() {
        for (let pass = 0; pass < 7; pass++) {
          const oversized = items.filter(item => {
            const style = getComputedStyle(item);
            const height = item.getBoundingClientRect().height + parseFloat(style.marginTop || 0) + parseFloat(style.marginBottom || 0);
            return item.dataset.fitText && height > available() && item.textContent.split(/\s+/).length > 1;
          });
          if (!oversized.length) break;
          oversized.forEach(item => {
            const count = Math.min(12, Math.ceil(item.textContent.split(/\s+/).length / 2));
            const parts = textParts(item.textContent, count).map(text => { const copy = item.cloneNode(false); decorate(copy, text); return copy; });
            item.replaceWith(...parts);
          });
          items = getItems();
        }
        items = getItems(); items.forEach(item => { item.hidden = false; });
        return items.map(item => { const style = getComputedStyle(item); return item.getBoundingClientRect().height + parseFloat(style.marginTop || 0) + parseFloat(style.marginBottom || 0); });
      }
      pages = packPages(heights(), available());
      if (pages.length > 1) { nav.hidden = false; pages = packPages(heights(), available()); }
      index = followLast ? pages.length - 1 : Math.min(index, pages.length - 1);
      if (reveal) { const target = pages.findIndex(page => page.includes(items.indexOf(reveal))); if (target >= 0) index = target; }
      display();
    }
    previous.addEventListener('click', () => { if (index > 0) { index--; display(); } });
    next.addEventListener('click', () => { if (index < pages.length - 1) { index++; display(); } });
    return { layout };
  }
  const api = { packPages, textParts, createPager };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialFit = api;
})();
