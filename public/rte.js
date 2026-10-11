/* Trình soạn thảo bài viết kiểu Word (không cần thư viện ngoài).
   Dùng: const rte = new RTE(containerEl, { upload: file => Promise<url> }); rte.setHTML(html); rte.getHTML(); */
(function () {
  const TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'DEL', 'SUB', 'SUP', 'MARK', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'IMG', 'FIGURE', 'FIGCAPTION', 'SPAN', 'DIV', 'HR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'IFRAME']);
  const STYLE_OK = ['text-align', 'color', 'background-color', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'line-height', 'margin-left', 'padding-left', 'text-indent'];
  const CLS_OK = ['fig-left', 'fig-right', 'fig-center', 'fig-s', 'fig-m', 'fig-l', 'yt', 'tbl'];
  const YT = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]{11}/;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // làm sạch HTML (dán từ Word/web, và trước khi lưu); máy chủ vẫn lọc lại lần nữa
  function clean(html) {
    const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    const walk = node => {
      [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 8) return ch.remove();
        if (ch.nodeType !== 1) return;
        if (/^(SCRIPT|STYLE|META|LINK|TITLE|HEAD|O:P|XML)$/.test(ch.tagName)) return ch.remove();
        walk(ch);
        if (ch.tagName === 'IFRAME' && !YT.test(ch.getAttribute('src') || '')) return ch.remove();
        if (!TAGS.has(ch.tagName)) { while (ch.firstChild) ch.before(ch.firstChild); return ch.remove(); }
        const keep = {};
        const st = ch.style; STYLE_OK.forEach(p => { const v = st.getPropertyValue(p); if (v) keep[p] = v; });
        const cls = [...ch.classList].filter(c => CLS_OK.includes(c));
        const href = ch.getAttribute('href'), src = ch.getAttribute('src'), alt = ch.getAttribute('alt'), cs = ch.getAttribute('colspan'), rs = ch.getAttribute('rowspan');
        [...ch.attributes].forEach(a => ch.removeAttribute(a.name));
        const css = Object.entries(keep).map(([k, v]) => k + ':' + v).join(';'); if (css) ch.setAttribute('style', css);
        if (cls.length) ch.setAttribute('class', cls.join(' '));
        if (ch.tagName === 'A' && href && /^(https?:|mailto:|tel:|\/|#)/i.test(href)) { ch.setAttribute('href', href); ch.setAttribute('target', '_blank'); ch.setAttribute('rel', 'noopener noreferrer'); }
        if (ch.tagName === 'IMG') { if (!src || /^(javascript|data:text)/i.test(src)) return ch.remove(); ch.setAttribute('src', src); ch.setAttribute('alt', alt || ''); }
        if (ch.tagName === 'IFRAME') { ch.setAttribute('src', src); ch.setAttribute('allowfullscreen', ''); }
        if (cs) ch.setAttribute('colspan', cs); if (rs) ch.setAttribute('rowspan', rs);
        // thẻ rỗng vô nghĩa do dán từ Word
        if (ch.tagName === 'SPAN' && !ch.attributes.length) { while (ch.firstChild) ch.before(ch.firstChild); ch.remove(); }
      });
    };
    walk(doc.body);
    return doc.body.innerHTML;
  }

  const legacy = t => String(t || '').split(/\n{2,}/).filter(p => p.trim()).map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');
  const toHtml = c => (/^\s*</.test(c || '') ? c : legacy(c));

  // thu nhỏ ảnh lớn trước khi tải lên (nhẹ trang, vừa giới hạn tải)
  async function shrink(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || (file.size < 900 * 1024)) return file;
    const bmp = await createImageBitmap(file).catch(() => null); if (!bmp) return file;
    const k = Math.min(1, 1800 / bmp.width), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .88));
    return blob && blob.size < file.size ? new File([blob], 'anh.jpg', { type: 'image/jpeg' }) : file;
  }

  const ICON = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>', redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
    left: '<path d="M3 6h18M3 12h12M3 18h16"/>', center: '<path d="M3 6h18M6 12h12M4 18h16"/>', right: '<path d="M3 6h18M9 12h12M5 18h16"/>', justify: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    ul: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>', ol: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 5v4M3 9h3M3 14h3l-3 4h3"/>',
    outdent: '<path d="M3 6h18M11 12h10M3 18h18"/><path d="m7 9-3 3 3 3"/>', indent: '<path d="M3 6h18M11 12h10M3 18h18"/><path d="m3 9 3 3-3 3"/>',
    quote: '<path d="M7 7h4v4c0 3-1.5 5-4 5M15 7h4v4c0 3-1.5 5-4 5"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    unlink: '<path d="m4 4 16 16"/><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-3-6.8M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 3 6.8"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/>', video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>', hr: '<path d="M3 12h18"/>', clear: '<path d="m5 19 7-14 7 14M8 13h8"/><path d="m3 3 18 18"/>',
  };
  const ic = n => `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

  class RTE {
    constructor(host, opts = {}) {
      this.host = typeof host === 'string' ? document.querySelector(host) : host;
      this.upload = opts.upload || (() => Promise.reject(new Error('Chưa cấu hình tải ảnh')));
      this.build();
    }
    build() {
      const h = this.host; h.classList.add('rte');
      h.innerHTML = `
      <div class="rte-bar" role="toolbar" aria-label="Công cụ soạn thảo">
        <div class="rte-g"><button type="button" data-c="undo" title="Hoàn tác (Ctrl+Z)">${ic('undo')}</button><button type="button" data-c="redo" title="Làm lại (Ctrl+Y)">${ic('redo')}</button></div>
        <div class="rte-g">
          <select data-s="block" title="Kiểu đoạn"><option value="p">Đoạn văn</option><option value="h2">Tiêu đề lớn</option><option value="h3">Tiêu đề vừa</option><option value="h4">Tiêu đề nhỏ</option><option value="blockquote">Trích dẫn</option></select>
          <select data-s="size" title="Cỡ chữ"><option value="">Cỡ chữ</option><option value="14">14</option><option value="16">16</option><option value="18">18</option><option value="20">20</option><option value="24">24</option><option value="28">28</option><option value="32">32</option><option value="40">40</option></select>
        </div>
        <div class="rte-g"><button type="button" data-c="bold" title="Đậm (Ctrl+B)"><b>B</b></button><button type="button" data-c="italic" title="Nghiêng (Ctrl+I)"><i>I</i></button><button type="button" data-c="underline" title="Gạch chân (Ctrl+U)"><u>U</u></button><button type="button" data-c="strikeThrough" title="Gạch ngang"><s>S</s></button>
          <button type="button" data-c="superscript" title="Chỉ số trên">x<sup>2</sup></button><button type="button" data-c="subscript" title="Chỉ số dưới">x<sub>2</sub></button>
          <label class="rte-color" title="Màu chữ"><span style="border-bottom:3px solid #c8201a">A</span><input type="color" data-k="foreColor" value="#c8201a"></label>
          <label class="rte-color" title="Tô nền chữ"><span style="background:#ffe66b;padding:0 3px">ab</span><input type="color" data-k="hiliteColor" value="#ffe66b"></label></div>
        <div class="rte-g"><button type="button" data-c="justifyLeft" title="Căn trái">${ic('left')}</button><button type="button" data-c="justifyCenter" title="Căn giữa">${ic('center')}</button><button type="button" data-c="justifyRight" title="Căn phải">${ic('right')}</button><button type="button" data-c="justifyFull" title="Căn đều hai bên lề">${ic('justify')}</button></div>
        <div class="rte-g"><button type="button" data-c="insertUnorderedList" title="Danh sách chấm">${ic('ul')}</button><button type="button" data-c="insertOrderedList" title="Danh sách số">${ic('ol')}</button><button type="button" data-c="outdent" title="Giảm thụt lề">${ic('outdent')}</button><button type="button" data-c="indent" title="Tăng thụt lề">${ic('indent')}</button><button type="button" data-a="indent1" title="Thụt đầu dòng">¶</button></div>
        <div class="rte-g"><button type="button" data-a="link" title="Chèn liên kết (Ctrl+K)">${ic('link')}</button><button type="button" data-c="unlink" title="Gỡ liên kết">${ic('unlink')}</button>
          <button type="button" data-a="image" title="Chèn ảnh từ máy">${ic('image')}<span>Ảnh</span></button><button type="button" data-a="video" title="Chèn video YouTube">${ic('video')}</button><button type="button" data-a="table" title="Chèn bảng">${ic('table')}</button><button type="button" data-c="insertHorizontalRule" title="Đường kẻ ngang">${ic('hr')}</button><button type="button" data-c="removeFormat" title="Xoá định dạng">${ic('clear')}</button></div>
      </div>
      <div class="rte-wrap"><div class="rte-body rich" contenteditable="true" spellcheck="true" data-ph="Viết nội dung bài ở đây. Có thể dán ảnh trực tiếp (Ctrl+V), kéo thả ảnh vào, hoặc bấm nút Ảnh trên thanh công cụ."></div>
        <div class="rte-img" hidden>
          <button type="button" data-i="s">Nhỏ</button><button type="button" data-i="m">Vừa</button><button type="button" data-i="l">Rộng</button><i></i>
          <button type="button" data-i="left">Trái</button><button type="button" data-i="center">Giữa</button><button type="button" data-i="right">Phải</button><i></i>
          <button type="button" data-i="cap">Chú thích</button><button type="button" data-i="alt">Mô tả</button><button type="button" data-i="del" class="d">Xoá</button></div></div>
      <div class="rte-foot"><span class="rte-count"></span><span class="rte-msg"></span></div>
      <input type="file" accept="image/*" multiple hidden class="rte-file">`;
      this.bar = h.querySelector('.rte-bar'); this.ed = h.querySelector('.rte-body'); this.imgBar = h.querySelector('.rte-img');
      this.file = h.querySelector('.rte-file'); this.msg = h.querySelector('.rte-msg'); this.count = h.querySelector('.rte-count');
      const ex = (c, v) => { this.ed.focus(); document.execCommand(c, false, v); this.changed(); };
      try { document.execCommand('styleWithCSS', false, true); document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}

      this.bar.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); }); // giữ vùng chọn
      this.bar.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.c) ex(b.dataset.c); else if (b.dataset.a) this.action(b.dataset.a);
      });
      this.bar.querySelectorAll('input[type=color]').forEach(i => { i.addEventListener('input', () => ex(i.dataset.k, i.value)); });
      this.bar.querySelector('[data-s=block]').onchange = e => { ex('formatBlock', e.target.value); };
      this.bar.querySelector('[data-s=size]').onchange = e => { const px = e.target.value; e.target.value = ''; if (px) this.fontSize(px); };

      this.ed.addEventListener('input', () => this.changed());
      this.ed.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.action('link'); } });
      this.ed.addEventListener('keyup', () => this.sync()); this.ed.addEventListener('mouseup', () => this.sync());
      this.ed.addEventListener('paste', e => this.onPaste(e));
      this.ed.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
      this.ed.addEventListener('drop', e => { const fs = [...(e.dataTransfer.files || [])].filter(f => f.type.startsWith('image/')); if (fs.length) { e.preventDefault(); this.insertFiles(fs); } });
      this.ed.addEventListener('click', e => this.onClick(e));
      this.file.onchange = () => { const fs = [...this.file.files]; this.file.value = ''; this.insertFiles(fs); };
      this.imgBar.addEventListener('mousedown', e => e.preventDefault());
      this.imgBar.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.imgAction(b.dataset.i); });
      document.addEventListener('click', e => { if (!this.host.contains(e.target)) this.deselect(); });
    }
    changed() { this.count.textContent = (this.ed.innerText.trim().split(/\s+/).filter(Boolean).length) + ' từ'; this.sync(); this.host.dispatchEvent(new Event('rte-change')); }
    sync() {
      const q = c => { try { return document.queryCommandState(c); } catch (e) { return false; } };
      this.bar.querySelectorAll('button[data-c]').forEach(b => b.classList.toggle('on', ['bold', 'italic', 'underline', 'strikeThrough', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'insertUnorderedList', 'insertOrderedList'].includes(b.dataset.c) && q(b.dataset.c)));
    }
    say(t, err) { this.msg.textContent = t || ''; this.msg.className = 'rte-msg' + (err ? ' err' : ''); if (t && !err) setTimeout(() => { if (this.msg.textContent === t) this.msg.textContent = ''; }, 2500); }
    setHTML(c) { this.ed.innerHTML = toHtml(c); this.deselect(); this.count.textContent = ''; this.changed(); }
    getHTML() { const html = clean(this.ed.innerHTML).replace(/<p>(<br>|\s|&nbsp;)*<\/p>/g, '').trim(); return html; }
    isEmpty() { return !this.ed.innerText.trim() && !this.ed.querySelector('img,iframe,table,hr'); }
    focus() { this.ed.focus(); }

    fontSize(px) {
      this.ed.focus(); document.execCommand('fontSize', false, '7');
      this.ed.querySelectorAll('font[size="7"]').forEach(f => { const s = document.createElement('span'); s.style.fontSize = px + 'px'; while (f.firstChild) s.append(f.firstChild); f.replaceWith(s); });
      this.ed.querySelectorAll('span[style*="xxx-large"]').forEach(s => { s.style.fontSize = px + 'px'; });
      this.changed();
    }
    action(a) {
      const ed = this.ed; ed.focus();
      if (a === 'link') {
        const sel = getSelection(), cur = sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest('a');
        const url = prompt('Dán địa chỉ liên kết (https://...)', cur ? cur.getAttribute('href') : 'https://'); if (!url) return;
        if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url)) return this.say('Liên kết phải bắt đầu bằng https://', true);
        if (sel.isCollapsed) document.execCommand('insertHTML', false, `<a href="${esc(url)}">${esc(url)}</a>`); else document.execCommand('createLink', false, url);
      } else if (a === 'image') { this.saveRange(); this.file.click(); return; }
      else if (a === 'video') {
        const u = prompt('Dán link video YouTube'); if (!u) return;
        const m = u.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); if (!m) return this.say('Không nhận ra link YouTube', true);
        document.execCommand('insertHTML', false, `<div class="yt"><iframe src="https://www.youtube.com/embed/${m[1]}" allowfullscreen></iframe></div><p><br></p>`);
      } else if (a === 'table') {
        const v = prompt('Số hàng x số cột', '3x3'); const m = v && v.match(/(\d{1,2})\s*[x×*,]\s*(\d{1,2})/); if (!m) return;
        const r = Math.min(30, +m[1]), c = Math.min(10, +m[2]);
        let t = '<table class="tbl"><tbody>'; for (let i = 0; i < r; i++) { t += '<tr>'; for (let j = 0; j < c; j++) t += i === 0 ? '<th><br></th>' : '<td><br></td>'; t += '</tr>'; } t += '</tbody></table><p><br></p>';
        document.execCommand('insertHTML', false, t);
      } else if (a === 'indent1') {
        const blk = this.currentBlock(); if (blk) blk.style.textIndent = blk.style.textIndent ? '' : '2em';
      }
      this.changed();
    }
    currentBlock() { let n = getSelection().anchorNode; n = n && (n.nodeType === 1 ? n : n.parentElement); while (n && n !== this.ed) { if (/^(P|H2|H3|H4|LI|BLOCKQUOTE|DIV)$/.test(n.tagName)) return n; n = n.parentElement; } return null; }
    saveRange() { const s = getSelection(); this.range = s.rangeCount ? s.getRangeAt(0).cloneRange() : null; }
    restoreRange() { if (this.range) { const s = getSelection(); s.removeAllRanges(); s.addRange(this.range); } }

    onPaste(e) {
      const cd = e.clipboardData; if (!cd) return;
      const files = [...cd.files].filter(f => f.type.startsWith('image/'));
      if (files.length) { e.preventDefault(); this.insertFiles(files); return; }
      const html = cd.getData('text/html');
      if (html) { e.preventDefault(); document.execCommand('insertHTML', false, clean(html.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/g, ''))); this.changed(); }
    }
    async insertFiles(files) {
      if (!document.activeElement || document.activeElement !== this.ed) { this.ed.focus(); this.restoreRange(); }
      for (const f of files) {
        try {
          this.say('Đang tải ảnh lên…');
          const url = await this.upload(await shrink(f));
          document.execCommand('insertHTML', false, `<figure class="fig-center fig-l"><img src="${esc(url)}" alt=""><figcaption>Chú thích ảnh</figcaption></figure><p><br></p>`);
          this.say('Đã chèn ảnh. Bấm vào ảnh để đổi cỡ, vị trí, chú thích.');
        } catch (err) { this.say(err.message || 'Không tải được ảnh', true); }
      }
      this.changed();
    }
    onClick(e) {
      const im = e.target.closest && e.target.closest('img');
      if (im && this.ed.contains(im)) { this.select(im); } else if (!e.target.closest('.rte-img')) this.deselect();
    }
    select(im) {
      this.deselect(); this.img = im; im.classList.add('rte-sel');
      let fig = im.closest('figure');
      if (!fig) { fig = document.createElement('figure'); fig.className = 'fig-center fig-l'; im.replaceWith(fig); fig.append(im); this.changed(); }
      this.fig = fig;
      const wr = this.host.querySelector('.rte-wrap').getBoundingClientRect(), r = im.getBoundingClientRect();
      this.imgBar.hidden = false;
      this.imgBar.style.top = Math.max(4, r.top - wr.top - 44) + 'px'; this.imgBar.style.left = Math.max(4, Math.min(wr.width - this.imgBar.offsetWidth - 4, r.left - wr.left)) + 'px';
      this.imgBar.querySelectorAll('button').forEach(b => { const k = b.dataset.i; b.classList.toggle('on', fig.classList.contains('fig-' + k)); });
    }
    deselect() { if (this.img) this.img.classList.remove('rte-sel'); this.img = this.fig = null; this.imgBar.hidden = true; }
    imgAction(k) {
      const fig = this.fig, im = this.img; if (!fig) return;
      if (['s', 'm', 'l'].includes(k)) { fig.classList.remove('fig-s', 'fig-m', 'fig-l'); fig.classList.add('fig-' + k); }
      else if (['left', 'center', 'right'].includes(k)) { fig.classList.remove('fig-left', 'fig-center', 'fig-right'); fig.classList.add('fig-' + k); }
      else if (k === 'cap') { const c = fig.querySelector('figcaption'); if (c) c.remove(); else { const n = document.createElement('figcaption'); n.textContent = 'Chú thích ảnh'; fig.append(n); } }
      else if (k === 'alt') { const v = prompt('Mô tả ảnh (hiện khi ảnh không tải được, giúp tìm kiếm Google)', im.getAttribute('alt') || ''); if (v !== null) im.setAttribute('alt', v); }
      else if (k === 'del') { fig.remove(); this.deselect(); }
      this.changed(); if (this.img) this.select(this.img);
    }
  }
  window.RTE = RTE; window.RTE_clean = clean; window.RTE_toHtml = toHtml;
})();
