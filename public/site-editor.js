// Trình chỉnh sửa nội dung trang chủ (dựa trên sơ đồ trường)
(function () {
  const IMG = (k, label, ratio) => ({ k, label, t: 'photo', ratio });
  const LOGO = (k, label) => ({ k, label, t: 'logo' });
  const TXT = (k, label, full) => ({ k, label, t: 'text', full });
  const NUM = (k, label) => ({ k, label, t: 'number' });
  const AREA = (k, label, rows) => ({ k, label, t: 'area', full: true, rows });
  const SCHEMA = [
    { key: 'hero', title: '1. Banner đầu trang', type: 'list', itemName: 'Slide', titleOf: o => o.line2 || o.line1 || 'Slide', blank: { image: '', line1: '', line2: '', button: 'Đọc bài viết', link: '#dong-chay' },
      hint: 'Ảnh nền nên ngang, tỉ lệ 16:9. Có thể thêm nhiều slide, tự chuyển sau vài giây.',
      fields: [IMG('image', 'Ảnh nền', '16:9'), TXT('line1', 'Dòng tiêu đề 1 (chữ mảnh)'), TXT('line2', 'Dòng tiêu đề 2 (chữ đậm)'), TXT('button', 'Chữ trên nút'), TXT('link', 'Link của nút (vd #dong-chay hoặc https://...)')] },
    { key: 'tournaments', title: '2. Giải đấu (4 cột trận sắp tới)', type: 'list', itemName: 'Giải đấu', titleOf: o => o.name || 'Giải đấu', blank: { name: '', homeName: 'Công an Hà Nội', homeLogo: '', awayName: '', awayLogo: '', date: '', time: '', ticketUrl: '#' },
      hint: 'Logo đội nên là ảnh PNG nền trong suốt, hình vuông.',
      fields: [TXT('name', 'Tên giải đấu', true), TXT('homeName', 'Đội nhà'), LOGO('homeLogo', 'Logo đội nhà'), TXT('awayName', 'Đội khách'), LOGO('awayLogo', 'Logo đội khách'), TXT('date', 'Ngày (vd 18/10)'), TXT('time', 'Giờ (vd 19:15)'), TXT('ticketUrl', 'Link mua vé', true)] },
    { key: 'intro', title: '3. Dòng chữ lớn "Since 1956"', type: 'object', fields: [TXT('line1', 'Dòng 1'), TXT('line2', 'Dòng 2')] },
    { key: 'squad', title: '4. Đội hình', type: 'list', itemName: 'Cầu thủ', titleOf: o => (o.number ? '#' + o.number + ' ' : '') + (o.name || 'Cầu thủ'), blank: { name: '', number: '', image: '' },
      hint: 'Ảnh cầu thủ nên là ảnh PNG đã tách nền (nửa người), dọc.',
      fields: [TXT('name', 'Tên cầu thủ'), TXT('number', 'Số áo'), LOGO('image', 'Ảnh cầu thủ (PNG tách nền)')] },
    { key: 'multimedia', title: '5. Banner Multimedia', type: 'object', fields: [IMG('image', 'Ảnh nền', '1.45:1'), TXT('button', 'Chữ nút vàng'), TXT('link', 'Link nút')] },
    { key: 'shop', title: '6. Cửa hàng chính thức', type: 'object', fields: [TXT('title', 'Tiêu đề'), TXT('subtitle', 'Dòng phụ')],
      sub: { key: 'products', title: 'Sản phẩm (thứ tự: số 1 là bán chạy nhất)', itemName: 'Sản phẩm', titleOf: o => o.name || 'Sản phẩm', blank: { name: '', price: 0, description: '', image: '' },
        fields: [TXT('name', 'Tên sản phẩm', true), NUM('price', 'Giá bán (VNĐ)'), AREA('description', 'Mô tả ngắn'), LOGO('image', 'Ảnh sản phẩm (PNG tách nền)')] } },
    { key: 'honors', title: '7. Thành tích (Công an Hà Nội FC)', type: 'object', fields: [TXT('title', 'Tiêu đề lớn'), IMG('banner', 'Ảnh banner (cúp, cờ...)', '3:1')],
      sub: { key: 'items', title: 'Danh sách thành tích', itemName: 'Thành tích', titleOf: o => o.year + ' · ' + o.name, blank: { year: '', name: '', result: 'champion' },
        fields: [TXT('year', 'Năm (vd 1962 hoặc 1981-1982)'), TXT('name', 'Tên giải'), { k: 'result', label: 'Thành tích', t: 'select', opts: [['champion', 'Vô địch'], ['runner', 'Á quân'], ['third', 'Hạng ba']] }] } },
    { key: 'footer', title: '9. Chân trang & liên kết mạng xã hội', type: 'object', fields: [TXT('brand', 'Tên hiển thị cạnh logo', true), AREA('licenses', 'Giấy phép (mỗi dòng một ý)'), TXT('address', 'Địa chỉ', true), TXT('phone', 'Hotline'), TXT('email', 'Email'), TXT('copyright', 'Dòng bản quyền', true), TXT('facebook', 'Link Facebook của CLB'), TXT('youtube', 'Link YouTube'), TXT('instagram', 'Link Instagram'), TXT('tiktok', 'Link TikTok'), TXT('zalo', 'Link Zalo'), AREA('bank', 'Thông tin chuyển khoản (hiện sau khi khách chọn thanh toán chuyển khoản)')] },
    { key: 'sponsors', title: '8. Nhà tài trợ (bấm logo sẽ mở website của nhà tài trợ)', type: 'list', itemName: 'Nhà tài trợ', titleOf: o => o.name || 'Nhà tài trợ', blank: { name: '', image: '', url: '' },
      hint: 'Logo sẽ tự chuyển thành màu trắng. Dùng PNG/SVG nền trong suốt.',
      fields: [TXT('name', 'Tên'), LOGO('image', 'Logo'), TXT('url', 'Link website', true)] },
    { key: 'about', title: '10. Trang "Về chúng tôi" – đầu trang & giới thiệu', type: 'object', fields: [AREA('heroSub', 'Câu giới thiệu dưới tiêu đề', 2), AREA('intro', 'Bài giới thiệu (mỗi đoạn một dòng; hiện 2 đoạn đầu, còn lại bấm "Đọc tiếp")', 12), AREA('trophiesIntro', 'Đoạn dẫn phần Danh hiệu', 3)],
      sub: { key: 'facts', title: 'Các con số nổi bật (tối đa 6)', itemName: 'Con số', titleOf: o => (o.num || '') + ' ' + (o.label || ''), blank: { num: '', label: '' }, fields: [TXT('num', 'Con số (vd 1956)'), TXT('label', 'Nhãn (vd Thành lập 10/10)')] } },
    { root: 'about', key: 'trophies', title: '11. Trang "Về chúng tôi" – Danh hiệu (lướt xem)', type: 'list', itemName: 'Danh hiệu', titleOf: o => o.year + ' · ' + o.name, blank: { year: '', name: '', result: 'champion' },
      fields: [TXT('year', 'Năm (vd 1962 hoặc 1981-1982)'), TXT('name', 'Tên giải'), { k: 'result', label: 'Thành tích', t: 'select', opts: [['champion', 'Vô địch (cúp vàng)'], ['runner', 'Á quân (cúp bạc)'], ['third', 'Hạng ba (cúp đồng)']] }] },
    { root: 'about', key: 'history', title: '12. Trang "Về chúng tôi" – Lịch sử (các mốc)', type: 'list', itemName: 'Mốc lịch sử', titleOf: o => o.title || 'Mốc lịch sử', blank: { title: '', when: '', body: '' },
      hint: 'Mỗi dòng trong nội dung là một đoạn văn. Đặt **chữ** trong hai dấu sao để in đậm.',
      fields: [TXT('title', 'Tiêu đề mốc', true), TXT('when', 'Thời gian (vd 1956 – 2002)', true), AREA('body', 'Nội dung', 10)] },
    { root: 'about', key: 'leaders', title: '13. Trang "Về chúng tôi" – Ban lãnh đạo', type: 'list', itemName: 'Lãnh đạo', titleOf: o => o.name || 'Lãnh đạo', blank: { role: '', name: '', note: '', image: '' },
      hint: 'Ảnh chân dung không bắt buộc (nên vuông); nếu để trống sẽ hiện chữ cái đầu tên.',
      fields: [TXT('role', 'Chức danh (vd Chủ tịch CLB)'), TXT('name', 'Họ tên kèm cấp bậc'), TXT('note', 'Đơn vị / chức vụ khác', true), IMG('image', 'Ảnh chân dung', '1:1')] },
    { root: 'about', key: 'stadium', title: '14. Trang "Về chúng tôi" – Sân nhà', type: 'object', fields: [TXT('name', 'Tên sân'), TXT('capacity', 'Sức chứa (vd 19.500 người)'), TXT('address', 'Địa chỉ đầy đủ', true), TXT('tag', 'Dòng địa chỉ ngắn đè trên ảnh', true), TXT('mapQuery', 'Từ khoá tìm trên Google Maps', true), IMG('image', 'Ảnh sân (để trống sẽ hiện hình sân vẽ sẵn)', '2:1')] },
  ];

  const root = document.getElementById('site');
  let data = null;
  const h = (tag, attrs = {}, ...kids) => { const el = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) k === 'class' ? el.className = v : k.startsWith('on') ? el[k] = v : el.setAttribute(k, v); kids.flat().forEach(c => el.append(c.nodeType ? c : document.createTextNode(c))); return el; };

  function imageField(obj, f, onChange) {
    const wrap = h('div', { class: 'imgf' });
    const prev = h('img', { alt: '' });
    const file = h('input', { type: 'file', accept: 'image/*', hidden: '' });
    const pick = h('button', { type: 'button', class: 'btn ghost sm' }, f.t === 'photo' ? 'Chọn ảnh & chỉnh sửa' : 'Tải ảnh lên');
    const edit = h('button', { type: 'button', class: 'btn ghost sm' }, 'Chỉnh lại');
    const del = h('button', { type: 'button', class: 'btn danger sm' }, 'Gỡ ảnh');
    const msg = h('span', { class: 'hint' });
    const sync = () => { prev.hidden = !obj[f.k]; if (obj[f.k]) prev.src = obj[f.k]; edit.hidden = f.t !== 'photo' || !obj[f.k]; del.hidden = !obj[f.k]; };
    const set = url => { obj[f.k] = url; sync(); onChange && onChange(); };
    pick.onclick = () => file.click();
    file.onchange = async () => {
      const fl = file.files[0]; file.value = ''; if (!fl) return;
      if (f.t === 'photo') return openEditor(URL.createObjectURL(fl), f.ratio, set);
      if (fl.size > 4 * 1024 * 1024) { msg.textContent = 'Ảnh tối đa 4MB'; return; }
      msg.textContent = 'Đang tải lên...';
      try { set(await upload(fl)); msg.textContent = ''; } catch (e) { msg.textContent = e.message; }
    };
    edit.onclick = () => openEditor(obj[f.k], f.ratio, set);
    del.onclick = () => set('');
    wrap.append(prev, pick, edit, del, file, msg); sync();
    return wrap;
  }

  function field(obj, f, onChange) {
    const lab = h('label', { class: f.full ? 'full' : '' }, f.label);
    if (f.t === 'text') { const i = h('input', { type: 'text', value: obj[f.k] ?? '' }); i.oninput = () => { obj[f.k] = i.value; onChange && onChange(); }; lab.append(i); }
    else if (f.t === 'number') { const i = h('input', { type: 'number', min: '0', step: '1000', value: obj[f.k] ?? 0 }); i.oninput = () => { obj[f.k] = Number(i.value) || 0; onChange && onChange(); }; lab.append(i); }
    else if (f.t === 'area') { const i = h('textarea', { rows: String(f.rows || 3) }); i.value = obj[f.k] ?? ''; i.oninput = () => { obj[f.k] = i.value; }; lab.append(i); }
    else if (f.t === 'select') { const s = h('select'); f.opts.forEach(([v, t]) => s.append(h('option', { value: v }, t))); s.value = obj[f.k]; s.onchange = () => { obj[f.k] = s.value; }; lab.append(s); }
    else { lab.append(imageField(obj, f, onChange)); lab.classList.add('full'); }
    return lab;
  }

  function listEditor(arr, spec, wrap) {
    const render = () => {
      wrap.innerHTML = '';
      arr.forEach((o, i) => {
        const tt = h('span', { class: 'tt' }, spec.titleOf(o));
        const up = h('button', { type: 'button', class: 'mini', title: 'Lên' }, '↑'), dn = h('button', { type: 'button', class: 'mini', title: 'Xuống' }, '↓'), rm = h('button', { type: 'button', class: 'mini', title: 'Xoá' }, '✕');
        [up, dn, rm].forEach(b => b.addEventListener('click', e => e.preventDefault()));
        up.onclick = () => { if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; render(); } };
        dn.onclick = () => { if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; render(); } };
        rm.onclick = () => { if (confirm('Xoá mục này?')) { arr.splice(i, 1); render(); } };
        const body = h('div', { class: 'ib' }, spec.fields.map(f => field(o, f, () => { tt.textContent = spec.titleOf(o); })));
        wrap.append(h('details', { class: 'item' }, h('summary', {}, h('span', {}, (i + 1) + '.'), tt, up, dn, rm), body));
      });
      const add = h('button', { type: 'button', class: 'btn ghost sm' }, '+ Thêm ' + spec.itemName.toLowerCase());
      add.onclick = () => { arr.push({ ...spec.blank }); render(); wrap.lastElementChild.previousElementSibling?.setAttribute('open', ''); };
      wrap.append(add);
    };
    render();
  }

  function build() {
    root.innerHTML = '';
    root.append(h('p', { class: 'hint', style: 'margin-bottom:12px' }, 'Chỉnh nội dung từng khu vực của trang chủ, rồi bấm "Lưu thay đổi" ở cuối trang. Các bài viết ở mục Dòng chảy, Lăn bóng, Bên lề sân cỏ, Người hâm mộ, Multimedia được đăng ở tab "Bài viết".'));
    SCHEMA.forEach(sec => {
      const box = h('div', { class: 'sbody' });
      if (sec.hint) box.append(h('p', { class: 'hint', style: 'margin-top:12px' }, sec.hint));
      const base = sec.root ? data[sec.root] : data;
      if (sec.type === 'list') { const w = h('div'); box.append(w); listEditor(base[sec.key], sec, w); }
      else {
        box.append(h('div', { class: 'ib', style: 'display:grid;grid-template-columns:1fr 1fr;gap:0 16px' }, sec.fields.map(f => field(base[sec.key], f))));
        if (sec.sub) { box.append(h('h4', { style: 'margin:18px 0 0' }, sec.sub.title)); const w = h('div'); box.append(w); listEditor(base[sec.key][sec.sub.key], sec.sub, w); }
      }
      root.append(h('details', { class: 'sgroup' }, h('summary', {}, sec.title), box));
    });
    const save = h('button', { type: 'button', class: 'btn' }, 'Lưu thay đổi'), ok = h('span', { class: 'okmsg' }), er = h('span', { class: 'err' });
    save.onclick = async () => {
      save.disabled = true; ok.textContent = ''; er.textContent = '';
      try { data = await api('/api/admin/site', 'PUT', data); ok.textContent = 'Đã lưu. Tải lại trang chủ để xem.'; build(); } catch (e) { er.textContent = e.message; }
      save.disabled = false;
    };
    root.append(h('div', { class: 'savebar' }, save, ok, er));
  }

  window.loadSiteEditor = async () => {
    data = await fetch('/api/site').then(r => r.json());
    const D = JSON.parse(JSON.stringify(window.ABOUT_DEFAULT || {}));
    data.about = { ...D, ...(data.about || {}) }; data.about.stadium = { ...D.stadium, ...(data.about.stadium || {}) };
    build();
  };
  document.querySelector('.tab[data-tab="site"]').addEventListener('click', () => { if (!data) loadSiteEditor(); });
})();
