// Quản lý đơn hàng
(function () {
  const root = document.getElementById('orders');
  const ST = { new: 'Mới', confirmed: 'Đã xác nhận', shipping: 'Đang giao', done: 'Hoàn thành', cancelled: 'Đã huỷ' };
  const money = n => new Intl.NumberFormat('vi-VN').format(n || 0) + ' ₫';
  async function load() {
    root.innerHTML = '<p class="hint">Đang tải...</p>';
    let list;
    try { list = await api('/api/admin/orders'); } catch (e) { root.innerHTML = '<p class="err">' + esc(e.message) + '</p>'; return; }
    root.innerHTML = '<div class="bar"><button class="btn ghost sm" id="ordReload">Tải lại</button><span class="hint">' + list.length + ' đơn hàng</span></div>' +
      (list.map(o => `<div class="ord" data-id="${esc(o.id)}">
        <div class="ord-h"><b>${esc(o.code)}</b><span class="meta">${new Date(o.createdAt).toLocaleString('vi-VN')}</span>
          <select data-st>${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <span class="badge">${o.payment === 'bank' ? 'Chuyển khoản' : 'COD'}</span><button class="btn danger sm" data-del style="margin-left:auto">Xoá</button></div>
        <div><b>${esc(o.name)}</b> · <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></div>
        <div class="meta">${esc(o.address)}${o.note ? ' — Ghi chú: ' + esc(o.note) : ''}</div>
        <ul>${o.items.map(i => `<li>${esc(i.name)} × ${i.qty} — ${money(i.price * i.qty)}</li>`).join('')}</ul>
        <div><b>Tổng: ${money(o.total)}</b></div></div>`).join('') || '<p class="hint">Chưa có đơn hàng nào.</p>');
    document.getElementById('ordReload').onclick = load;
  }
  root.addEventListener('change', async e => {
    if (!e.target.matches('[data-st]')) return;
    try { await api('/api/admin/orders/' + e.target.closest('.ord').dataset.id, 'PUT', { status: e.target.value }); } catch (x) { alert(x.message); load(); }
  });
  root.addEventListener('click', async e => {
    if (!e.target.matches('[data-del]') || !confirm('Xoá đơn hàng này?')) return;
    await api('/api/admin/orders/' + e.target.closest('.ord').dataset.id, 'DELETE'); load();
  });
  document.querySelector('.tab[data-tab="orders"]').addEventListener('click', load);
})();
