const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(url, method = 'GET', body) {
  const r = await fetch(url, {
    method, headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && !url.includes('login')) { showLogin(); throw new Error('Phiên đăng nhập đã hết hạn'); }
  if (!r.ok) throw new Error(data.error || 'Có lỗi xảy ra');
  return data;
}

let sections = [], articles = [], editing = null; // editing: article object or {} for new
const secName = id => (sections.find(s => s.id === id) || {}).name || id;

// ---------- auth ----------
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; }
async function showApp() {
  $('#login').hidden = true; $('#app').hidden = false;
  sections = await api('/api/sections');
  $('#filter').innerHTML = '<option value="">Tất cả chuyên mục</option>' + sections.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  $('#f_section').innerHTML = sections.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  renderSections();
  await loadList();
}
$('#login').addEventListener('submit', async e => {
  e.preventDefault();
  try { await api('/api/login', 'POST', { username: $('#lu').value, password: $('#lp').value }); $('#lp').value = ''; await showApp(); }
  catch (err) { $('#lerr').textContent = err.message; }
});
$('#outBtn').onclick = async () => { await api('/api/logout', 'POST'); showLogin(); };
$('#pwBtn').onclick = async () => {
  const pw = prompt('Mật khẩu mới (tối thiểu 8 ký tự):');
  if (!pw) return;
  try { await api('/api/password', 'POST', { password: pw }); alert('Đã đổi mật khẩu'); } catch (e) { alert(e.message); }
};
(async () => { (await fetch('/api/me').then(r => r.json())).admin ? showApp() : showLogin(); })();

// ---------- tabs ----------
document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
  $('#posts').hidden = t.dataset.tab !== 'posts'; $('#secs').hidden = t.dataset.tab !== 'secs';
});

// ---------- list ----------
async function loadList() { articles = await api('/api/admin/articles'); renderList(); }
function renderList() {
  const f = $('#filter').value;
  const list = articles.filter(a => !f || a.section === f);
  $('#rows').innerHTML = list.map(a => `
    <tr><td>${a.image ? `<img src="${esc(a.image)}" alt="">` : '<img alt="">'}</td>
    <td><b>${esc(a.title)}</b><div class="hint">${new Date(a.createdAt).toLocaleString('vi-VN')}${a.video || a.videoUrl ? ' · 🎬 video' : ''}</div></td>
    <td>${esc(secName(a.section))}</td>
    <td><span class="badge ${a.published ? 'pub' : ''}">${a.published ? 'Đã đăng' : 'Nháp'}</span> ${a.featured ? '<span class="badge on">Slider</span>' : ''}</td>
    <td style="white-space:nowrap"><button class="btn ghost sm" data-edit="${a.id}">Sửa</button> <button class="btn danger sm" data-del="${a.id}">Xoá</button></td></tr>`).join('')
    || '<tr><td colspan="5" style="text-align:center;color:#6b6560;padding:30px">Chưa có bài viết nào</td></tr>';
}
$('#filter').onchange = renderList;
$('#rows').addEventListener('click', async e => {
  const ed = e.target.dataset.edit, del = e.target.dataset.del;
  if (ed) openForm(articles.find(a => a.id === ed));
  if (del && confirm('Xoá bài viết này?')) { await api('/api/admin/articles/' + del, 'DELETE'); loadList(); }
});
$('#newBtn').onclick = () => openForm({});

// ---------- form ----------
let state = {};
function openForm(a) {
  editing = a;
  state = { image: a.image || '', video: a.video || '' };
  $('#formTitle').textContent = a.id ? 'Sửa bài viết' : 'Bài viết mới';
  $('#f_title').value = a.title || '';
  $('#f_section').value = a.section || ($('#filter').value || sections[0].id);
  $('#f_summary').value = a.summary || '';
  $('#f_content').value = a.content || '';
  $('#f_videoUrl').value = a.videoUrl || '';
  $('#f_featured').checked = !!a.featured;
  $('#f_published').checked = a.id ? !!a.published : true;
  $('#ferr').textContent = '';
  syncMedia();
  $('#listView').hidden = true; $('#formView').hidden = false; scrollTo(0, 0);
}
function closeForm() { $('#formView').hidden = true; $('#listView').hidden = false; }
$('#cancelBtn').onclick = closeForm;

function syncMedia() {
  $('#imgPrev').hidden = !state.image; if (state.image) $('#imgPrev').src = state.image;
  $('#imgEdit').hidden = $('#imgDel').hidden = !state.image;
  $('#vidPrev').hidden = !state.video; if (state.video) $('#vidPrev').src = state.video;
  $('#vidDel').hidden = !state.video;
}
$('#imgDel').onclick = () => { state.image = ''; syncMedia(); };
$('#vidDel').onclick = () => { state.video = ''; syncMedia(); };

$('#formView').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    title: $('#f_title').value.trim(), section: $('#f_section').value, summary: $('#f_summary').value,
    content: $('#f_content').value, videoUrl: $('#f_videoUrl').value.trim(), image: state.image, video: state.video,
    featured: $('#f_featured').checked, published: $('#f_published').checked,
  };
  try {
    editing.id ? await api('/api/admin/articles/' + editing.id, 'PUT', body) : await api('/api/admin/articles', 'POST', body);
    closeForm(); loadList();
  } catch (err) { $('#ferr').textContent = err.message; }
});

// ---------- upload ----------
function upload(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData(); fd.append('file', file);
    const x = new XMLHttpRequest();
    x.open('POST', '/api/admin/upload');
    if (onProgress) x.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => {
      let d = {}; try { d = JSON.parse(x.responseText); } catch {}
      x.status === 200 ? resolve(d.url) : reject(new Error(d.error || 'Tải lên thất bại'));
    };
    x.onerror = () => reject(new Error('Lỗi mạng'));
    x.send(fd);
  });
}
$('#vidPick').onclick = () => $('#vidFile').click();
const BLOB_CLIENT = 'https://esm.sh/@vercel/blob@2.8.1/client';
async function uploadVideo(file, onProgress) {
  const cfg = await fetch('/api/config').then(r => r.json()).catch(() => ({}));
  if (!cfg.blob) return upload(file, onProgress); // chạy máy cục bộ
  const { upload: blobUpload } = await import(BLOB_CLIENT);
  const r = await blobUpload('videos/' + file.name.replace(/[^\w.-]/g, '_'), file, {
    access: 'public', handleUploadUrl: '/api/admin/blob-token', multipart: true,
    onUploadProgress: p => onProgress && onProgress(p.percentage / 100),
  });
  return r.url;
}
$('#vidFile').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  if (f.size > 500 * 1024 * 1024) { $('#ferr').textContent = 'Video tối đa 500MB'; return; }
  const prog = $('#vidProg'); prog.hidden = false; $('#ferr').textContent = '';
  $('#vidPick').disabled = true;
  try { state.video = await uploadVideo(f, p => prog.firstElementChild.style.width = p * 100 + '%'); syncMedia(); }
  catch (err) { $('#ferr').textContent = 'Tải video thất bại: ' + err.message; }
  $('#vidPick').disabled = false; prog.hidden = true; prog.firstElementChild.style.width = 0;
};

// ---------- image editor ----------
const cv = $('#cv'), ctx = cv.getContext('2d');
let img = null, ed = {};
const resetEd = () => ed = { rot: 0, zoom: 1, x: 0, y: 0, bri: 100, con: 100, sat: 100 };
function openEditor(src) {
  const im = new Image();
  im.onload = () => { img = im; resetEd(); syncCtl(); draw(); $('#edErr').textContent = ''; $('#ed').hidden = false; };
  im.onerror = () => alert('Không đọc được ảnh');
  im.src = src;
}
function syncCtl() { $('#zoom').value = ed.zoom; $('#bri').value = ed.bri; $('#con').value = ed.con; $('#sat').value = ed.sat; }
function geom() {
  const swap = ed.rot % 180 !== 0;
  const w = swap ? img.height : img.width, h = swap ? img.width : img.height;
  const base = Math.max(cv.width / w, cv.height / h); // cover
  return { w, h, s: base * ed.zoom };
}
function clampPan() {
  const { w, h, s } = geom();
  const mx = Math.max(0, (w * s - cv.width) / 2), my = Math.max(0, (h * s - cv.height) / 2);
  ed.x = Math.min(mx, Math.max(-mx, ed.x)); ed.y = Math.min(my, Math.max(-my, ed.y));
}
function draw() {
  clampPan();
  const { s } = geom();
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.save();
  ctx.filter = `brightness(${ed.bri}%) contrast(${ed.con}%) saturate(${ed.sat}%)`;
  ctx.translate(cv.width / 2 + ed.x, cv.height / 2 + ed.y);
  ctx.rotate(ed.rot * Math.PI / 180); ctx.scale(s, s);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}
['zoom', 'bri', 'con', 'sat'].forEach(k => $('#' + k).oninput = e => { ed[k] = +e.target.value; draw(); });
$('#rotL').onclick = () => { ed.rot = (ed.rot + 270) % 360; ed.x = ed.y = 0; draw(); };
$('#rotR').onclick = () => { ed.rot = (ed.rot + 90) % 360; ed.x = ed.y = 0; draw(); };
$('#reset').onclick = () => { resetEd(); syncCtl(); draw(); };
$('#edCancel').onclick = () => $('#ed').hidden = true;

let drag = null;
cv.onpointerdown = e => { drag = { px: e.clientX, py: e.clientY, x: ed.x, y: ed.y }; cv.setPointerCapture(e.pointerId); };
cv.onpointermove = e => {
  if (!drag) return;
  const k = cv.width / cv.getBoundingClientRect().width;
  ed.x = drag.x + (e.clientX - drag.px) * k; ed.y = drag.y + (e.clientY - drag.py) * k; draw();
};
cv.onpointerup = () => drag = null;

$('#edOk').onclick = () => {
  $('#edOk').disabled = true;
  cv.toBlob(async blob => {
    try {
      state.image = await upload(new File([blob], 'cover.jpg', { type: 'image/jpeg' }));
      syncMedia(); $('#ed').hidden = true;
    } catch (err) { $('#edErr').textContent = err.message; }
    $('#edOk').disabled = false;
  }, 'image/jpeg', 0.88);
};
$('#imgPick').onclick = () => $('#imgFile').click();
$('#imgFile').onchange = e => {
  const f = e.target.files[0]; e.target.value = '';
  if (f) openEditor(URL.createObjectURL(f));
};
$('#imgEdit').onclick = () => openEditor(state.image);

// ---------- sections ----------
function renderSections() {
  $('#secList').innerHTML = sections.map(s => `
    <div class="bar"><input type="text" value="${esc(s.name)}" data-sec="${s.id}" style="max-width:320px">
    <button class="btn ghost sm" data-save="${s.id}">Lưu</button></div>`).join('');
}
$('#secList').addEventListener('click', async e => {
  const id = e.target.dataset.save; if (!id) return;
  const name = $('#secList').querySelector(`[data-sec="${id}"]`).value.trim();
  try { await api('/api/admin/sections/' + id, 'PUT', { name }); sections = await api('/api/sections'); await showApp(); } catch (err) { alert(err.message); }
});
