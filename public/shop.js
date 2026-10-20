// Cửa hàng: không bán trực tiếp, khách gửi yêu cầu mua -> CLB xác nhận qua email
(async () => {
  const siteData = await getJSON('/api/site', null);
  const site = siteData && siteData.hero ? siteData : window.DEMO_SITE;
  const s = site.shop || {}, f = site.footer || {};
  const CAT = { ve: 'Vé', ao: 'Áo', bong: 'Bóng', khac: 'Khác' }, ORDER = ['ve', 'ao', 'bong', 'khac'];
  // vé: mỗi trận đang mở bán là một sản phẩm riêng
  const tickets = (site.tournaments || []).filter(m => m.id && m.saleStatus !== 'soon' && !(m.ticketUrl && safeLink(m.ticketUrl) !== '#')).map(m => ({
    id: m.id, category: 've', match: m, price: m.ticketPrice || 0, name: `Vé ${m.homeName} vs ${m.awayName}`,
    description: `${m.name} · ${m.date}${m.time ? ' · ' + m.time : ''}` }));
  const prods = [...tickets, ...(s.products || []).filter(p => p.id !== 'pve').map((p, i) => ({ ...p, id: p.id || 'demo' + i, category: p.category || (/kit|áo/i.test(p.name) ? 'ao' : 'khac') }))]
    .sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));
  const present = ORDER.filter(c => prods.some(p => p.category === c));
  const qs = new URLSearchParams(location.search).get('cat');
  let cat = present.includes(qs) ? qs : 'all';
  const SIZES = p => { const l = String(p.sizes || '').split(/[,;/]+/).map(x => x.trim()).filter(Boolean); return l.length ? l : ['S', 'M', 'L', 'XL', 'XXL']; };
  const logo = (src, n) => src ? `<img src="${esc(src)}" alt="${esc(n)}">` : `<span>${esc(initialsOf(n))}</span>`;
  const pic = p => p.match ? `<div class="tk-pic"><div class="tk-t">${logo(p.match.homeLogo, p.match.homeName)}</div><b>VS</b><div class="tk-t">${logo(p.match.awayLogo, p.match.awayName)}</div><em>${esc(p.match.date)}${p.match.time ? ' · ' + esc(p.match.time) : ''}</em></div>` : p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : catIcon(p.category);
  const price = p => p.price ? money(p.price) : 'Liên hệ báo giá';

  $('#t').textContent = s.title || 'Cửa hàng chính thức';
  $('#sub').textContent = s.subtitle ? s.subtitle + ' – áo đấu và phụ kiện chính hãng, giao tận nơi.' : 'Áo đấu và phụ kiện chính hãng, giao tận nơi.';
  document.title = (s.title || 'Cửa hàng') + ' - CLB Bóng đá Công An Hà Nội';

  // sản phẩm nổi bật ở đầu trang (số 1 = bán chạy nhất)
  const top = prods[0];
  $('#feat').innerHTML = top ? `<div class="ft-card"><span class="ft-badge">Bán chạy nhất</span><div class="ft-pic">${pic(top)}</div>
    <div class="ft-info"><h3>${esc(top.name)}</h3><b>${price(top)}</b><button type="button" class="sh-btn gold sm" data-buy="${esc(top.id)}">Liên hệ mua</button></div></div>` : '';

  const draw = () => {
    const list = cat === 'all' ? prods : prods.filter(p => p.category === cat);
    $('#cats').innerHTML = present.length > 1 ? ['all', ...present].map(c => `<button type="button" class="${c === cat ? 'on' : ''}" data-c="${c}">${c === 'all' ? 'Tất cả' : CAT[c]} <i>${c === 'all' ? prods.length : prods.filter(p => p.category === c).length}</i></button>`).join('') : '';
    $('#count').textContent = list.length ? list.length + ' sản phẩm' : '';
    $('#spGrid').innerHTML = list.length ? list.map((p, i) => `
    <article class="sp rv" id="${esc(p.id)}" style="--d:${(i % 4) * .07}s">
      <button type="button" class="sp-pic" data-buy="${esc(p.id)}" aria-label="Liên hệ mua ${esc(p.name)}"><span class="sp-tag">${CAT[p.category]}</span>${pic(p)}<span class="sp-quick">${p.category === 'ao' ? 'Chọn size' : 'Đặt mua'}</span></button>
      <div class="sp-body">
        <h3>${esc(p.name)}</h3>
        ${p.description ? `<p class="sp-desc">${esc(p.description)}</p>` : ''}
        ${p.category === 'ao' ? `<div class="sp-sizes">${SIZES(p).map(z => `<span>${esc(z)}</span>`).join('')}</div>` : ''}
        <div class="sp-foot"><b class="sp-price">${price(p)}</b><button type="button" class="sp-btn" data-buy="${esc(p.id)}">${p.category === 've' ? 'Đặt vé' : 'Liên hệ mua'}</button></div>
      </div>
    </article>`).join('') : '<p class="empty">Cửa hàng đang cập nhật sản phẩm.</p>';
    reveal();
  };
  $('#cats').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; cat = b.dataset.c; history.replaceState(null, '', cat === 'all' ? 'shop.html' : 'shop.html?cat=' + cat); draw(); });
  draw();

  const phone = String(f.phone || '').split(/[-–,/]/).map(x => x.trim()).filter(Boolean);
  $('#help').innerHTML = (phone.length ? `<a class="sh-btn gold" href="tel:${esc(phone[phone.length - 1].replace(/\s/g, ''))}">Gọi ${esc(phone[phone.length - 1])}</a>` : '') + (f.email ? `<a class="sh-btn line" href="mailto:${esc(f.email)}">${esc(f.email)}</a>` : '');

  /* ---------- khung liên hệ mua ---------- */
  const bm = $('#bm'), form = $('#bmForm');
  let cur = null, size = '', by = 'email', lastFocus = null;
  const SAVE = 'cahn_buyer';
  const total = () => { const q = Math.max(1, Math.min(50, +$('#bmQty').value || 1)); $('#bmTotal').textContent = cur.price ? money(cur.price * q) : 'Báo giá sau'; };
  function open(id) {
    cur = prods.find(p => p.id === id); if (!cur) return;
    lastFocus = document.activeElement;
    const isShirt = cur.category === 'ao'; $('#sizeBox').hidden = !isShirt; document.querySelector('.tg').hidden = !isShirt;
    size = ''; $('#bmPic').innerHTML = pic(cur); $('#bmName').textContent = cur.name; $('#bmPrice').textContent = price(cur);
    $('#bmSizes').innerHTML = !isShirt ? '' : SIZES(cur).map(z => `<button type="button" data-z="${esc(z)}">${esc(z)}</button>`).join('');
    $('#bmQty').value = 1; $('#bmPrint').checked = false; $('#printBox').hidden = true; $('#bmPN').value = $('#bmPNo').value = '';
    $('#bmErr').textContent = ''; $('#sgBox').hidden = true; form.hidden = false; $('#bmDone').hidden = true;
    try { const v = JSON.parse(localStorage.getItem(SAVE)) || {}; ['fName', 'fPhone', 'fEmail', 'fAddr'].forEach(k => { if (v[k] && !$('#' + k).value) $('#' + k).value = v[k]; }); } catch {}
    total(); bm.hidden = false; document.body.style.overflow = 'hidden';
    setTimeout(() => ($('#bmSizes button') || $('#fName')).focus(), 50);
  }
  function close() { bm.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-buy]'); if (b) open(b.dataset.buy); });
  $('#bmX').onclick = close;
  bm.addEventListener('click', e => { if (e.target === bm) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !bm.hidden) close(); });
  $('#bmSizes').onclick = e => { const b = e.target.closest('[data-z]'); if (!b) return; size = b.dataset.z; [...$('#bmSizes').children].forEach(x => x.classList.toggle('on', x === b)); $('#bmErr').textContent = ''; };
  $('#fBy').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; by = b.dataset.v; [...$('#fBy').children].forEach(x => x.classList.toggle('on', x === b)); };
  document.querySelectorAll('.qty [data-q]').forEach(b => b.onclick = () => { const i = $('#bmQty'); i.value = Math.max(1, Math.min(50, (+i.value || 1) + +b.dataset.q)); total(); });
  $('#bmQty').oninput = total;
  $('#bmPrint').onchange = e => { $('#printBox').hidden = !e.target.checked; };
  $('#bmPNo').oninput = e => { e.target.value = e.target.value.replace(/\D/g, ''); };
  $('#sizeGuide').onclick = e => { e.preventDefault(); $('#sgBox').hidden = !$('#sgBox').hidden; };

  form.onsubmit = async e => {
    e.preventDefault();
    const err = m => { $('#bmErr').textContent = m; };
    const v = { fName: $('#fName').value.trim(), fPhone: $('#fPhone').value.trim(), fEmail: $('#fEmail').value.trim(), fAddr: $('#fAddr').value.trim() };
    if (cur.category === 'ao' && !size) return err('Vui lòng chọn size.');
    if (v.fName.length < 2) return err('Vui lòng nhập họ tên.'), $('#fName').focus();
    if (!/^[0-9+\s().-]{8,16}$/.test(v.fPhone)) return err('Số điện thoại chưa đúng.'), $('#fPhone').focus();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.fEmail)) return err('Email chưa đúng – CLB cần email để gửi xác nhận.'), $('#fEmail').focus();
    const btn = $('#bmSend'); btn.disabled = true; btn.textContent = 'Đang gửi…';
    try {
      const r = await fetch('/api/shop/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        items: [{ id: cur.id, size: cur.category === 'ao' ? size : '', qty: +$('#bmQty').value || 1, printName: $('#bmPrint').checked ? $('#bmPN').value : '', printNumber: $('#bmPrint').checked ? $('#bmPNo').value : '' }],
        name: v.fName, phone: v.fPhone, email: v.fEmail, address: v.fAddr, note: $('#fNote').value, contactBy: by }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Chưa gửi được, vui lòng thử lại.');
      try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch {}
      form.hidden = true;
      $('#bmDone').innerHTML = `<div class="ok-ic"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
        <h2>Đã gửi yêu cầu!</h2>
        <p class="code">Mã yêu cầu <b>${esc(d.code)}</b></p>
        <p>${d.emailSent ? `Chúng tôi vừa gửi email xác nhận đã nhận yêu cầu tới <b>${esc(d.email)}</b> (kiểm tra cả mục Spam nhé).` : `Cửa hàng đã nhận yêu cầu và sẽ liên hệ với bạn qua <b>${esc(d.email)}</b> hoặc số điện thoại đã để lại.`}</p>
        <ol class="next"><li class="done">Gửi yêu cầu</li><li>Email xác nhận đơn &amp; hướng dẫn thanh toán (trong 24h)</li><li>Thanh toán &amp; nhận áo</li></ol>
        <button type="button" class="bm-send" id="bmBack">Tiếp tục xem sản phẩm</button>`;
      $('#bmDone').hidden = false; $('#bmBack').onclick = close;
    } catch (x) { err(x.message); }
    finally { btn.disabled = false; btn.textContent = 'Gửi yêu cầu mua hàng'; }
  };

  // mở từ trang chủ (shop.html#ma-san-pham): cuộn tới và mở khung liên hệ
  if (location.hash.length > 1) {
    const id = decodeURIComponent(location.hash.slice(1)), el = document.getElementById(id);
    if (!el && prods.some(p => p.id === id)) { const pp = prods.find(p => p.id === id); cat = present.includes(pp.category) ? pp.category : 'all'; draw(); }
    const el2 = document.getElementById(id);
    if (el2 && prods.some(p => p.id === id)) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(() => open(id), 500); }
  }
})();
