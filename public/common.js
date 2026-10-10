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
