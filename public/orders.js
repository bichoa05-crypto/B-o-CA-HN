// Quản lý đơn hàng
(function () {
  const root = document.getElementById('orders');
  const ST = { new: 'Mới', confirmed: 'Đã xác nhận', shipping: 'Đang giao', done: 'Hoàn thành', cancelled: 'Đã huỷ' };
  const MAILS = { received: 'đã nhận yêu cầu', confirmed: 'xác nhận đơn', shipping: 'đang giao', cancelled: 'huỷ đơn' };
  const BY = { email: 'Email', phone: 'Điện thoại', zalo: 'Zalo' };
  let mailReady = null;
  const money = n => new Intl.NumberFormat('vi-VN').format(n || 0) + ' ₫';
  async function load() {
    root.innerHTML = '<p class="hint">Đang tải...</p>';
    let list;
    try { list = await api('/api/admin/orders'); if (mailReady === null) mailReady = !!(await api('/api/config')).mail; } catch (e) { root.innerHTML = '<p class="err">' + esc(e.message) + '</p>'; return; }
    root.innerHTML = '<div class="bar"><button class="btn ghost sm" id="ordReload">Tải lại</button><span class="hint">' + list.length + ' đơn hàng / yêu cầu mua</span></div>' +
      (mailReady ? '<p class="hint" style="margin:0 0 12px">✉️ Đổi trạng thái sang <b>Đã xác nhận</b>, <b>Đang giao</b> hoặc <b>Đã huỷ</b> sẽ tự gửi email cho khách.</p>' : '<p class="err" style="margin:0 0 12px">Chưa cấu hình gửi email (SMTP_HOST, SMTP_USER, SMTP_PASS trên Vercel) nên khách chưa nhận được email tự động – hãy liên hệ khách bằng điện thoại/email bên dưới.</p>') +
      (list.map(o => `<div class="ord" data-id="${esc(o.id)}">
        <div class="ord-h"><b>${esc(o.code)}</b><span class="meta">${new Date(o.createdAt).toLocaleString('vi-VN')}</span>
          <select data-st>${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <span class="badge">${o.kind === 'request' ? 'Yêu cầu mua · liên hệ qua ' + (BY[o.contactBy] || 'Email') : o.payment === 'bank' ? 'Chuyển khoản' : 'COD'}</span><button class="btn danger sm" data-del style="margin-left:auto">Xoá</button></div>
        <div><b>${esc(o.name)}</b> · <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>${o.email ? ` · <a href="mailto:${esc(o.email)}?subject=${encodeURIComponent('Đơn hàng ' + o.code)}">${esc(o.email)}</a>` : ''}</div>
        <div class="meta">${esc(o.address)}${o.note ? ' — Ghi chú: ' + esc(o.note) : ''}</div>
        <ul>${o.items.map(i => `<li>${esc(i.name)}${i.size ? ' · size <b>' + esc(i.size) + '</b>' : ''} × ${i.qty}${i.printName || i.printNumber ? ' · in: <b>' + esc(i.printName || '') + ' ' + esc(i.printNumber || '') + '</b>' : ''} — ${i.price ? money(i.price * i.qty) : 'liên hệ'}</li>`).join('')}</ul>
        <div><b>Tổng: ${o.total ? money(o.total) : 'báo giá sau'}</b></div>${(o.mails || []).length ? `<div class="meta">✉️ Đã gửi email: ${o.mails.map(m => (MAILS[m.type] || m.type) + ' (' + new Date(m.at).toLocaleString('vi-VN') + ')').join(', ')}</div>` : ''}</div>`).join('') || '<p class="hint">Chưa có đơn hàng nào.</p>');
    document.getElementById('ordReload').onclick = load;
  }
  root.addEventListener('change', async e => {
    if (!e.target.matches('[data-st]')) return;
    try { const r = await api('/api/admin/orders/' + e.target.closest('.ord').dataset.id, 'PUT', { status: e.target.value }); if (r.mailed) { alert('Đã gửi email thông báo cho khách.'); load(); } } catch (x) { alert(x.message); load(); }
  });
  root.addEventListener('click', async e => {
    if (!e.target.matches('[data-del]') || !confirm('Xoá đơn hàng này?')) return;
    await api('/api/admin/orders/' + e.target.closest('.ord').dataset.id, 'DELETE'); load();
  });
  document.querySelector('.tab[data-tab="orders"]').addEventListener('click', load);
})();
