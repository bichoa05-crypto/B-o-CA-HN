const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeLink = v => /^(#|\/(?!\/)|https?:\/\/|tel:|mailto:|[\w-]+\.html)/i.test(String(v || '')) ? v : '#';
const p2 = n => String(n).padStart(2, '0');
const fmtDate = t => { const d = new Date(t); return `${p2(d.getHours())}:${p2(d.getMinutes())} ${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`; };
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
const ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const ICON_LONG = '<svg class="feat-arrow" viewBox="0 0 70 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9h64M58 2l8 7-8 7"/></svg>';
const ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';
const ICON_PLAY = '<span style="position:absolute;inset:0;margin:auto;width:56px;height:56px;border-radius:50%;background:#fff;color:#c8201a;display:grid;place-items:center;box-shadow:0 0 0 7px #ffffff3d;z-index:2"><svg viewBox="0 0 24 24" width="22" fill="currentColor" style="margin-left:3px"><path d="M7 4.5v15l13-7.5z"/></svg></span>';
const SHIRT = '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M22 6 8 12 2 26l9 4 3-5v33h36V25l3 5 9-4-6-14-14-6c-1 4-5 7-10 7s-9-3-10-7z"/></svg>';
let names = {}, site = null;

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

const links = [...nav.querySelectorAll('a')];
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['ve-chung-toi', 'dong-chay', 'doi-hinh', 'lan-bong', 'ben-le-san-co', 'nguoi-ham-mo', 'multimedia', 'cua-hang'].forEach(id => $('#' + id) && io.observe($('#' + id)));
const rvIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } }), { threshold: .1 });
const reveal = () => document.querySelectorAll('.rv:not(.in)').forEach(el => rvIO.observe(el));

/* ---------- hero ---------- */
let slides = [], dots = [], cur = 0, timer;
function go(i) {
  cur = (i + slides.length) % slides.length;
  slides.forEach((s, k) => { s.classList.toggle('active', k === cur); s.setAttribute('aria-hidden', k !== cur); });
  dots.forEach((d, k) => d.classList.toggle('on', k === cur));
}
function restart() { clearTimeout(timer); if (slides.length > 1) timer = setTimeout(() => { go(cur + 1); restart(); }, 6500); }
function renderHero(list) {
  if (!list.length) list = [{ line1: 'BÁO CÔNG AN HÀ NỘI', line2: '', image: '' }];
  $('#slides').innerHTML = list.map((s, i) => `
    <article class="slide"><div class="bg ${s.image ? '' : 'art'}" ${s.image ? `style="background-image:url('${esc(s.image)}')"` : ''}></div>
      <div class="slide-inner"><h1>${s.line1 ? `<span class="l1">${esc(s.line1)}</span>` : ''}${s.line2 ? `<span class="l2">${esc(s.line2)}</span>` : ''}</h1>
      ${s.button ? `<a class="pill" href="${esc(safeLink(s.link))}">${esc(s.button)}</a>` : ''}</div></article>`).join('');
  slides = [...$('#slides').children];
  $('#dots').innerHTML = slides.map((_, i) => `<button aria-label="Slide ${i + 1}"></button>`).join('');
  dots = [...$('#dots').children];
  dots.forEach((d, i) => d.onclick = () => { go(i); restart(); });
  $('#dots').hidden = slides.length < 2;
  const hero = $('#hero');
  let sx = null;
  hero.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  hero.addEventListener('touchend', e => { if (sx == null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) { go(cur + (d < 0 ? 1 : -1)); restart(); } sx = null; });
  go(0); restart();
}

/* ---------- giải đấu ---------- */
const initials = s => String(s || '').split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
function renderMatches(list) {
  $('#matches').innerHTML = list.map((m, i) => `
    <div class="m-col rv ${i === 0 ? 'on' : ''}" style="--d:${i * .08}s">
      <div class="m-tab">${esc(m.name)}</div>
      <div class="m-card">
        <div class="m-teams">
          <div class="m-team">${m.homeLogo ? `<img class="m-logo" src="${esc(m.homeLogo)}" alt="">` : `<span class="m-logo">${esc(initials(m.homeName))}</span>`}<div class="m-name">${esc(m.homeName)}</div></div>
          <div class="m-vs">VS</div>
          <div class="m-team">${m.awayLogo ? `<img class="m-logo" src="${esc(m.awayLogo)}" alt="">` : `<span class="m-logo">${esc(initials(m.awayName))}</span>`}<div class="m-name">${esc(m.awayName)}</div></div>
        </div>
        <div class="m-when">${esc(m.date)}<i></i>${esc(m.time)}</div>
        <a class="m-buy" href="${esc(safeLink(m.ticketUrl))}">Mua vé</a>
      </div></div>`).join('');
  document.querySelectorAll('.m-col').forEach(c => c.addEventListener('mouseenter', () => { document.querySelectorAll('.m-col').forEach(x => x.classList.toggle('on', x === c)); }));
}

/* ---------- bài viết ---------- */
const ph = i => `<div class="ph p${(i % 5) + 1}"></div>`;
const img = (a, i) => a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy">` : ph(i);
const empty = '<p class="empty">Chưa có bài viết trong chuyên mục này.</p>';
function renderFlow(l) {
  if (!l.length) return empty;
  const a = l[0];
  return `<a class="feat rv" href="${href(a)}">${img(a, 0)}${hasVideo(a) ? ICON_PLAY : ''}<div class="feat-cap"><h3>${esc(a.title)}</h3><time>${fmtDate(a.createdAt)}</time>${ICON_LONG}</div></a>
  <div class="n-grid">${l.slice(1, 7).map((b, i) => `<a class="n-card rv" style="--d:${(i % 3) * .08}s" href="${href(b)}"><div class="th">${img(b, i + 1)}${hasVideo(b) ? ICON_PLAY : ''}</div><h3>${esc(b.title)}</h3><time>${fmtDate(b.createdAt)}</time></a>`).join('')}</div>`;
}
const meta = a => `<div class="meta"><b>${esc(names[a.section] || '')}</b><time>${ago(a.createdAt)}</time></div>`;
const renderBento = l => l.length ? l.slice(0, 5).map((a, i) => i === 0
  ? `<a class="card big rv" href="${href(a)}"><div class="th">${img(a, 0)}</div><div class="body">${meta(a)}<h3>${esc(a.title)}</h3>${a.summary ? `<p>${esc(a.summary)}</p>` : ''}</div></a>`
  : `<a class="card rv" style="--d:${i * .08}s" href="${href(a)}"><div class="th">${img(a, i)}</div><div class="body">${meta(a)}<h3>${esc(a.title)}</h3></div></a>`).join('') : empty;
const renderList = l => l.length ? l.slice(0, 5).map((a, i) =>
  `<li class="rv" style="--d:${i * .06}s"><a href="${href(a)}"><span class="num">${p2(i + 1)}</span><span class="t">${esc(a.title)}<time>${ago(a.createdAt)}</time></span>${ICON_ARROW}</a></li>`).join('') : `<li>${empty}</li>`;
const renderMM = l => l.length ? `<div class="n-grid">${l.slice(0, 3).map((a, i) => `<a class="n-card rv" style="--d:${i * .08}s" href="${href(a)}"><div class="th">${img(a, i)}${hasVideo(a) ? ICON_PLAY : ''}</div><h3>${esc(a.title)}</h3><time>${fmtDate(a.createdAt)}</time></a>`).join('')}</div>` : '';

/* ---------- đội hình ---------- */
let sqI = 0;
const perView = () => innerWidth <= 480 ? 1 : innerWidth <= 820 ? 2 : 3;
function renderSquad(list) {
  $('#sqTrack').innerHTML = list.map(p => `<article class="sq-card"><span class="no">${esc(p.number)}</span>${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : '<span class="sil"></span>'}<h3>${esc(p.name)}</h3></article>`).join('');
  sqI = 0; sqUpdate();
}
function sqUpdate() {
  const cards = [...document.querySelectorAll('.sq-card')], max = Math.max(0, cards.length - perView());
  sqI = Math.min(Math.max(sqI, 0), max);
  const gap = parseFloat(getComputedStyle($('#sqTrack')).columnGap) || 0;
  const w = cards[0] ? cards[0].offsetWidth + gap : 0;
  $('#sqTrack').style.transform = `translateX(${-sqI * w}px)`;
  $('#sqDots').innerHTML = Array.from({ length: max + 1 }, (_, i) => `<button class="${i === sqI ? 'on' : ''}" aria-label="Vị trí ${i + 1}"></button>`).join('');
  [...$('#sqDots').children].forEach((b, i) => b.onclick = () => { sqI = i; sqUpdate(); });
  $('#sqDots').hidden = max === 0;
}
$('#sqPrev').onclick = () => { sqI--; sqUpdate(); };
$('#sqNext').onclick = () => { sqI++; sqUpdate(); };
$('#sqAll').onclick = e => { const s = $('#doi-hinh'); const all = s.classList.toggle('sq-all'); e.target.textContent = all ? 'Thu gọn' : 'Xem tất cả'; };
addEventListener('resize', () => sqUpdate());

/* ---------- cửa hàng ---------- */
function renderShop(s) {
  $('#shopTitle').textContent = s.title; $('#shopSub').textContent = s.subtitle;
  const prods = s.products.slice(0, 4);
  $('#podium').innerHTML = prods.map((p, i) => ({ p, rank: i + 1 })).reverse().map(({ p, rank }) => `
    <a class="pd r${rank} rv" style="--d:${(4 - rank) * .1}s" href="${esc(safeLink(p.link))}">
      <div class="pic">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : SHIRT}</div>
      <div class="col"><b>${rank}</b></div><div class="nm">${esc(p.name)}</div></a>`).join('')
    + `<a class="pod-next" href="${esc(safeLink((prods[0] || {}).link))}" aria-label="Xem cửa hàng">${ICON_ARROW}</a>`;
}

/* ---------- thành tích ---------- */
const MEDAL = { champion: ['#f6d35b', '#d79a16', '1'], runner: ['#e4e4e8', '#9a9aa3', '2'], third: ['#e2a77f', '#b36d3e', '3'] };
const medal = r => { const [a, b, n] = MEDAL[r] || MEDAL.champion; return `<svg class="medal" viewBox="0 0 40 52" aria-hidden="true"><path d="M9 0h8l5 22H12zM31 0h-8l-5 22h10z" fill="#d23a30"/><circle cx="20" cy="33" r="16" fill="${b}"/><circle cx="20" cy="33" r="13.5" fill="${a}" stroke="#fff8" stroke-width="1"/><text x="20" y="39" text-anchor="middle" font-family="Be Vietnam Pro,Arial" font-weight="800" font-size="17" fill="${b}">${n}</text></svg>`; };
const LABEL = { champion: 'Vô địch', runner: 'Á quân', third: 'Hạng ba' };
const period = y => { const n = parseInt(y, 10) || 0; return n < 1990 ? 0 : n < 2010 ? 1 : 2; };
let honors = [], hPeriod = 0;
function drawHonors() {
  const sel = $('#hSel').value;
  const rows = honors.filter(h => period(h.year) === hPeriod && (!sel || h.name === sel));
  $('#hRows').innerHTML = rows.length ? rows.map(h => `<div class="h-row">${medal(h.result)}<span class="y">${esc(h.year)}</span><span class="n">${esc(h.name)}</span><span class="badge ${h.result}">${LABEL[h.result] || ''}</span>${ICON_CHEV}</div>`).join('') : '<p class="h-empty">Chưa có dữ liệu trong giai đoạn này.</p>';
}
function renderHonors(h) {
  honors = h.items; $('#hTitle').textContent = h.title;
  $('#hBanner').insertAdjacentHTML('afterbegin', h.banner ? `<img src="${esc(h.banner)}" alt="">` : '<div class="bgart"></div>');
  $('#hSel').innerHTML = '<option value="">Tất cả giải đấu</option>' + [...new Set(honors.map(x => x.name))].map(n => `<option>${esc(n)}</option>`).join('');
  $('#hSel').onchange = drawHonors;
  document.querySelectorAll('.h-per button').forEach(b => b.onclick = () => { hPeriod = +b.dataset.p; document.querySelectorAll('.h-per button').forEach(x => x.classList.toggle('on', x === b)); drawHonors(); });
  drawHonors();
}

/* ---------- tải dữ liệu ---------- */
const DEFAULT_SITE_FALLBACK = { hero: [], tournaments: [], intro: { line1: 'CONG AN HA NOI', line2: 'SINCE 1956' }, squad: [], multimedia: {}, shop: { title: 'Cửa hàng chính thức', subtitle: 'Sản phẩm bán chạy nhất', products: [] }, honors: { title: 'CÔNG AN HÀ NỘI FC', items: [] }, sponsors: [] };
async function load() {
  let sections = [], all = [];
  try {
    [sections, all, site] = await Promise.all([fetch('/api/sections').then(r => r.json()), fetch('/api/articles').then(r => r.json()), fetch('/api/site').then(r => r.json())]);
    if (!Array.isArray(sections) || !Array.isArray(all) || !site || !site.hero) throw 0;
  } catch { sections = []; all = []; site = null; }
  if (!sections.length) sections = [['dong-chay', 'Dòng chảy'], ['lan-bong', 'Lăn bóng'], ['ben-le-san-co', 'Bên lề sân cỏ'], ['nguoi-ham-mo', 'Người hâm mộ'], ['multimedia', 'Multimedia']].map(([id, name]) => ({ id, name }));
  if (!all.length && window.DEMO_ARTICLES) all = window.DEMO_ARTICLES;
  if (!site) site = window.DEMO_SITE || DEFAULT_SITE_FALLBACK;
  names = Object.fromEntries(sections.map(s => [s.id, s.name]));
  document.querySelectorAll('[data-title]').forEach(el => { if (names[el.dataset.title]) el.textContent = names[el.dataset.title]; });
  document.querySelectorAll('[data-sec]').forEach(el => { if (names[el.dataset.sec]) el.textContent = names[el.dataset.sec]; });
  const by = id => all.filter(a => a.section === id);
  renderHero(site.hero);
  renderMatches(site.tournaments);
  $('#list-dong-chay').innerHTML = renderFlow(by('dong-chay'));
  const g = $('#glitch'); g.innerHTML = `<span>${esc(site.intro.line1)}</span><span>${esc(site.intro.line2)}</span>`;
  renderSquad(site.squad);
  $('#list-lan-bong').innerHTML = renderBento(by('lan-bong'));
  $('#list-ben-le-san-co').innerHTML = renderList(by('ben-le-san-co'));
  $('#list-nguoi-ham-mo').innerHTML = renderList(by('nguoi-ham-mo'));
  const mm = $('#mm'), m = site.multimedia || {};
  mm.insertAdjacentHTML('afterbegin', m.image ? `<img src="${esc(m.image)}" alt="">` : '<div class="bgart"></div>');
  if (m.button) mm.insertAdjacentHTML('beforeend', `<a class="more" href="${esc(safeLink(m.link))}">${esc(m.button)}</a>`);
  $('#mmList').innerHTML = renderMM(by('multimedia'));
  renderShop(site.shop);
  renderHonors(site.honors);
  $('#sponsors').innerHTML = site.sponsors.map(s => s.image
    ? `<a class="sp" ${s.url ? `href="${esc(safeLink(s.url))}" target="_blank" rel="noopener"` : ''} title="${esc(s.name)}"><img src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy"></a>`
    : `<span class="sp txt">${esc(s.name)}</span>`).join('');
  $('.sponsors').hidden = !site.sponsors.length;
  reveal(); sqUpdate();
  window.__all = all;
}
load();

/* ---------- tìm kiếm ---------- */
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
