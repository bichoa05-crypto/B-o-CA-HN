/* Header, chân trang, đăng nhập: dùng chung cho mọi trang */
(function () {
  const SECS = [['ve-chung-toi', 'Về chúng tôi'], ['dong-chay', 'Dòng chảy'], ['doi-hinh', 'Đội hình'], ['lan-bong', 'Lăn bóng'], ['ben-le-san-co', 'Bên lề sân cỏ'], ['nguoi-ham-mo', 'Người hâm mộ'], ['multimedia', 'Multimedia']];
  const cur = new URLSearchParams(location.search).get('s');
  const onSection = /section\.html$/.test(location.pathname) ? cur : '';
  const arrowR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';
  const header = `
<header class="site-header" id="header">
  <a class="brand" href="index.html" aria-label="Báo Công an Hà Nội - Trang chủ"><img src="assets/logo.png" alt=""></a>
  <nav class="nav" id="nav" aria-label="Chuyên mục">
    <a class="home-link" href="index.html" aria-label="Trang chủ" title="Trang chủ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-6h4v6"/></svg><span class="home-txt">Trang chủ</span></a>
    ${SECS.map(([id, n]) => `<a href="section.html?s=${id}" data-sec="${id}" class="${onSection === id ? 'on' : ''}">${n}</a>`).join('')}
  </nav>
  <div class="actions">
    <button class="icon-btn" id="searchBtn" aria-label="Tìm kiếm" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    </button>
    <a class="icon-btn cart-btn" href="cart.html" aria-label="Giỏ hàng" title="Giỏ hàng">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.5l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg><b class="badge-n" id="cartN" hidden>0</b>
    </a>
    <a class="pill outline" href="shop.html">Cửa hàng</a>
    <div class="acct" id="acct">
      <button class="pill solid" id="acctBtn" aria-haspopup="true" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.5"/><path d="M3.5 21c.6-4.4 4-7 8.5-7s7.9 2.6 8.5 7z"/></svg><span id="acctLabel">Tài khoản</span>
      </button>
      <div class="menu" id="acctMenu" hidden>
        <div class="who" id="acctWho"></div>
        <a href="admin.html" id="acctAdmin" hidden>Quản lý bài viết, ảnh, video, đơn hàng</a>
        <button id="acctOut">Đăng xuất</button>
      </div>
    </div>
    <button class="icon-btn burger" id="burger" aria-label="Mở menu" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</header>
<form class="search-bar" id="searchBar" role="search" action="search.html" method="get">
  <label class="sr" for="q">Tìm kiếm</label>
  <input id="q" name="q" type="search" placeholder="Tìm bài viết theo từ khoá..." autocomplete="off" minlength="2" required>
  <button type="submit">Tìm</button>
</form>`;
  const social = {
    facebook: ['Facebook', '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>', '0 0 24 24'],
    youtube: ['YouTube', '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>', '0 0 24 24'],
    tiktok: ['TikTok', '<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>', '0 0 24 24'],
    zalo: ['Zalo', '<path d="M24 4C12.4 4 4 11.9 4 21.7c0 5.6 2.8 10.4 7.2 13.5L9.5 43l7.6-4.1c2.2.6 4.5.9 6.9.9 11.6 0 20-7.9 20-17.7S35.6 4 24 4z"/><text x="24" y="27" text-anchor="middle" font-family="Be Vietnam Pro,Arial,sans-serif" font-weight="800" font-size="13" fill="#1d0203">Zalo</text>', '0 0 48 48'],
  };
  const F0 = { about: 'Cơ quan ngôn luận của Công an thành phố Hà Nội. Thông tin nhanh, chính xác, vì một Thủ đô bình yên.', address: 'Thành phố Hà Nội', phone: '', email: '', facebook: '', youtube: '', tiktok: '', zalo: '' };
  const footer = f => `
<footer class="footer" id="lien-he">
  <div class="foot-grid">
    <div>
      <div class="foot-brand"><img src="assets/logo.png" alt=""><strong>Báo Công an<br>Hà Nội</strong></div>
      <p>${esc(f.about)}</p>
    </div>
    <div><h4>Chuyên mục</h4><ul>${SECS.map(([id, n]) => `<li><a href="section.html?s=${id}" data-sec="${id}">${n}</a></li>`).join('')}</ul></div>
    <div><h4>Liên hệ</h4><ul><li>${esc(f.address)}</li>${f.phone ? `<li>Điện thoại: <a href="tel:${esc(f.phone.replace(/[^\d+]/g, ''))}">${esc(f.phone)}</a></li>` : ''}${f.email ? `<li>Email: <a href="mailto:${esc(f.email)}">${esc(f.email)}</a></li>` : ''}</ul></div>
    <div><h4>Cộng đồng</h4>
      <div class="social">${Object.entries(social).map(([k, [n, path, vb]]) => { const u = safeLink(f[k]); const on = f[k] && u !== '#'; return `<a ${on ? `href="${esc(u)}" target="_blank" rel="noopener"` : 'class="off" aria-disabled="true" tabindex="-1"'} aria-label="${n}" title="${n}${on ? '' : ' (chưa cập nhật)'}"><svg viewBox="${vb}" aria-hidden="true">${path}</svg></a>`; }).join('')}</div>
    </div>
  </div>
  <p class="copy">© 2026 Báo Công an Hà Nội. Mọi quyền được bảo lưu.</p>
</footer>`;
  const modal = `
<div class="modal" id="authModal" hidden role="dialog" aria-modal="true" aria-labelledby="authTitle">
  <div class="modal-box">
    <button class="modal-x" id="authClose" aria-label="Đóng">×</button>
    <img src="assets/logo.png" alt="" class="modal-logo">
    <h2 id="authTitle">Tài khoản</h2>
    <div class="seg" role="tablist"><button type="button" class="on" data-mode="login">Đăng nhập</button><button type="button" data-mode="register">Đăng ký</button></div>
    <form id="authForm" novalidate>
      <label class="f-name" hidden>Họ và tên<input id="aName" autocomplete="name"></label>
      <label>Email hoặc tên đăng nhập<input id="aUser" autocomplete="username" required></label>
      <label>Mật khẩu<input id="aPass" type="password" autocomplete="current-password" required></label>
      <p class="auth-err" id="authErr" role="alert"></p>
      <button class="pill solid wide" id="authSubmit">Đăng nhập</button>
    </form>
  </div>
</div>`;
  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', footer(F0) + modal);
  // cập nhật chân trang + tên chuyên mục từ máy chủ
  fetch('/api/site').then(r => r.ok ? r.json() : null).then(s => { if (s && s.footer) { document.getElementById('lien-he').outerHTML = footer({ ...F0, ...s.footer }); } }).catch(() => {});
  fetch('/api/sections').then(r => r.ok ? r.json() : null).then(list => { if (Array.isArray(list)) list.forEach(x => document.querySelectorAll('[data-sec="' + x.id + '"]').forEach(a => { a.textContent = x.name; })); }).catch(() => {});
})();

/* ---------- header ---------- */
const header = $('#header'), nav = $('#nav'), burger = $('#burger');
const solidAlways = document.body.dataset.header === 'solid';
const onScroll = () => header.classList.toggle('solid', solidAlways || scrollY > 40);
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
function cartBadge() { const n = cart.count(), b = $('#cartN'); b.hidden = !n; b.textContent = n > 99 ? '99+' : n; }
cartBadge(); document.addEventListener('cart', cartBadge); addEventListener('storage', cartBadge);
const rvIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } }), { threshold: .1 });
const reveal = () => document.querySelectorAll('.rv:not(.in)').forEach(el => rvIO.observe(el));

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
  document.dispatchEvent(new CustomEvent('me', { detail: me }));
}
$('#acctBtn').onclick = () => {
  if (!me.role) return openAuth('login');
  menu.hidden = !menu.hidden; $('#acctBtn').setAttribute('aria-expanded', !menu.hidden);
};
document.addEventListener('click', e => { if (!e.target.closest('#acct')) menu.hidden = true; });
$('#acctOut').onclick = async () => { await fetch('/api/logout', { method: 'POST' }); await refreshMe(); };
refreshMe();
