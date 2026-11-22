/* Python/GCSE SQL tokens are always inserted as text, never HTML. */
(() => {
  'use strict';
  const keywords = new Set(['if', 'elif', 'else', 'for', 'in', 'break', 'while', 'return', 'def', 'and', 'or', 'not', 'pass', 'import', 'from']);
  const sqlKeywords = new Set(['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER', 'BY', 'ASC', 'DESC', 'LIKE']);
  const builtins = new Set(['input', 'print', 'range', 'len', 'int', 'str', 'bool', 'float', 'open']);
  const methods = new Set(['append', 'lower', 'upper', 'isdigit', 'randint', 'strip', 'replace', 'readline', 'rstrip', 'split', 'write', 'close']);
  function tokenizeCode(source, language = 'python') {
    const tokens = []; let index = 0;
    while (index < source.length) {
      const rest = source.slice(index), first = source[index];
      let text, type = '';
      if (/\s/.test(first)) text = rest.match(/^\s+/)[0];
      else if (language === 'sql' ? rest.startsWith('--') : first === '#') { text = rest.match(/^[^\n]*/)[0]; type = 'comment'; }
      else if (first === '"' || first === "'" || /^[fFrRuUbB]{1,2}["']/.test(rest)) {
        const prefix = rest.match(/^[fFrRuUbB]{1,2}(?=["'])/)?.[0] || '';
        const quote = source[index + prefix.length];
        let end = index + prefix.length + 1;
        while (end < source.length) {
          if (source[end] === '\\') { end += 2; continue; }
          if (source[end++] === quote) break;
        }
        text = source.slice(index, Math.min(end, source.length)); type = 'string';
      } else if (/\d/.test(first)) { text = rest.match(/^\d+(?:\.\d*)?/)[0]; type = 'number'; }
      else if (/[A-Za-z_]/.test(first)) {
        text = rest.match(/^[A-Za-z_]\w*/)[0];
        type = language === 'sql' ? sqlKeywords.has(text.toUpperCase()) ? 'keyword' : 'identifier' : ['True', 'False', 'None'].includes(text) ? 'constant' : keywords.has(text) ? 'keyword' : builtins.has(text) || methods.has(text) && source[index - 1] === '.' ? 'builtin' : 'identifier';
      } else { text = first; type = '=<>!+-*/%'.includes(first) ? 'operator' : 'punctuation'; }
      tokens.push({ text, type }); index += text.length;
    }
    return tokens;
  }
  const tokenizePython = source => tokenizeCode(source, 'python');
  function visibleTokens(source, count = source.length, language = 'python') {
    let remaining = Math.max(0, count);
    return tokenizeCode(source, language).flatMap(token => {
      const text = token.text.slice(0, remaining); remaining = Math.max(0, remaining - token.text.length);
      return text ? [{ text, type: token.type }] : [];
    });
  }
  function renderCode(target, source, count = source.length, language = 'python') {
    const fragment = document.createDocumentFragment();
    visibleTokens(source, count, language).forEach(token => {
      const span = document.createElement('span');
      if (token.type) span.className = 'syntax-' + token.type;
      span.textContent = token.text; fragment.append(span);
    });
    target.replaceChildren(fragment);
  }
  const renderPython = (target, source, count = source.length) => renderCode(target, source, count, 'python');
  const reference = /\b(?:range\(len\(text\)\)|len\(text\)|text\[i\]|found\s*=\s*(?:True|False)|if found|[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)?\([^()]*\)|[a-zA-Z_]\w*\[[^\]]+\]|[a-z]+_[a-z_]+|input|print|range|len|open|int|str|found|text|i|True|False|break|else|Cab|Boolean|if(?= statement| and else| branch)|for(?= loop))(?!\w)|\b\d+\b|['"]a['"]/g;
  function tutorSegments(text, identifiers = [], language = 'python') {
    const segments = []; let end = 0;
    const terms = identifiers.filter(name => /^[A-Za-z_]\w*$/.test(name));
    const sql = language === 'sql' ? '|\\b(?:SELECT|FROM|WHERE|AND|OR|NOT|ORDER|BY|ASC|DESC|LIKE)\\b' : '';
    const pattern = new RegExp(reference.source + sql + (terms.length ? '|\\b(?:' + terms.join('|') + ')\\b' : ''), 'g');
    for (const match of text.matchAll(pattern)) {
      // The verb in "has been found" is prose, not the Boolean identifier.
      if (match[0] === 'found' && /\b(?:has(?: not)?|been|was|be|have|is)\s+$/.test(text.slice(0, match.index))) continue;
      if (match.index > end) segments.push({ text: text.slice(end, match.index), type: 'prose' });
      segments.push({ text: match[0], type: match[0] === 'Boolean' ? 'emphasis' : 'code' });
      end = match.index + match[0].length;
    }
    if (end < text.length) segments.push({ text: text.slice(end), type: 'prose' });
    return segments;
  }
  function renderTutorText(target, text, identifiers = [], language = 'python') {
    const fragment = document.createDocumentFragment();
    const label = text.match(/^(Remember(?::|\b)|✅ Correct\.|❌ Incorrect\.)\s*/);
    if (label) {
      const strong = document.createElement('strong');
      strong.className = label[1].startsWith('Remember') ? 'tutor-remember-title' : 'tutor-feedback-title';
      strong.textContent = label[0]; fragment.append(strong); text = text.slice(label[0].length);
    }
    tutorSegments(text, identifiers, language).forEach(segment => {
      if (segment.type === 'prose') fragment.append(document.createTextNode(segment.text));
      else {
        const item = document.createElement(segment.type === 'code' ? 'code' : 'strong');
        if (segment.type === 'code') {
          item.className = 'tutor-inline-code'; renderCode(item, segment.text, segment.text.length, language);
          if (segment.text === 'Cab') item.firstChild.className = 'syntax-string';
        } else item.textContent = segment.text;
        fragment.append(item);
      }
    });
    target.replaceChildren(fragment);
  }
  const api = { tokenizeCode, tokenizePython, visibleTokens, tutorSegments, renderCode, renderPython, renderTutorText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CSRTutorialCodeStyle = api;
})();
