/* Bộ lọc HTML cho nội dung bài viết (trình soạn thảo giống Word).
   Chỉ giữ lại thẻ/thuộc tính an toàn; mọi thứ khác (script, sự kiện onclick, javascript:...) bị loại bỏ. */
const TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'sub', 'sup', 'mark', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'span', 'div', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'iframe']);
const VOID = new Set(['br', 'img', 'hr']);
const CLASSES = new Set(['fig-left', 'fig-right', 'fig-center', 'fig-s', 'fig-m', 'fig-l', 'yt', 'tbl']);
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+\s*(,\s*[\d.]+\s*){2,3}\)|[a-z]{3,20})$/i;
const STYLE = {
  'text-align': v => /^(left|center|right|justify)$/i.test(v),
  color: v => COLOR.test(v),
  'background-color': v => COLOR.test(v),
  'font-size': v => /^\d{1,3}(\.\d+)?(px|pt|em|rem|%)$/i.test(v) && parseFloat(v) > 0 && parseFloat(v) <= 400,
  'font-weight': v => /^(normal|bold|[1-9]00)$/i.test(v),
  'font-style': v => /^(normal|italic)$/i.test(v),
  'text-decoration': v => /^(none|underline|line-through)( (underline|line-through))?$/i.test(v),
  'line-height': v => /^\d(\.\d+)?$/.test(v) || /^\d{2,3}%$/.test(v),
  'margin-left': v => /^\d{1,3}(px|em)$/i.test(v),
  'padding-left': v => /^\d{1,3}(px|em)$/i.test(v),
  'text-indent': v => /^\d{1,3}(px|em)$/i.test(v),
};
const MEDIA_URL = /^(\/uploads\/[\w.-]+|https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[\w\-./%]+)$/i;
const YT = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]{11}(\?[\w=&.-]*)?$/;

const decode = s => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = s => String(s).replace(/&(?!#?\w{1,10};)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function cleanStyle(raw) {
  const out = [];
  for (const part of decode(raw).split(';')) {
    const i = part.indexOf(':'); if (i < 0) continue;
    const k = part.slice(0, i).trim().toLowerCase(), v = part.slice(i + 1).trim();
    if (STYLE[k] && v.length < 60 && !/url\(|expression|javascript|[<>"\\]/i.test(v) && STYLE[k](v)) out.push(k + ':' + v);
  }
  return out.join(';');
}
function safeUrl(u) { u = decode(u).trim(); return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(u) && !/[\s<>"']/.test(u) ? u : ''; }

function cleanAttrs(tag, rawAttrs) {
  const at = {};
  const re = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g; let m;
  while ((m = re.exec(rawAttrs || ''))) at[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3];
  const out = [];
  if (at.style) { const s = cleanStyle(at.style); if (s) out.push(`style="${escAttr(s)}"`); }
  if (at.class) { const c = decode(at.class).split(/\s+/).filter(x => CLASSES.has(x)).join(' '); if (c) out.push(`class="${c}"`); }
  if (tag === 'a') {
    const h = safeUrl(at.href || ''); if (h) out.push(`href="${escAttr(h)}"`, 'target="_blank"', 'rel="noopener noreferrer"');
  } else if (tag === 'img') {
    const s = decode(at.src || '').trim();
    if (!(MEDIA_URL.test(s) || /^https:\/\/[^\s"'<>]+$/i.test(s))) return null; // ảnh không hợp lệ: bỏ cả thẻ
    out.unshift(`src="${escAttr(s)}"`, `alt="${escAttr(decode(at.alt || '').slice(0, 200))}"`, 'loading="lazy"');
  } else if (tag === 'iframe') {
    const s = decode(at.src || '').trim(); if (!YT.test(s)) return null;
    out.unshift(`src="${escAttr(s)}"`, 'allowfullscreen', 'loading="lazy"', 'referrerpolicy="strict-origin-when-cross-origin"');
  } else if (tag === 'td' || tag === 'th') {
    for (const k of ['colspan', 'rowspan']) if (/^\d{1,2}$/.test(at[k] || '')) out.push(`${k}="${at[k]}"`);
  }
  return out.length ? ' ' + out.join(' ') : '';
}

function sanitizeHtml(input, max = 400000) {
  let s = String(input == null ? '' : input).slice(0, max);
  s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|noscript|object|embed|template)\b[\s\S]*?<\/\1\s*>/gi, '');
  const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)\s*(\/?)>/y;
  let out = '', i = 0; const stack = [];
  while (i < s.length) {
    const lt = s.indexOf('<', i);
    if (lt < 0) { out += escText(s.slice(i)); break; }
    out += escText(s.slice(i, lt));
    TAG.lastIndex = lt;
    const m = TAG.exec(s);
    if (!m) { out += '&lt;'; i = lt + 1; continue; }
    i = lt + m[0].length;
    const close = m[1] === '/', tag = m[2].toLowerCase();
    if (!TAGS.has(tag)) continue; // bỏ thẻ lạ, giữ chữ bên trong
    if (close) {
      const k = stack.lastIndexOf(tag);
      if (k >= 0) { while (stack.length > k) out += `</${stack.pop()}>`; }
      continue;
    }
    const attrs = cleanAttrs(tag, m[3]); if (attrs === null) continue;
    if (VOID.has(tag)) { out += `<${tag}${attrs}>`; continue; }
    out += `<${tag}${attrs}>`; stack.push(tag);
  }
  while (stack.length) out += `</${stack.pop()}>`;
  return out;
}
const stripHtml = h => decode(String(h || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
module.exports = { sanitizeHtml, stripHtml };
