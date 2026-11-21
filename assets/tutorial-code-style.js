/* Small Python token renderer; token text is always inserted as text, never HTML. */
(() => {
  'use strict';
  const keywords = new Set(['if', 'else', 'for', 'in', 'break', 'while', 'return', 'def', 'and', 'or', 'not']);
  const builtins = new Set(['input', 'print', 'range', 'len', 'int', 'str', 'bool']);
  function tokenizePython(source) {
    const tokens = []; let index = 0;
    while (index < source.length) {
      const rest = source.slice(index), first = source[index];
      let text, type = '';
      if (/\s/.test(first)) text = rest.match(/^\s+/)[0];
      else if (first === '#' ) { text = rest.match(/^[^\n]*/)[0]; type = 'comment'; }
      else if (first === '"' || first === "'") {
        let end = index + 1;
        while (end < source.length) {
          if (source[end] === '\\') { end += 2; continue; }
          if (source[end++] === first) break;
        }
        text = source.slice(index, Math.min(end, source.length)); type = 'string';
      } else if (/\d/.test(first)) { text = rest.match(/^\d+(?:\.\d*)?/)[0]; type = 'number'; }
      else if (/[A-Za-z_]/.test(first)) {
        text = rest.match(/^[A-Za-z_]\w*/)[0];
        type = ['True', 'False', 'None'].includes(text) ? 'constant' : keywords.has(text) ? 'keyword' : builtins.has(text) ? 'builtin' : 'identifier';
      } else { text = first; type = '=<>!+-*/%'.includes(first) ? 'operator' : 'punctuation'; }
      tokens.push({ text, type }); index += text.length;
    }
    return tokens;
  }
  function visibleTokens(source, count = source.length) {
    let remaining = Math.max(0, count);
    return tokenizePython(source).flatMap(token => {
      const text = token.text.slice(0, remaining); remaining = Math.max(0, remaining - token.text.length);
      return text ? [{ text, type: token.type }] : [];
    });
  }
  function renderPython(target, source, count = source.length) {
    const fragment = document.createDocumentFragment();
    visibleTokens(source, count).forEach(token => {
      const span = document.createElement('span');
      if (token.type) span.className = 'syntax-' + token.type;
      span.textContent = token.text; fragment.append(span);
    });
    target.replaceChildren(fragment);
  }
  const reference = /\b(?:range\(len\(text\)\)|len\(text\)|text\[i\]|found\s*=\s*(?:True|False)|if found|input\(\)|input|print|range|len|found|text|i|True|False|break|else|Cab|Boolean|if(?= statement| and else| branch)|for(?= loop))(?!\w)|\b\d+\b|['"]a['"]/g;
  function tutorSegments(text) {
    const segments = []; let end = 0;
    for (const match of text.matchAll(reference)) {
      // The verb in "has been found" is prose, not the Boolean identifier.
      if (match[0] === 'found' && /\b(?:has(?: not)?|been|was|be|have|is)\s+$/.test(text.slice(0, match.index))) continue;
      if (match.index > end) segments.push({ text: text.slice(end, match.index), type: 'prose' });
      segments.push({ text: match[0], type: match[0] === 'Boolean' ? 'emphasis' : 'code' });
      end = match.index + match[0].length;
    }
    if (end < text.length) segments.push({ text: text.slice(end), type: 'prose' });
    return segments;
  }
  function renderTutorText(target, text) {
    const fragment = document.createDocumentFragment();
    const label = text.match(/^(Remember:|✅ Correct\.|❌ Incorrect\.)\s*/);
    if (label) {
      const strong = document.createElement('strong');
      strong.className = label[1] === 'Remember:' ? 'tutor-remember-title' : 'tutor-feedback-title';
      strong.textContent = label[0]; fragment.append(strong); text = text.slice(label[0].length);
    }
    tutorSegments(text).forEach(segment => {
      if (segment.type === 'prose') fragment.append(document.createTextNode(segment.text));
      else {
        const item = document.createElement(segment.type === 'code' ? 'code' : 'strong');
        if (segment.type === 'code') {
          item.className = 'tutor-inline-code'; renderPython(item, segment.text);
          if (segment.text === 'Cab') item.firstChild.className = 'syntax-string';
        } else item.textContent = segment.text;
        fragment.append(item);
      }
    });
    target.replaceChildren(fragment);
  }
  const api = { tokenizePython, visibleTokens, tutorSegments, renderPython, renderTutorText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialCodeStyle = api;
})();
