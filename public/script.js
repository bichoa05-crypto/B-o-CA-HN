const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ago = t => {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return m + ' phút trước';
  if (m < 1440) return Math.floor(m / 60) + ' giờ trước';
  return new Date(t).toLocaleDateString('vi-VN');
};
const href = a => 'article.html?id=' + encodeURIComponent(a.id);
const thumb = (a, i = 0, play = false) =>
  `<div class="thumb t${(i % 5) + 1} ${a.image ? 'has-img' : ''}">${a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy">` : ''}${play || a.video || a.videoUrl ? '<span class="play">▶</span>' : ''}</div>`;

// header
const header = $('#header');
const onScroll = () => header.classList.toggle('solid', window.scrollY > 60);
onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
const nav = $('#nav');
$('#burger').addEventListener('click', () => nav.classList.toggle('open'));
nav.addEventListener('click', e => { if (e.target.tagName === 'A') nav.classList.remove('open'); });
$('#searchBtn').addEventListener('click', () => $('#searchBar').classList.toggle('open'));

// slider
let slides = [], dots = [], cur = 0, timer;
function go(i) {
  cur = (i + slides.length) % slides.length;
  slides.forEach((s, k) => s.classList.toggle('active', k === cur));
  dots.forEach((d, k) => d.classList.toggle('on', k === cur));
}
function initSlider(list, names) {
  const wrap = $('#slides'), dotsEl = $('#dots');
  if (!list.length) list = [{ id: '', title: 'Báo Công an Hà Nội', summary: 'Thông tin an ninh trật tự, pháp luật, giao thông và đời sống Thủ đô.', section: '' }];
  wrap.innerHTML = list.map((a, i) => `
    <article class="slide s${(i % 4) + 1}" ${a.image ? `style="background-image:url('${esc(a.image)}')"` : ''}>
      <div class="slide-inner">
        ${a.section ? `<span class="tag">${esc(names[a.section] || '')}</span>` : ''}
        <h1>${esc(a.title)}</h1><p>${esc(a.summary)}</p>
        ${a.id ? `<a class="pill solid" href="${href(a)}">Đọc bài viết</a>` : ''}
      </div></article>`).join('');
  slides = [...wrap.children];
  dotsEl.innerHTML = '';
  dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Slide ' + (i + 1));
    b.onclick = () => { go(i); restart(); };
    dotsEl.appendChild(b); return b;
  });
  go(0); restart();
}
function restart() { clearInterval(timer); if (slides.length > 1) timer = setInterval(() => go(cur + 1), 6000); }

const empty = '<p class="empty">Chưa có bài viết.</p>';
const renderers = {
  'thoi-su': list => list.length ? list.slice(0, 5).map((a, i) => i === 0
    ? `<a class="card big" href="${href(a)}">${thumb(a, 0)}<div class="card-body"><span class="tag small">Mới nhất</span><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><time>${ago(a.createdAt)}</time></div></a>`
    : `<a class="card" href="${href(a)}">${thumb(a, i)}<div class="card-body"><h3>${esc(a.title)}</h3><time>${ago(a.createdAt)}</time></div></a>`).join('') : empty,
  'an-ninh': list => list.length ? list.slice(0, 3).map((a, i) =>
    `<a class="mcard" href="${href(a)}">${thumb(a, i)}<div class="mbody"><time>${ago(a.createdAt)}</time><h3>${esc(a.title)}</h3></div></a>`).join('') : empty,
  list: list => list.length ? list.slice(0, 5).map((a, i) =>
    `<li><span class="num">${String(i + 1).padStart(2, '0')}</span><a href="${href(a)}">${esc(a.title)}</a></li>`).join('') : `<li>${empty}</li>`,
  video: list => list.length ? list.slice(0, 3).map((a, i) =>
    `<a class="vcard" href="${href(a)}">${thumb(a, i, true)}<h3>${esc(a.title)}</h3></a>`).join('') : empty,
};

(async () => {
  try {
    const [sections, all] = await Promise.all([fetch('/api/sections').then(r => r.json()), fetch('/api/articles').then(r => r.json())]);
    const names = Object.fromEntries(sections.map(s => [s.id, s.name]));
    document.querySelectorAll('[data-title]').forEach(el => { if (names[el.dataset.title]) el.textContent = names[el.dataset.title].toUpperCase(); });
    for (const s of sections) {
      const el = $('#list-' + s.id);
      if (!el) continue;
      const list = all.filter(a => a.section === s.id);
      el.innerHTML = (renderers[s.id] || renderers.list)(list);
      if (s.id === 'phap-luat' || s.id === 'giao-thong') el.innerHTML = renderers.list(list);
    }
    initSlider(all.filter(a => a.featured).slice(0, 5), names);
    $('#tickerText').textContent = all.slice(0, 6).map(a => a.title).join('  •  ') || 'Chào mừng bạn đến với Báo Công an Hà Nội';
  } catch (e) { initSlider([], {}); }
})();
