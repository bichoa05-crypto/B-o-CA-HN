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
const thumb = (a, i) => (a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy">` : `<div class="ph p${i % 5 + 1}"></div>`) + (hasVideo(a) ? ICON_PLAY : '');
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
    $('#plGrid').innerHTML = list.length ? list.map(p => `<article class="pl"><div class="box"><span class="no">${esc(p.number)}</span>${silOr(p.image, p.name)}<h3>${esc(p.name)}</h3></div></article>`).join('') : '<p class="pl-empty">Chưa có cầu thủ ở vị trí này.</p>';
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
