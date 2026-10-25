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
const hasGallery = a => Array.isArray(a.gallery) && a.gallery.length > 0;
const ytId = u => { const m = String(u || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/); return m ? m[1] : ''; };
// ảnh đại diện: ảnh bìa > ảnh đầu chùm ảnh > ảnh YouTube tự lấy
const coverOf = a => a.image || (hasGallery(a) ? a.gallery[0].src : '') || (ytId(a.videoUrl) ? `https://i.ytimg.com/vi/${ytId(a.videoUrl)}/hqdefault.jpg` : '');
const videoSrcName = a => a.video ? 'Video' : /facebook|fb\.watch/.test(a.videoUrl) ? 'Facebook' : /drive\.google|docs\.google/.test(a.videoUrl) ? 'Google Drive' : /tiktok/.test(a.videoUrl) ? 'TikTok' : /vimeo/.test(a.videoUrl) ? 'Vimeo' : 'YouTube';
function videoBlock(a) {
  if (a.video) return `<div class="vbox"><video src="${esc(a.video)}" controls controlsList="nodownload noplaybackrate" disablepictureinpicture poster="${esc(a.image || '')}"></video></div>`;
  const e = embedVideo(a.videoUrl); if (!e) return '';
  return `<div class="vbox${e.tall ? ' tall' : ''}"><iframe src="${esc(e.src)}" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
}
const ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const ICON_LONG = '<svg class="feat-arrow" viewBox="0 0 70 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9h64M58 2l8 7-8 7"/></svg>';
const ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';
const ICON_PLAY = '<span style="position:absolute;inset:0;margin:auto;width:56px;height:56px;border-radius:50%;background:#fff;color:#c8201a;display:grid;place-items:center;box-shadow:0 0 0 7px #ffffff3d;z-index:2"><svg viewBox="0 0 24 24" width="22" fill="currentColor" style="margin-left:3px"><path d="M7 4.5v15l13-7.5z"/></svg></span>';
const TICKET = '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M6 14h52a2 2 0 0 1 2 2v9a7 7 0 0 0 0 14v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a7 7 0 0 0 0-14v-9a2 2 0 0 1 2-2zm38 6v6h4v-6h-4zm0 12v4h4v-4h-4zm0 10v6h4v-6h-4z"/></svg>';
const BALL = '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 4a28 28 0 1 0 0 56 28 28 0 0 0 0-56zm0 7 9 6.5-3.4 10.5H26.4L23 17.5 32 11zM14 24l7 2.6 1.2 11.2-6.5 5A21 21 0 0 1 14 24zm36 0a21 21 0 0 1-1.7 19.8l-6.5-5L43 26.6 50 24zM27 44h10l3.2 8.3a21 21 0 0 1-16.4 0L27 44z"/></svg>';
const catIcon = c => c === 've' ? TICKET : c === 'bong' ? BALL : SHIRT;
const SHIRT = '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M22 6 8 12 2 26l9 4 3-5v33h36V25l3 5 9-4-6-14-14-6c-1 4-5 7-10 7s-9-3-10-7z"/></svg>';
const money = n => new Intl.NumberFormat('vi-VN').format(n || 0) + ' ₫';
const CART_KEY = 'cahn_cart';
const cart = {
  get() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } },
  set(v) { try { localStorage.setItem(CART_KEY, JSON.stringify(v)); } catch {} document.dispatchEvent(new Event('cart')); },
  add(id, q = 1) { const c = this.get(), x = c.find(i => i.id === id); x ? x.qty = Math.min(99, x.qty + q) : c.push({ id, qty: q }); this.set(c); },
  count() { return this.get().reduce((t, i) => t + i.qty, 0); },
};
async function getJSON(url, fallback) { try { const r = await fetch(url); if (!r.ok) throw 0; return await r.json(); } catch { return fallback; } }
const demoOr = (list) => (Array.isArray(list) && list.length ? list : (window.DEMO_ARTICLES || []));

/* ---------- thành tích ---------- */
// huy chương: dây vải 2 màu + đĩa kim loại ánh sáng, viền khía, số thứ hạng nổi
const MEDAL = {
  champion: { hi: '#fff6c4', mid: '#f4c84a', lo: '#b9810e', edge: '#8d5f05', txt: '#7a4d00', n: '1' },
  runner: { hi: '#ffffff', mid: '#d5d7de', lo: '#8e929d', edge: '#6b6f7a', txt: '#4c505a', n: '2' },
  third: { hi: '#ffe1c8', mid: '#d9935f', lo: '#9a5528', edge: '#73401c', txt: '#5c2f10', n: '3' },
};
const medal = r => { const k = MEDAL[r] ? r : 'champion', m = MEDAL[k], id = 'md-' + k;
  const teeth = Array.from({ length: 24 }, (_, i) => { const t = i / 24 * Math.PI * 2, R = i % 2 ? 19 : 20.6; return (i ? 'L' : 'M') + (24 + R * Math.cos(t)).toFixed(2) + ' ' + (22 + R * Math.sin(t)).toFixed(2); }).join('') + 'Z';
  return `<svg class="medal" viewBox="0 0 48 56" aria-hidden="true">
  <defs><radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${m.hi}"/><stop offset=".5" stop-color="${m.mid}"/><stop offset="1" stop-color="${m.lo}"/></radialGradient></defs>
  <path d="M13 34 8 52l5-3 4 4 6-17z" fill="#c8201a"/><path d="M35 34l5 18-5-3-4 4-6-17z" fill="#c8201a"/>
  <path d="M13 34l-2.6 9.6 3 .8 2.5-9z M35 34l2.6 9.6-3 .8-2.5-9z" fill="#8b0706" opacity=".55"/>
  <path d="${teeth}" fill="${m.lo}"/>
  <circle cx="24" cy="22" r="17.6" fill="url(#${id})"/>
  <circle cx="24" cy="22" r="12.6" fill="none" stroke="${m.lo}" stroke-opacity=".6" stroke-width="1.1"/>
  <circle cx="24" cy="22" r="11.4" fill="url(#${id})" stroke="${m.hi}" stroke-width=".8"/>
  <path d="M11 17a14 14 0 0 1 18-9" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>
  <text x="24.6" y="28.4" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="16" fill="${m.edge}" opacity=".55">${m.n}</text>
  <text x="24" y="27.6" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="16" fill="${m.hi}">${m.n}</text></svg>`; };
const LABEL = { champion: 'Vô địch', runner: 'Á quân', third: 'Hạng ba' };
const period = y => { const n = parseInt(y, 10) || 0; return n < 1990 ? 0 : n < 2010 ? 1 : 2; };
let honors = [], hPeriod = 0;
function drawHonors() {
  const sel = $('#hSel').value;
  const rows = honors.filter(h => period(h.year) === hPeriod && (!sel || h.name === sel));
  $('#hRows').innerHTML = rows.length ? rows.map(h => `<a class="h-row" href="about.html#danh-hieu">${medal(h.result)}<span class="y">${esc(h.year)}</span><span class="n">${esc(h.name)}</span><span class="badge ${h.result}">${LABEL[h.result] || ''}</span>${ICON_CHEV}</a>`).join('') : '<p class="h-empty">Chưa có dữ liệu trong giai đoạn này.</p>';
}
function renderHonors(h) {
  honors = h.items; $('#hTitle').textContent = h.title;
  const hb = !h.banner || /photo-Qjz2Rel23TNlSB9kIRy9Z2pIcuHNsA/.test(h.banner) ? 'assets/honors-banner.jpg' : h.banner; // ảnh cũ còn logo cũ -> dùng bản đã thay logo mới
  $('#hBanner').insertAdjacentHTML('afterbegin', `<img src="${esc(hb)}" alt="">`);
  $('#hSel').innerHTML = '<option value="">Tất cả giải đấu</option>' + [...new Set(honors.map(x => x.name))].map(n => `<option>${esc(n)}</option>`).join('');
  $('#hSel').onchange = drawHonors;
  document.querySelectorAll('.h-per button').forEach(b => b.onclick = () => { hPeriod = +b.dataset.p; document.querySelectorAll('.h-per button').forEach(x => x.classList.toggle('on', x === b)); drawHonors(); });
  drawHonors();
}

const buyHref = m => m.ticketUrl && safeLink(m.ticketUrl) !== '#' ? safeLink(m.ticketUrl) : 'shop.html?cat=ve' + (m.id ? '#' + encodeURIComponent(m.id) : '');
const buyBtn = (m, cls = 'm-buy') => m.saleStatus === 'soon' ? `<span class="${cls} off">Sắp mở bán</span>` : `<a class="${cls}" href="${esc(buyHref(m))}" ${/^https?:/i.test(buyHref(m)) ? 'target="_blank" rel="noopener"' : ''}>Đã mở bán</a>`;
const initialsOf = s => String(s || '').split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
const POS_NAME = { gk: 'Thủ môn', df: 'Hậu vệ', mf: 'Tiền vệ', fw: 'Tiền đạo' };

// thẻ trận đấu dùng chung (trang chủ, Lăn bóng, Cửa hàng) – cùng một thiết kế
const matchLogo = (src, n) => src ? `<img class="m-logo" src="${esc(src)}" alt="">` : `<span class="m-logo">${esc(initialsOf(n))}</span>`;
function matchCard(m, i = 0, btn) {
  return `<div class="m-col rv ${i === 0 ? 'on' : ''}" style="--d:${i * .08}s">
      <div class="m-tab">${esc(m.name)}</div>
      <div class="m-card">
        <div class="m-teams">
          <div class="m-team">${matchLogo(m.homeLogo, m.homeName)}<div class="m-name">${esc(m.homeName)}</div></div>
          <div class="m-vs">VS</div>
          <div class="m-team">${matchLogo(m.awayLogo, m.awayName)}<div class="m-name">${esc(m.awayName)}</div></div>
        </div>
        <div class="m-when">${esc(m.date)}<i></i>${esc(m.time)}</div>
        ${btn || buyBtn(m)}
      </div></div>`;
}
function matchHover(root) { const cols = [...(root || document).querySelectorAll('.m-col')]; cols.forEach(c => c.addEventListener('mouseenter', () => cols.forEach(x => x.classList.toggle('on', x === c)))); }
