// Trang chuyên mục Đội hình & Dòng chảy (bố cục riêng theo bản thiết kế)
const dmy = t => { const d = new Date(t); return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`; };
// tách tiêu đề thành dòng mảnh + dòng đậm: sau dấu hai chấm/phẩy ở nửa đầu, hoặc trước các từ nối (và, nhân, di, lễ...),
// hoặc sau "Hà Nội"; nếu không có thì ở khoảng 40% độ dài
const LINK_WORDS = ['và', 'nhân', 'di', 'lễ', 'với', 'cùng', 'tại', 'trong', 'chinh', 'sau', 'trước', 'khi', 'để', 'hướng', 'chính'];
function splitTitle(t) {
  t = String(t || '').trim();
  const w = t.split(/\s+/);
  if (w.length < 4) return ['', t];
  const at = i => [w.slice(0, i).join(' '), w.slice(i).join(' ')];
  const pos = []; let len = 0;
  w.forEach((x, i) => { pos[i] = len / t.length; len += x.length + 1; }); // vị trí bắt đầu từ thứ i (0..1)
  const ok = (i, lo, hi) => i > 0 && i < w.length - 1 && pos[i] >= lo && pos[i] <= hi;
  const near = list => list.sort((a, b) => Math.abs(pos[a] - .42) - Math.abs(pos[b] - .42))[0];
  let i = w.findIndex((x, k) => /:$/.test(x) && ok(k + 1, .15, .7));
  if (i < 0) i = w.findIndex((x, k) => /[,;]$/.test(x) && ok(k + 1, .15, .52));
  if (i >= 0) return at(i + 1);
  const low = w.map(x => x.toLowerCase());
  let c = near(low.map((x, k) => LINK_WORDS.includes(x) && ok(k, .2, .66) ? k : -1).filter(k => k >= 0));
  if (c === undefined) c = near(low.map((x, k) => low[k - 2] === 'hà' && /^nội[,:]?$/.test(low[k - 1]) && ok(k, .2, .66) ? k : -1).filter(k => k >= 0));
  if (c === undefined) c = near(w.map((x, k) => ok(k, 0, 1) ? k : -1).filter(k => k >= 0));
  return at(c);
}
const nobr = s => esc(s).replace(/(\S)-(\S)/g, '$1&#8209;$2'); // không ngắt dòng ở dấu gạch nối (V-League)
const t2 = (t, tag = 'h3') => { const [a, b] = splitTitle(t); return `<${tag} class="t2">${a ? `<span class="l1">${nobr(a)}</span>` : ''}<span class="l2">${nobr(b)}</span></${tag}>`; };
const thumb = (a, i) => (coverOf(a) ? `<img src="${esc(coverOf(a))}" alt="" loading="lazy">` : `<div class="ph p${i % 5 + 1}"></div>`) + (hasVideo(a) ? ICON_PLAY : '');
const acCard = (a, i, cls = '') => `<a class="ac${cls}" href="${href(a)}"><div class="th">${thumb(a, i)}</div>${t2(a.title)}<time>${dmy(a.createdAt)}</time></a>`;
const silOr = (img, alt) => img ? `<img src="${esc(img)}" alt="${esc(alt)}" loading="lazy">` : '<span class="sil"></span>';

/* ---------- ĐỘI HÌNH ---------- */
const POSITIONS = [['', 'Tất cả'], ['gk', 'Thủ môn'], ['df', 'Hậu vệ'], ['mf', 'Tiền vệ'], ['fw', 'Tiền đạo']];
const LETTER_Y = [0, .1, .045, .045, .02, .13, .02]; // chữ lớn trên ảnh so le nhẹ như bản thiết kế
function renderSquadPage(site, all) {
  const sp = site.squadPage || {}, squad = site.squad || [], staff = site.staff || [];
  const name = sp.title || 'Đội hình';
  const letters = [...name.toUpperCase().replace(/\s+/g, '')];
  const banner = `<section class="dh-banner">${sp.banner ? `<img src="${esc(sp.banner)}" alt="Tập thể CLB Công An Hà Nội">` : '<div class="bg-art"></div>'}<h1 class="dh-title" aria-label="${esc(name)}">${letters.map((c, i) => `<span aria-hidden="true" style="--y:${LETTER_Y[i % LETTER_Y.length]}em">${esc(c)}</span>`).join('')}</h1></section>`;
  const tabs = POSITIONS.map(([v, n], i) => `<button type="button" data-p="${v}"${i ? '' : ' class="on"'}>${n}</button>`).join('');
  $('#special').innerHTML = banner + `<div class="dh">
    <div class="dh-top"><h2 class="dh-h"><b>Đội hình chính</b></h2><div class="dh-tabs">${tabs}</div></div>
    <div class="pl-grid" id="plGrid"></div>
    ${staff.length ? `<div class="co-wrap"><h2 class="dh-h"><b>Ban huấn luyện</b></h2><div class="co-grid" id="coGrid"></div>${staff.length > 2 ? '<div class="dh-more"><button type="button" class="btn-dk" id="coAll">Xem tất cả</button></div>' : ''}</div>` : ''}
    <div class="dh-news"><h2 class="dh-h"><b>Tin tức đội hình</b></h2><div class="ac-grid" id="dhNews"></div></div>
  </div>`;
  const drawPlayers = pos => {
    const list = squad.filter(p => !pos || p.pos === pos);
    $('#plGrid').innerHTML = list.length ? list.map(p => `<article class="pl"><div class="box pcard">${silOr(p.image, p.name)}<span class="no">${esc(p.number)}</span><div class="pc-tx">${POS_NAME[p.pos] ? `<small>${POS_NAME[p.pos]}</small>` : ''}<h3>${esc(p.name)}</h3></div></div></article>`).join('') : '<p class="pl-empty">Chưa có cầu thủ ở vị trí này.</p>';
  };
  document.querySelectorAll('.dh-tabs button').forEach(b => b.onclick = () => { document.querySelectorAll('.dh-tabs button').forEach(x => x.classList.toggle('on', x === b)); drawPlayers(b.dataset.p); });
  drawPlayers('');
  if (staff.length) {
    const drawStaff = n => { $('#coGrid').innerHTML = staff.slice(0, n).map(c => `<article class="co"><div class="box"><span class="wm"></span>${silOr(c.image, c.name)}<div class="tx"><div class="role">${esc(c.role)}</div><div class="nm">${esc(c.name)}</div></div></div></article>`).join(''); };
    drawStaff(2);
    const btn = $('#coAll');
    if (btn) btn.onclick = () => { const open = !btn.classList.toggle('x'); drawStaff(open ? 2 : staff.length); btn.textContent = open ? 'Xem tất cả' : 'Thu gọn'; };
  }
  const news = demoOr(all).filter(a => a.section === 'doi-hinh');
  $('#dhNews').innerHTML = news.length ? news.map((a, i) => acCard(a, i)).join('') : '<p class="empty">Chưa có bài viết trong chuyên mục này.</p>';
}

/* ---------- DÒNG CHẢY ---------- */
const TAG_X = [48, 0, 56, 14, 71, 0, 52, 98, 10]; // các thẻ hashtag so le như bản thiết kế
async function renderNewsPage(site, all, id, name) {
  const list = demoOr(all).filter(a => a.section === id).sort((a, b) => b.createdAt - a.createdAt);
  const bg = (site.newsPage || {}).banner;
  const head = `<section class="dc-hero"><div class="bg${bg ? '' : ' none'}"${bg ? ` style="background-image:url('${encodeURI(bg)}')"` : ''}></div><h1 class="dc-title">${esc(name)}</h1></section><div class="dc-wrap">`;
  if (!list.length) { $('#special').innerHTML = head + '<p class="dc-empty">Chưa có bài viết trong chuyên mục này.</p></div>'; return; }
  const feat = list.find(a => a.featured) || list[0];
  const latest = list.filter(a => a !== feat).slice(0, 3);
  const views = await getJSON('/api/views', {});
  const most = [...list].sort((a, b) => (views[b.id] || 0) - (views[a.id] || 0) || b.createdAt - a.createdAt).slice(0, 3);
  const shown = new Set([feat, ...latest, ...most]);
  const more = list.filter(a => !shown.has(a));
  // tags hot trend: các hashtag dùng nhiều nhất trên toàn trang
  const cnt = new Map();
  demoOr(all).forEach(a => (a.tags || []).forEach(t => { const k = String(t).trim(); if (k) cnt.set(k, (cnt.get(k) || 0) + 1); }));
  const tags = [...cnt].sort((a, b) => b[1] - a[1]).slice(0, 9).map(x => x[0]);
  const headBar = t => `<div class="dc-head"><h2>${t}</h2><div class="ln"><a href="#dcMore" data-all>Xem tất cả</a></div></div>`;
  $('#special').innerHTML = head + `
    <div class="dc-feat"><a href="${href(feat)}"><div class="ph-wrap">${thumb(feat, 0)}</div><div class="tx">${t2(feat.title, 'h2')}${feat.summary ? `<p>${esc(feat.summary)}</p>` : ''}<time>${dmy(feat.createdAt)}</time></div></a></div>
    ${latest.length ? `<div class="dc-row">
      <div>${headBar('Tin mới nhất')}
        <div class="dc-latest">${acCard(latest[0], 2, ' box-c big')}${latest.length > 1 ? `<div class="col">${latest.slice(1).map((a, i) => acCard(a, i + 3, ' box-c sm')).join('')}</div>` : ''}</div></div>
      <aside class="dc-tags"><h2><span>Tags hot trend</span></h2>${tags.length ? tags.map((t, i) => `<a href="search.html?tag=${encodeURIComponent(t)}" style="--x:${TAG_X[i % TAG_X.length]}px">#${esc(t)}</a>`).join('') : '<p class="none">Chưa có hashtag.</p>'}</aside>
    </div>` : ''}
  </div>
  <section class="dc-most"><div class="dc-wrap">${headBar('Tin đọc nhiều nhất')}<div class="ac-grid">${most.map((a, i) => acCard(a, i)).join('')}</div></div></section>
  <div class="dc-more" id="dcMore"><div class="dc-wrap"><div class="ac-grid" id="moreGrid"></div>${more.length ? '<button type="button" class="btn-read" id="readMore">Đọc thêm</button>' : ''}</div></div>`;
  let n = 0;
  const step = k => {
    const add = more.slice(n, n + k); n += add.length;
    $('#moreGrid').insertAdjacentHTML('beforeend', add.map((a, i) => acCard(a, n + i)).join(''));
    if (n >= more.length && $('#readMore')) $('#readMore').remove();
  };
  if ($('#readMore')) $('#readMore').onclick = () => step(6);
  document.querySelectorAll('[data-all]').forEach(a => a.onclick = e => { e.preventDefault(); step(more.length); $('#dcMore').scrollIntoView({ behavior: 'smooth' }); });
}

/* ---------- dùng chung cho 4 trang Bên lề sân cỏ, Lăn bóng, Người hâm mộ, Multimedia ---------- */
const secList = (all, id) => demoOr(all).filter(a => a.section === id).sort((a, b) => b.createdAt - a.createdAt);
const hotTags = (all, n = 9) => {
  const cnt = new Map();
  demoOr(all).forEach(a => (a.tags || []).forEach(t => { const v = String(t).trim(), k = v.toLowerCase(); if (k) { const c = cnt.get(k) || [v, 0]; c[1]++; cnt.set(k, c); } }));
  return [...cnt.values()].sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]);
};
const byViews = async list => { const v = await getJSON('/api/views', {}); return [...list].sort((a, b) => (v[b.id] || 0) - (v[a.id] || 0) || b.createdAt - a.createdAt); };
const pageCfg = (site, id) => ((site.pages || {})[id]) || {};
const bgStyle = img => img ? ` style="background-image:url('${encodeURI(img)}')"` : '';
// thẻ ảnh phủ chữ (tiêu đề nằm trên ảnh)
const ovCard = (a, i, cls = '') => `<a class="ov${cls}" href="${href(a)}">${thumb(a, i)}<div class="ov-tx">${t2(a.title)}<time>${dmy(a.createdAt)}</time></div></a>`;
// lưới "còn lại" + nút Đọc thêm
const moreHtml = (more, cls = '') => `<div class="ac-grid${cls}" id="moreGrid"></div>${more.length ? '<button type="button" class="btn-read" id="readMore">Đọc thêm</button>' : ''}`;
function wireMore(more, card = acCard, k0 = 6) {
  let n = 0;
  const step = k => {
    const add = more.slice(n, n + k);
    $('#moreGrid').insertAdjacentHTML('beforeend', add.map((a, i) => card(a, n + i)).join('')); n += add.length;
    if (n >= more.length && $('#readMore')) $('#readMore').remove();
  };
  if ($('#readMore')) $('#readMore').onclick = () => step(k0);
  document.querySelectorAll('[data-all]').forEach(a => a.onclick = e => { e.preventDefault(); step(more.length); $('#pgMore').scrollIntoView({ behavior: 'smooth' }); });
  step(k0);
}
const emptyMsg = '<p class="dc-empty">Chưa có bài viết trong chuyên mục này.</p>';

/* ---------- BÊN LỀ SÂN CỎ: gần giống Dòng chảy, bài nổi bật đảo chiều + bảng xếp hạng đọc nhiều ---------- */
async function renderSidePage(site, all, id, name) {
  const cfg = pageCfg(site, id), list = secList(all, id);
  const head = `<section class="dc-hero side"><div class="bg${cfg.banner ? '' : ' none'}"${bgStyle(cfg.banner)}></div><h1 class="dc-title">${esc(name)}</h1>${cfg.intro ? `<p class="dc-intro">${esc(cfg.intro)}</p>` : ''}</section><div class="dc-wrap">`;
  if (!list.length) { $('#special').innerHTML = head + emptyMsg + '</div>'; return; }
  const feat = list.find(a => a.featured) || list[0];
  const latest = list.filter(a => a !== feat).slice(0, 4);
  const most = (await byViews(list)).slice(0, 5);
  const shown = new Set([feat, ...latest]);
  const more = list.filter(a => !shown.has(a));
  const tags = hotTags(all, 12);
  $('#special').innerHTML = head + `
    <div class="dc-feat rev"><a href="${href(feat)}"><div class="tx">${t2(feat.title, 'h2')}${feat.summary ? `<p>${esc(feat.summary)}</p>` : ''}<time>${dmy(feat.createdAt)}</time></div><div class="ph-wrap">${thumb(feat, 0)}</div></a></div>
    <div class="sd-row">
      <div><div class="dc-head"><h2>Tin mới nhất</h2><div class="ln"><a href="#pgMore" data-all>Xem tất cả</a></div></div>
        <div class="sd-grid">${latest.map((a, i) => acCard(a, i + 1, ' box-c sm')).join('') || '<p class="none">Chưa có bài khác.</p>'}</div></div>
      <aside class="sd-side"><div class="sd-rank"><h2><span>Đọc nhiều nhất</span></h2><ol>${most.map((a, i) => `<li><a href="${href(a)}"><b>${p2(i + 1)}</b><div>${t2(a.title)}<time>${dmy(a.createdAt)}</time></div></a></li>`).join('')}</ol></div>
        ${tags.length ? '<div class="dc-tags sd-tg"><h2><span>Tags hot trend</span></h2><div id="sdTags"></div></div>' : ''}</aside>
    </div>
  </div>
  <div class="dc-more" id="pgMore"><div class="dc-wrap">${more.length ? '<div class="dc-head"><h2>Bài viết khác</h2><div class="ln"></div></div><div style="height:clamp(16px,calc(2 * var(--vw)),28px)"></div>' : ''}${moreHtml(more)}</div></div>`;
  wireMore(more);
  if (tags.length) fitSideTags(tags);
}
// tags xếp xen kẽ dòng 2 tag / dòng 1 tag; bớt dần tag cuối cho cột phải không dài hơn cột bài viết bên trái
function fitSideTags(tags) {
  const box = $('#sdTags'), side = $('.sd-side'), left = $('.sd-row > div');
  const draw = n => {
    const rows = []; let i = 0;
    while (i < n) { const k = rows.length % 2 ? 1 : 2; rows.push(tags.slice(i, Math.min(n, i + k))); i += k; }
    box.innerHTML = rows.map((r, j) => `<div class="tg-row${j % 2 ? ' one' : ''}">${r.map(t => `<a href="search.html?tag=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}</div>`).join('');
  };
  const fit = () => {
    let n = tags.length; draw(n);
    if (getComputedStyle($('.sd-row')).gridTemplateColumns.split(' ').length < 2) return; // màn hình hẹp: một cột, hiện hết
    while (n > 1 && side.offsetHeight > left.offsetHeight) draw(--n);
  };
  fit();
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150); });
  addEventListener('load', fit);
}

/* ---------- LĂN BÓNG: sân cỏ, lịch thi đấu, bố cục tạp chí thể thao ---------- */
const teamLogo = (src, n) => src ? `<img src="${esc(src)}" alt="${esc(n)}" loading="lazy">` : `<span class="tl">${esc(String(n || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase())}</span>`;
async function renderMatchPage(site, all, id, name) {
  const cfg = pageCfg(site, id), list = secList(all, id), games = (site.tournaments || []).slice(0, 4);
  const hero = `<section class="lb-hero">${cfg.banner ? `<div class="bg"${bgStyle(cfg.banner)}></div>` : ''}<div class="pitch" aria-hidden="true"></div>
    <div class="dc-wrap"><span class="lb-kick">Mùa giải ${new Date().getFullYear()}</span><h1 class="lb-title">${esc(name)}</h1>${cfg.intro ? `<p class="lb-intro">${esc(cfg.intro)}</p>` : ''}</div></section>`;
  const fixtures = games.length ? `<section class="lb-fix"><div class="dc-wrap"><div class="m-grid">${games.map((g, i) => matchCard(g, i)).join('')}</div></div></section>` : '';
  if (!list.length) { $('#special').innerHTML = hero + fixtures + `<div class="dc-wrap">${emptyMsg}</div>`; matchHover(); reveal(); return; }
  const lead = list.find(a => a.featured) || list[0];
  const side = list.filter(a => a !== lead).slice(0, 2);
  const more = list.filter(a => a !== lead && !side.includes(a));
  $('#special').innerHTML = hero + fixtures + `<div class="dc-wrap lb-body">
    <h2 class="dh-h"><b>Tin trận đấu</b></h2>
    <div class="lb-mag">${ovCard(lead, 0, ' big')}${side.length ? `<div class="col">${side.map((a, i) => ovCard(a, i + 1)).join('')}</div>` : ''}</div>
    <div id="pgMore" class="lb-more">${more.length ? '<h2 class="dh-h"><b>Tin khác</b></h2>' : ''}${moreHtml(more)}</div></div>`;
  wireMore(more); matchHover(); reveal();
}

/* ---------- NGƯỜI HÂM MỘ: ấm áp, lưới bento ---------- */
async function renderFansPage(site, all, id, name) {
  const cfg = pageCfg(site, id), list = secList(all, id);
  const hero = `<section class="fm-hero"><div class="dc-wrap fm-in">
    <div class="fm-tx"><span class="fm-kick">Cầu thủ thứ 12</span><h1 class="fm-title">${esc(name)}</h1>${cfg.intro ? `<p>${esc(cfg.intro)}</p>` : ''}</div>
    <div class="fm-pic"><span class="fm-12" aria-hidden="true">12</span><div class="fm-frame">${cfg.banner ? `<img src="${esc(cfg.banner)}" alt="">` : '<div class="ph p1"></div>'}</div></div>
  </div></section>`;
  if (!list.length) { $('#special').innerHTML = hero + `<div class="dc-wrap">${emptyMsg}</div>`; return; }
  const bento = list.slice(0, 7), more = list.slice(7);
  $('#special').innerHTML = hero + `<div class="dc-wrap fm-body">
    <div class="dc-head"><h2>Câu chuyện người hâm mộ</h2><div class="ln"><a href="#pgMore" data-all>Xem tất cả</a></div></div>
    <div class="fm-bento">${bento.map((a, i) => ovCard(a, i, ' b' + i)).join('')}</div>
    <div id="pgMore" class="fm-more">${moreHtml(more)}</div></div>`;
  wireMore(more);
}

/* ---------- MULTIMEDIA: Video (trình phát nổi bật + danh sách) và Album ảnh (khảm 3 ảnh) ---------- */
const PH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/></svg>';
const PLAY_BIG = '<span class="mv-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span>';
const coverImg = (a, i) => coverOf(a) ? `<img src="${esc(coverOf(a))}" alt="" loading="lazy">` : `<div class="ph p${i % 5 + 1}"></div>`;
const vCard = (a, i) => `<a class="mv-card" href="${href(a)}"><div class="th">${coverImg(a, i)}${PLAY_BIG}<span class="src">${esc(videoSrcName(a))}</span></div><h3>${esc(a.title)}</h3><time>${dmy(a.createdAt)}</time></a>`;
const aCard = (a, i) => { const g = hasGallery(a) ? a.gallery : (coverOf(a) ? [{ src: coverOf(a) }] : []);
  const cells = g.slice(0, 3).map(x => `<img src="${esc(x.src)}" alt="" loading="lazy">`).join('') || `<div class="ph p${i % 5 + 1}"></div>`;
  return `<a class="al-card" href="${href(a)}"><div class="al-m n${Math.min(3, Math.max(1, g.length))}">${cells}<span class="cnt">${PH_ICON}${g.length || 1} ảnh</span></div><h3>${esc(a.title)}</h3><time>${dmy(a.createdAt)}</time></a>`; };
async function renderMediaPage(site, all, id, name) {
  const cfg = pageCfg(site, id), full = secList(all, id);
  const vids = full.filter(a => hasVideo(a) && !hasGallery(a)), albums = full.filter(a => !(hasVideo(a) && !hasGallery(a)));
  $('#special').innerHTML = `<section class="mm-hero">${cfg.banner ? `<div class="bg"${bgStyle(cfg.banner)}></div>` : ''}<div class="dc-wrap"><h1 class="mm-title">${esc(name)}</h1>${cfg.intro ? `<p class="mm-intro">${esc(cfg.intro)}</p>` : ''}
    <div class="mm-tabs"><button type="button" class="on" data-f="">Tất cả <i>${full.length}</i></button><button type="button" data-f="v">Video <i>${vids.length}</i></button><button type="button" data-f="p">Hình ảnh <i>${albums.length}</i></button></div></div></section>
    <div class="dc-wrap mm-body" id="mmBody"></div>`;
  const videoBlock = (list, title) => { if (!list.length) return ''; const top = list[0], pl = list.slice(1, 5);
    return `<section class="mm-sec"><div class="mm-sh"><h2 class="mm-h">${title}</h2><span>${list.length} video</span></div>
      <div class="mm-top"><a class="mm-main" href="${href(top)}">${coverImg(top, 0)}${PLAY_BIG}<span class="src">${esc(videoSrcName(top))}</span><div class="ov-tx">${t2(top.title)}<time>${dmy(top.createdAt)}</time></div></a>
      ${pl.length ? `<div class="mm-pl"><h2>Tiếp theo</h2>${pl.map((a, i) => `<a href="${href(a)}"><div class="th">${coverImg(a, i + 1)}<span class="n">${i + 2}</span>${PLAY_BIG}</div><div><h3>${esc(a.title)}</h3><time>${esc(videoSrcName(a))} · ${dmy(a.createdAt)}</time></div></a>`).join('')}</div>` : ''}</div>
      ${list.length > 5 ? `<div class="mm-grid3">${list.slice(5).map(vCard).join('')}</div>` : ''}</section>`; };
  const albumBlock = (list, title) => list.length ? `<section class="mm-sec"><div class="mm-sh"><h2 class="mm-h">${title}</h2><span>${list.length} album</span></div><div class="mm-grid3">${list.map(aCard).join('')}</div></section>` : '';
  const draw = f => {
    const html = f === 'v' ? videoBlock(vids, 'Video') : f === 'p' ? albumBlock(albums, 'Album ảnh') : videoBlock(vids, 'Video nổi bật') + albumBlock(albums, 'Album ảnh');
    $('#mmBody').innerHTML = html || '<p class="dc-empty">Chưa có nội dung.</p>';
    if (typeof reveal === 'function') reveal();
  };
  document.querySelectorAll('.mm-tabs button').forEach(b => b.onclick = () => { document.querySelectorAll('.mm-tabs button').forEach(x => x.classList.toggle('on', x === b)); draw(b.dataset.f); });
  draw('');
}
