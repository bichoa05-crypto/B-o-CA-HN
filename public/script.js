let names = {}, site = null;

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
  $('#hPrev').onclick = () => { go(cur - 1); restart(); };
  $('#hNext').onclick = () => { go(cur + 1); restart(); };
  document.querySelector('.h-arrows').hidden = slides.length < 2;
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
    <a class="pd r${rank} rv" style="--d:${(4 - rank) * .1}s" href="shop.html#${esc(p.id || '')}">
      <div class="pic">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : SHIRT}</div>
      <div class="col"><b>${rank}</b></div><div class="nm">${esc(p.name)}</div></a>`).join('')
    + `<a class="pod-next" href="shop.html" aria-label="Xem cửa hàng">${ICON_ARROW}</a>`;
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
  const featured = all.filter(a => a.featured && !a.demo).slice(0, 5).map(a => ({ image: a.image, line1: (names[a.section] || 'Tin nổi bật'), line2: a.title, button: 'Đọc bài viết', link: href(a) }));
  renderHero([...(site.hero || []), ...featured]);
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
