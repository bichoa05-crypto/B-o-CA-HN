const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ago = t => {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return m + ' phút trước';
  if (m < 1440) return Math.floor(m / 60) + ' giờ trước';
  if (m < 10080) return Math.floor(m / 1440) + ' ngày trước';
  return new Date(t).toLocaleDateString('vi-VN');
};
const href = a => 'article.html?id=' + encodeURIComponent(a.id);
const hasVideo = a => !!(a.video || a.videoUrl);
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>';
const ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
let names = {};
const thumb = (a, i = 0, play = false) =>
  `<div class="thumb t${(i % 5) + 1}${a.image ? ' has-img' : ''}">${a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy">` : ''}${play || hasVideo(a) ? `<span class="play">${ICON_PLAY}</span>` : ''}</div>`;
const meta = a => `<div class="meta"><b>${esc(names[a.section] || '')}</b><time>${ago(a.createdAt)}</time></div>`;

/* ---------- header ---------- */
const header = $('#header'), nav = $('#nav'), burger = $('#burger');
const onScroll = () => header.classList.toggle('solid', scrollY > 40);
onScroll(); addEventListener('scroll', onScroll, { passive: true });
function setMenu(open) {
  nav.classList.toggle('open', open); burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
}
burger.onclick = () => setMenu(!nav.classList.contains('open'));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); setSearch(false); } });
const bar = $('#searchBar');
function setSearch(open) { bar.classList.toggle('open', open); $('#searchBtn').setAttribute('aria-expanded', open); if (open) setTimeout(() => $('#q').focus(), 200); }
$('#searchBtn').onclick = () => setSearch(!bar.classList.contains('open'));

// active nav link
const links = [...nav.querySelectorAll('a')];
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['hero', 'thoi-su', 'an-ninh', 'phap-luat', 'giao-thong', 'video'].forEach(id => $('#' + id) && io.observe($('#' + id)));

// reveal on scroll
const rvIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } }), { threshold: .12 });
const reveal = root => (root || document).querySelectorAll('.rv:not(.in)').forEach(el => rvIO.observe(el));

/* ---------- slider ---------- */
let slides = [], dots = [], cur = 0, timer;
function go(i) {
  cur = (i + slides.length) % slides.length;
  slides.forEach((s, k) => { s.classList.toggle('active', k === cur); s.setAttribute('aria-hidden', k !== cur); });
  dots.forEach((d, k) => { d.className = k === cur ? 'on' : k < cur ? 'done' : ''; });
  $('#count').innerHTML = String(cur + 1).padStart(2, '0') + ` <span>/ ${String(slides.length).padStart(2, '0')}</span>`;
}
function restart() { clearTimeout(timer); if (slides.length > 1) timer = setTimeout(() => { go(cur + 1); restart(); }, 6000); }
function initSlider(list) {
  if (!list.length) list = [{ id: '', title: 'Báo Công an Hà Nội', summary: 'Thông tin an ninh trật tự, pháp luật, giao thông và đời sống Thủ đô.', section: '' }];
  $('#slides').innerHTML = list.map((a, i) => `
    <article class="slide">
      <div class="bg ${a.image ? '' : 'art a' + ((i % 4) + 1)}" ${a.image ? `style="background-image:url('${esc(a.image)}')"` : ''}></div>
      <div class="slide-inner">
        ${a.section ? `<span class="tag">${esc(names[a.section] || '')}</span>` : ''}
        <h1>${esc(a.title)}</h1>${a.summary ? `<p>${esc(a.summary)}</p>` : ''}
        ${a.id ? `<a class="pill solid" href="${href(a)}">Đọc bài viết ${ICON_ARROW}</a>` : ''}
      </div></article>`).join('');
  slides = [...$('#slides').children];
  $('#dots').innerHTML = slides.map((_, i) => `<button aria-label="Tin ${i + 1}"><i></i></button>`).join('');
  dots = [...$('#dots').children];
  dots.forEach((d, i) => d.onclick = () => { go(i); restart(); });
  $('#prev').onclick = () => { go(cur - 1); restart(); };
  $('#next').onclick = () => { go(cur + 1); restart(); };
  $('.arrows').hidden = slides.length < 2;
  const hero = $('#hero');
  hero.addEventListener('pointerenter', () => clearTimeout(timer));
  hero.addEventListener('pointerleave', () => { restart(); });
  let sx = null;
  hero.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  hero.addEventListener('touchend', e => { if (sx == null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) { go(cur + (d < 0 ? 1 : -1)); restart(); } sx = null; });
  go(0); restart();
}

/* ---------- renderers ---------- */
const empty = '<p class="empty">Chưa có bài viết trong chuyên mục này.</p>';
const R = {
  bento: l => l.length ? l.slice(0, 5).map((a, i) => i === 0
    ? `<a class="card big rv" href="${href(a)}">${thumb(a, 0)}<div class="body">${meta(a)}<h3>${esc(a.title)}</h3>${a.summary ? `<p>${esc(a.summary)}</p>` : ''}</div></a>`
    : `<a class="card rv" style="--d:${i * .08}s" href="${href(a)}">${thumb(a, i)}<div class="body">${meta(a)}<h3>${esc(a.title)}</h3></div></a>`).join('') : empty,
  cards: l => l.length ? l.slice(0, 3).map((a, i) =>
    `<a class="mcard rv" style="--d:${i * .1}s" href="${href(a)}">${thumb(a, i)}<div class="body">${meta(a)}<h3>${esc(a.title)}</h3></div></a>`).join('') : empty,
  list: l => l.length ? l.slice(0, 5).map((a, i) =>
    `<li class="rv" style="--d:${i * .06}s"><a href="${href(a)}"><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="t">${esc(a.title)}<time>${ago(a.createdAt)}</time></span>${ICON_ARROW}</a></li>`).join('') : `<li>${empty}</li>`,
  video: l => l.length ? l.slice(0, 3).map((a, i) =>
    `<a class="vcard rv" style="--d:${i * .1}s" href="${href(a)}">${thumb(a, i, true)}<h3>${esc(a.title)}</h3>${meta(a)}</a>`).join('') : empty,
};
const MAP = { 'thoi-su': 'bento', 'an-ninh': 'cards', 'phap-luat': 'list', 'giao-thong': 'list', video: 'video' };

async function load() {
  let sections = [], all = [];
  try {
    [sections, all] = await Promise.all([fetch('/api/sections').then(r => r.json()), fetch('/api/articles').then(r => r.json())]);
    if (!Array.isArray(sections) || !Array.isArray(all)) throw 0;
  } catch { sections = []; all = []; }
  if (!sections.length) sections = [['thoi-su', 'Thời sự'], ['an-ninh', 'An ninh - Trật tự'], ['phap-luat', 'Pháp luật'], ['giao-thong', 'Giao thông'], ['video', 'Video']].map(([id, name]) => ({ id, name }));
  if (!all.length && window.DEMO_ARTICLES) all = window.DEMO_ARTICLES; // chưa có bài thật → hiển thị bài mẫu
  names = Object.fromEntries(sections.map(s => [s.id, s.name]));
  document.querySelectorAll('[data-title]').forEach(el => { if (names[el.dataset.title]) el.textContent = names[el.dataset.title]; });
  for (const s of sections) {
    const el = $('#list-' + s.id); if (!el) continue;
    el.innerHTML = R[MAP[s.id] || 'list'](all.filter(a => a.section === s.id));
  }
  reveal();
  initSlider(all.filter(a => a.featured).slice(0, 5));
  $('#tickerText').textContent = all.slice(0, 8).map(a => a.title).join('   •   ') || 'Chào mừng bạn đến với Báo Công an Hà Nội';
  window.__all = all;
}
reveal();
load();

/* ---------- search ---------- */
$('#searchBar').addEventListener('submit', () => {
  const q = $('#q').value.trim().toLowerCase();
  if (!q) return;
  const hit = (window.__all || []).find(a => (a.title + ' ' + a.summary).toLowerCase().includes(q));
  if (hit) location.href = href(hit); else { $('#q').value = ''; $('#q').placeholder = 'Không tìm thấy kết quả cho "' + q + '"'; }
});

/* ---------- tài khoản ---------- */
const modal = $('#authModal');
let mode = 'login', me = { role: null };
function setMode(m) {
  mode = m;
  modal.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  modal.querySelector('.f-name').hidden = m !== 'register';
  $('#authSubmit').textContent = m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
  $('#aPass').autocomplete = m === 'login' ? 'current-password' : 'new-password';
  $('#aUser').previousSibling.textContent = m === 'login' ? 'Email hoặc tên đăng nhập' : 'Email';
  $('#authErr').textContent = '';
}
function openAuth(m = 'login') { setMode(m); modal.hidden = false; document.body.style.overflow = 'hidden'; setTimeout(() => (m === 'login' ? $('#aUser') : $('#aName')).focus(), 50); }
function closeAuth() { modal.hidden = true; document.body.style.overflow = ''; }
modal.querySelectorAll('.seg button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
$('#authClose').onclick = closeAuth;
modal.addEventListener('pointerdown', e => { if (e.target === modal) closeAuth(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeAuth(); });

$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = { username: $('#aUser').value, email: $('#aUser').value, name: $('#aName').value, password: $('#aPass').value };
  $('#authSubmit').disabled = true; $('#authErr').textContent = '';
  try {
    const r = await fetch('/api/' + (mode === 'login' ? 'login' : 'register'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Không thể kết nối máy chủ');
    $('#aPass').value = ''; closeAuth();
    if (d.role === 'admin') { location.href = 'admin.html'; return; }
    await refreshMe();
  } catch (err) { $('#authErr').textContent = err.message; }
  $('#authSubmit').disabled = false;
});

const menu = $('#acctMenu');
async function refreshMe() {
  try { me = await fetch('/api/me').then(r => r.json()); } catch { me = { role: null }; }
  $('#acctLabel').textContent = me.role ? (me.name || 'Tài khoản').split(' ').slice(-1)[0] : 'Tài khoản';
  $('#acctWho').textContent = me.name || '';
  $('#acctAdmin').hidden = me.role !== 'admin';
  menu.hidden = true; $('#acctBtn').setAttribute('aria-expanded', 'false');
}
$('#acctBtn').onclick = () => {
  if (!me.role) return openAuth('login');
  menu.hidden = !menu.hidden; $('#acctBtn').setAttribute('aria-expanded', !menu.hidden);
};
document.addEventListener('click', e => { if (!e.target.closest('#acct')) menu.hidden = true; });
$('#acctOut').onclick = async () => { await fetch('/api/logout', { method: 'POST' }); await refreshMe(); };
refreshMe();
