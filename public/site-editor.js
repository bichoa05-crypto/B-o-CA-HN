// Trình chỉnh sửa nội dung trang chủ (dựa trên sơ đồ trường)
(function () {
  const IMG = (k, label, ratio) => ({ k, label, t: 'photo', ratio });
  const LOGO = (k, label) => ({ k, label, t: 'logo' });
  const TXT = (k, label, full) => ({ k, label, t: 'text', full });
  const NUM = (k, label) => ({ k, label, t: 'number' });
  const ART = (k, label) => ({ k, label, t: 'article', full: true });
  const AREA = (k, label, rows) => ({ k, label, t: 'area', full: true, rows });
  const SCHEMA = [
    { key: 'hero', title: '1. Banner đầu trang', type: 'list', itemName: 'Slide', titleOf: o => o.line2 || o.line1 || 'Slide', blank: { image: '', line1: '', line2: '', button: 'Đọc bài viết', articleId: '', link: '' },
      hint: 'Ảnh nền nên ngang, tỉ lệ 16:9. Có thể thêm nhiều slide, tự chuyển sau vài giây.',
      fields: [IMG('image', 'Ảnh nền', '16:9'), TXT('line1', 'Dòng tiêu đề 1 (chữ mảnh)'), TXT('line2', 'Dòng tiêu đề 2 (chữ đậm)'), TXT('button', 'Chữ trên nút'), ART('articleId', 'Bài viết sẽ mở khi bấm nút hoặc tiêu đề (chọn từ các bài đã đăng)'), TXT('link', 'Hoặc link khác (chỉ dùng khi không chọn bài ở trên)', true)] },
    { key: 'tournaments', title: '2. Giải đấu (4 cột trận sắp tới)', type: 'list', itemName: 'Giải đấu', titleOf: o => o.name || 'Giải đấu', blank: { name: '', homeName: 'Công an Hà Nội', homeLogo: '', awayName: '', awayLogo: '', date: '', time: '', ticketUrl: '#' },
      hint: 'Logo đội nên là ảnh PNG nền trong suốt, hình vuông.',
      fields: [TXT('name', 'Tên giải đấu', true), TXT('homeName', 'Đội nhà'), LOGO('homeLogo', 'Logo đội nhà'), TXT('awayName', 'Đội khách'), LOGO('awayLogo', 'Logo đội khách'), TXT('date', 'Ngày (vd 18/10)'), TXT('time', 'Giờ (vd 19:15)'), TXT('ticketUrl', 'Link mua vé', true)] },
    { key: 'intro', title: '3. Dòng chữ lớn "Since 1956"', type: 'object', fields: [TXT('line1', 'Dòng 1'), TXT('line2', 'Dòng 2')] },
    { key: 'squad', title: 'Trang Đội hình – Danh sách cầu thủ (hiện cả ở trang chủ)', type: 'list', itemName: 'Cầu thủ', titleOf: o => (o.number ? '#' + o.number + ' ' : '') + (o.name || 'Cầu thủ'), blank: { name: '', number: '', image: '', pos: '' },
      hint: 'Ảnh cầu thủ nên là ảnh PNG đã tách nền (nửa người), dọc.',
      fields: [TXT('name', 'Tên cầu thủ'), TXT('number', 'Số áo'), { k: 'pos', label: 'Vị trí (để lọc ở trang Đội hình)', t: 'select', opts: [['', '— Chưa chọn —'], ['gk', 'Thủ môn'], ['df', 'Hậu vệ'], ['mf', 'Tiền vệ'], ['fw', 'Tiền đạo']] }, LOGO('image', 'Ảnh cầu thủ (PNG tách nền)')] },
    { key: 'squadPage', title: 'Trang Đội hình – ảnh tập thể đầu trang', type: 'object', fields: [TXT('title', 'Chữ lớn trên ảnh (vd Đội hình)'), IMG('banner', 'Ảnh tập thể đội (ngang)', '2.6:1')] },
    { key: 'staff', title: 'Trang Đội hình – Ban huấn luyện', type: 'list', itemName: 'Thành viên', titleOf: o => (o.role ? o.role + ': ' : '') + (o.name || 'Thành viên'), blank: { role: '', name: '', image: '' },
      hint: 'Hiện 2 người đầu, bấm "Xem tất cả" để xem thêm. Ảnh nên là PNG tách nền (nửa người, khoanh tay).',
      fields: [TXT('role', 'Chức danh (vd Huấn luyện viên trưởng)'), TXT('name', 'Họ tên'), LOGO('image', 'Ảnh (PNG tách nền)')] },
    { key: 'newsPage', title: 'Trang Dòng chảy – ảnh nền đầu trang', type: 'object', fields: [IMG('banner', 'Ảnh nền (cờ, cổ động viên...; tự chuyển sang đen trắng)', '3:1')] },
    { key: 'multimedia', title: '5. Banner Multimedia', type: 'object', fields: [IMG('image', 'Ảnh nền', '1.45:1'), TXT('button', 'Chữ nút vàng'), TXT('link', 'Link nút')] },
    { key: 'shop', title: '6. Cửa hàng chính thức', type: 'object', fields: [TXT('title', 'Tiêu đề'), TXT('subtitle', 'Dòng phụ')],
      sub: { key: 'products', title: 'Sản phẩm (thứ tự: số 1 là bán chạy nhất)', itemName: 'Sản phẩm', titleOf: o => o.name || 'Sản phẩm', blank: { name: '', price: 0, description: '', image: '' },
        fields: [TXT('name', 'Tên sản phẩm', true), NUM('price', 'Giá bán (VNĐ)'), AREA('description', 'Mô tả ngắn'), LOGO('image', 'Ảnh sản phẩm (PNG tách nền)')] } },
    { key: 'honors', title: '7. Thành tích (Công an Hà Nội FC)', type: 'object', fields: [TXT('title', 'Tiêu đề lớn'), IMG('banner', 'Ảnh banner (cúp, cờ...)', '3:1')],
      sub: { key: 'items', title: 'Danh sách thành tích', itemName: 'Thành tích', titleOf: o => o.year + ' · ' + o.name, blank: { year: '', name: '', result: 'champion' },
        fields: [TXT('year', 'Năm (vd 1962 hoặc 1981-1982)'), TXT('name', 'Tên giải'), { k: 'result', label: 'Thành tích', t: 'select', opts: [['champion', 'Vô địch'], ['runner', 'Á quân'], ['third', 'Hạng ba']] }] } },
    { key: 'footer', title: '9. Chân trang & liên kết mạng xã hội', type: 'object', fields: [TXT('brand', 'Tên hiển thị cạnh logo', true), AREA('licenses', 'Giấy phép (mỗi dòng một ý)'), TXT('address', 'Địa chỉ', true), TXT('phone', 'Hotline'), TXT('email', 'Email'), TXT('copyright', 'Dòng bản quyền', true), TXT('facebook', 'Link Facebook của CLB'), TXT('youtube', 'Link YouTube'), TXT('instagram', 'Link Instagram'), TXT('tiktok', 'Link TikTok'), TXT('zalo', 'Link Zalo'), AREA('bank', 'Thông tin chuyển khoản (hiện sau khi khách chọn thanh toán chuyển khoản)')] },
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
    { key: 'sponsors', title: 'Gắn link cho từng logo nhà tài trợ trong hình ở chân trang', type: 'list', fixed: true, itemName: 'Nhà tài trợ', titleOf: o => (o.url ? '🔗 ' : '') + o.name, blank: { name: '', image: '', url: '' },
      hint: 'Mỗi dòng là một logo trong hình nhà tài trợ. Dán link website của nhà tài trợ (vd https://www.lpbank.com.vn): bấm vào logo đó trên web sẽ mở link. Để trống nếu chưa muốn gắn link.',
      fields: [TXT('url', 'Link website của nhà tài trợ này', true)] },
  ];

  
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

  let artsP = null;
  const getArticles = () => artsP || (artsP = api('/api/admin/articles').catch(() => []));
  function field(obj, f, onChange) {
    const lab = h('label', { class: f.full ? 'full' : '' }, f.label);
    if (f.t === 'text') { const i = h('input', { type: 'text', value: obj[f.k] ?? '' }); i.oninput = () => { obj[f.k] = i.value; onChange && onChange(); }; lab.append(i); }
    else if (f.t === 'number') { const i = h('input', { type: 'number', min: '0', step: '1000', value: obj[f.k] ?? 0 }); i.oninput = () => { obj[f.k] = Number(i.value) || 0; onChange && onChange(); }; lab.append(i); }
    else if (f.t === 'area') { const i = h('textarea', { rows: String(f.rows || 3) }); i.value = obj[f.k] ?? ''; i.oninput = () => { obj[f.k] = i.value; }; lab.append(i); }
    else if (f.t === 'article') {
      const s = h('select'); s.append(h('option', { value: '' }, '— Tự động: bài mới nhất —'));
      getArticles().then(list => { list.forEach(a => s.append(h('option', { value: a.id }, a.title + (a.published ? '' : ' (nháp)')))); s.value = obj[f.k] || ''; });
      s.onchange = () => { obj[f.k] = s.value; }; lab.append(s);
    }
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
        wrap.append(h('details', { class: 'item' }, h('summary', {}, h('span', {}, (i + 1) + '.'), tt, ...(spec.fixed ? [] : [up, dn, rm])), body));
      });
      const add = h('button', { type: 'button', class: 'btn ghost sm' }, '+ Thêm ' + spec.itemName.toLowerCase());
      add.onclick = () => { arr.push({ ...spec.blank }); render(); wrap.lastElementChild.previousElementSibling?.setAttribute('open', ''); };
      if (!spec.fixed) wrap.append(add);
    };
    render();
  }

  // mỗi tab của admin = một trang web; mỗi khu vực thuộc đúng một trang
  const PAGE_OF = k => ({ about: 'about', trophies: 'about', history: 'about', leaders: 'about', stadium: 'about', shop: 'shop', footer: 'foot', sponsors: 'foot', squad: 'squad', squadPage: 'squad', staff: 'squad', newsPage: 'news' }[k] || 'home');
  const secPage = sec => PAGE_OF(sec.root === 'about' ? 'about' : sec.key);
  const HINT = {
    home: 'Trang chủ: banner, giải đấu, dòng chữ lớn, banner Multimedia, thành tích (danh sách cầu thủ sửa ở tab Đội hình). Các bài ở Dòng chảy, Lăn bóng, Bên lề sân cỏ, Người hâm mộ, Multimedia được đăng ở tab "Bài viết".',
    about: 'Trang "Về chúng tôi": giới thiệu, danh hiệu, lịch sử, ban lãnh đạo, sân nhà. Sửa chữ, thêm/xoá/đổi thứ tự mục, thay ảnh. Bài viết của chuyên mục nằm ở danh sách bên dưới.',
    squad: 'Trang Đội hình: danh sách cầu thủ (hiện cả ở trang chủ), ảnh tập thể đầu trang, ban huấn luyện. Bài viết của chuyên mục nằm ở danh sách bên dưới.',
    news: 'Trang Dòng chảy: ảnh nền đầu trang. Bài nổi bật là bài đánh dấu "Tin nổi bật" mới nhất (không có thì lấy bài mới nhất); bài viết của chuyên mục nằm ở danh sách bên dưới.',
    shop: 'Trang Cửa hàng: tiêu đề và sản phẩm (hiện ở trang chủ và trang Cửa hàng).',
    foot: 'Chân trang (hiện ở mọi trang): thông tin liên hệ, giấy phép, mạng xã hội và link cho từng logo nhà tài trợ.',
  };
  const mounts = [];
  function build() { mounts.forEach(([el, page]) => buildInto(el, page)); }
  function buildInto(root, page) {
    root.innerHTML = '';
    root.append(h('p', { class: 'hint', style: 'margin:14px 0 12px' }, HINT[page] + ' Sửa xong bấm "Lưu thay đổi" ở cuối trang.'));
    let n = 0;
    SCHEMA.filter(sec => secPage(sec) === page).forEach(sec => {
      const t0 = sec.title.replace(/^\d+\.\s*/, '').replace(/^Trang (?:"Về chúng tôi"|Đội hình|Dòng chảy) – /, ''), title = ++n + '. ' + t0.charAt(0).toUpperCase() + t0.slice(1);
      const box = h('div', { class: 'sbody' });
      if (sec.hint) box.append(h('p', { class: 'hint', style: 'margin-top:12px' }, sec.hint));
      const base = sec.root ? data[sec.root] : data;
      if (sec.type === 'list') { const w = h('div'); box.append(w); listEditor(base[sec.key], sec, w); }
      else {
        box.append(h('div', { class: 'ib', style: 'display:grid;grid-template-columns:1fr 1fr;gap:0 16px' }, sec.fields.map(f => field(base[sec.key], f))));
        if (sec.sub) { box.append(h('h4', { style: 'margin:18px 0 0' }, sec.sub.title)); const w = h('div'); box.append(w); listEditor(base[sec.key][sec.sub.key], sec.sub, w); }
      }
      const det = h('details', { class: 'sgroup' }, h('summary', {}, title), box);
      if (n === 1) det.setAttribute('open', '');
      root.append(det);
    });
    const save = h('button', { type: 'button', class: 'btn' }, 'Lưu thay đổi'), ok = h('span', { class: 'okmsg' }), er = h('span', { class: 'err' });
    save.onclick = async () => {
      save.disabled = true; ok.textContent = ''; er.textContent = '';
      try { data = await api('/api/admin/site', 'PUT', data); normalize(); build(); const o = root.querySelector('.okmsg'); if (o) o.textContent = 'Đã lưu. Tải lại trang web để xem.'; } catch (e) { er.textContent = e.message; save.disabled = false; }
    };
    root.append(h('div', { class: 'savebar' }, save, ok, er));
  }
  function normalize() {
    const D = JSON.parse(JSON.stringify(window.ABOUT_DEFAULT || {}));
    const SM = window.SPONSOR_MAP || [];
    if (SM.length && (!Array.isArray(data.sponsors) || data.sponsors.length !== SM.length || data.sponsors.some((x, i) => x.name !== SM[i].name))) data.sponsors = SM.map((b, i) => ({ name: b.name, image: '', url: ((data.sponsors || [])[i] || {}).url || '' }));
    data.squadPage = { title: 'Đội hình', banner: '', ...(data.squadPage || {}) };
    if (!Array.isArray(data.staff)) data.staff = [];
    data.newsPage = { banner: '', ...(data.newsPage || {}) };
    (data.squad || []).forEach(p => { if (p.pos === undefined) p.pos = ''; });
    data.about = { ...D, ...(data.about || {}) }; data.about.stadium = { ...D.stadium, ...(data.about.stadium || {}) };
  }

  async function mount(el, page) {
    if (!mounts.some(m => m[0] === el)) mounts.push([el, page]);
    if (!data) { data = await fetch('/api/site').then(r => r.json()); normalize(); }
    buildInto(el, page);
  }
  window.mountSiteEditor = mount;
  [['site', 'home'], ['shop', 'shop'], ['foot', 'foot']].forEach(([tab, page]) => {
    const el = document.getElementById(tab);
    document.querySelector('.tab[data-tab="' + tab + '"]').addEventListener('click', () => { if (!mounts.some(m => m[0] === el)) mount(el, page); });
  });
})();
