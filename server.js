const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const BLOB = !!process.env.BLOB_READ_WRITE_TOKEN; // chạy trên Vercel: dữ liệu + tệp lưu ở Vercel Blob
const blob = BLOB ? require('@vercel/blob') : null;

const DB_FILE = path.join(ROOT, 'data', 'db.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const SECRET_FILE = path.join(ROOT, 'data', '.secret');
const ENV_USER = (process.env.ADMIN_USER || 'admin').trim();
const ENV_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
const isNotFound = e => !!e && ((blob && blob.BlobNotFoundError && e instanceof blob.BlobNotFoundError) || /not.?found|does not exist/i.test(String(e.name) + ' ' + String(e.message)));

const DEFAULT_SECTIONS = [
  { id: 've-chung-toi', name: 'Về chúng tôi' },
  { id: 'dong-chay', name: 'Dòng chảy' },
  { id: 'doi-hinh', name: 'Đội hình' },
  { id: 'lan-bong', name: 'Lăn bóng' },
  { id: 'ben-le-san-co', name: 'Bên lề sân cỏ' },
  { id: 'nguoi-ham-mo', name: 'Người hâm mộ' },
  { id: 'multimedia', name: 'Multimedia' },
];
// bản cũ -> bản mới
const SECTION_MIGRATION = { 'thoi-su': 'lan-bong', 'an-ninh': 'dong-chay', 'phap-luat': 'ben-le-san-co', 'giao-thong': 'nguoi-ham-mo', video: 'multimedia' };

// Nội dung trang chủ mặc định (quản trị viên chỉnh sửa trong admin)
const DEFAULT_SITE = {
  hero: [{ image: '', line1: 'CLB CÔNG AN HÀ NỘI CHÍNH THỨC', line2: 'VÔ ĐỊCH V.LEAGUE 2025/26', button: 'Đọc bài viết', link: '#dong-chay' }],
  tournaments: [
    { name: 'LPBANK V.LEAGUE 1 2026/27', homeName: 'Công an Hà Nội', homeLogo: '', awayName: 'Hà Nội', awayLogo: '', date: '18/10', time: '19:15', ticketUrl: '#' },
    { name: 'AFC CHAMPIONS LEAGUE ELITE 2026/27', homeName: 'Công an Hà Nội', homeLogo: '', awayName: 'Đông Á Thanh Hóa', awayLogo: '', date: '22/10', time: '19:15', ticketUrl: '#' },
    { name: 'ASEAN CLUB CHAMPIONSHIP SHOPEE CUP 2026/27', homeName: 'Công an Hà Nội', homeLogo: '', awayName: 'Sông Lam Nghệ An', awayLogo: '', date: '31/10', time: '18:00', ticketUrl: '#' },
    { name: 'CÚP QUỐC GIA SACOMBANK 2026/27', homeName: 'Công an Hà Nội', homeLogo: '', awayName: 'Công an TP.HCM', awayLogo: '', date: '07/11', time: '19:15', ticketUrl: '#' },
  ],
  intro: { line1: 'CONG AN HA NOI', line2: 'SINCE 1956' },
  squad: [
    { name: 'Filip Nguyen', number: '1', image: '' },
    { name: 'Nguyen Quang Hai', number: '19', image: '' },
    { name: 'Doan Van Hau', number: '5', image: '' },
  ],
  multimedia: { image: '', button: 'Xem tất cả', link: 'section.html?s=multimedia' },
  shop: {
    title: 'Cửa hàng chính thức', subtitle: 'Sản phẩm bán chạy nhất',
    products: [
      { id: 'p1home', name: 'HOME KIT V.LEAGUE 2026', price: 350000, description: '', image: '', link: '' },
      { id: 'p2away', name: 'AWAY KIT INTERNATIONAL 2026', price: 350000, description: '', image: '', link: '' },
      { id: 'p3homei', name: 'HOME KIT INTERNATIONAL 2026', price: 350000, description: '', image: '', link: '' },
      { id: 'p4third', name: 'THIRD KIT INTERNATIONAL 2026', price: 350000, description: '', image: '', link: '' },
    ],
  },
  honors: {
    title: 'CÔNG AN HÀ NỘI FC', banner: '',
    items: [
      { year: '1962', name: 'Giải hạng A miền Bắc', result: 'champion' },
      { year: '1962', name: 'Giải vô địch thống nhất miền Bắc', result: 'champion' },
      { year: '1980', name: 'Giải bóng đá A1 toàn quốc', result: 'runner' },
      { year: '1981-1982', name: 'Giải bóng đá A1 toàn quốc', result: 'third' },
      { year: '1981-1982', name: 'Giải bóng đá A1 toàn quốc', result: 'champion' },
    ],
  },
  sponsors: Array.from({ length: 10 }, (_, i) => ({ name: 'Nhà tài trợ ' + (i + 1), image: '', url: '' })),
  footer: {
    about: 'Cơ quan ngôn luận của Công an thành phố Hà Nội. Thông tin nhanh, chính xác, vì một Thủ đô bình yên.',
    brand: 'Công an Hà Nội FC', licenses: 'Logo kèm tên website Câu lạc bộ Bóng đá Công An Hà Nội\nCơ quan chủ quản: Công an Thành phố Hà Nội\nChủ sở hữu: Công ty TNHH Bóng đá Công an Thành phố Hà Nội\nChịu trách nhiệm nội dung: Đại tá Nguyễn Tiến Đạt\nGiấy phép thiết lập trang thông tin điện tử số 4593/GP-TTĐT do Sở TT&TT Hà Nội cấp ngày 09/01/2023',
    address: 'Số 79 Trần Hưng Đạo, phường Cửa Nam, thành phố Hà Nội', phone: '02438211052 - 0969848888', email: 'conganhanoifc@gmail.com',
    copyright: '© Bản quyền thuộc về website CLB Công An Hà Nội', facebook: '', youtube: '', instagram: '', tiktok: '', zalo: '',
    bank: 'Chuyển khoản: (chưa cấu hình) — quản trị viên cập nhật số tài khoản trong mục Trang chủ → Chân trang',
  },
};

// ---------- secret ----------
let SECRET;
if (process.env.AUTH_SECRET) SECRET = process.env.AUTH_SECRET;
else if (BLOB) SECRET = crypto.createHash('sha256').update('auth:' + process.env.BLOB_READ_WRITE_TOKEN).digest('hex');
else {
  fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
  SECRET = fs.existsSync(SECRET_FILE) ? fs.readFileSync(SECRET_FILE, 'utf8')
    : (() => { const s = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SECRET_FILE, s); return s; })();
}
const sign = v => crypto.createHmac('sha256', SECRET).update(v).digest('hex');

// ---------- storage ----------
function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
// Tên tệp dữ liệu khó đoán vì Blob công khai theo URL
const DB_KEY = 'data/db-' + sign('db').slice(0, 24) + '.json';
let cache = null, cacheAt = 0;

async function loadDb(fresh = false) {
  if (!fresh && cache && Date.now() - cacheAt < 3000) return cache;
  let db;
  if (BLOB) {
    try {
      const info = await blob.head(DB_KEY);
      const r = await fetch(info.url + '?t=' + Date.now(), { cache: 'no-store' });
      db = await r.json();
    } catch (e) {
      if (!isNotFound(e)) throw e;
      db = { sections: DEFAULT_SECTIONS, articles: [], site: DEFAULT_SITE };
      await saveDb(db);
    }
  } else {
    if (!fs.existsSync(DB_FILE)) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      const pw = ENV_PASSWORD || 'admin123';
      fs.writeFileSync(DB_FILE, JSON.stringify({ admin: { username: ENV_USER, ...hashPassword(pw) }, sections: DEFAULT_SECTIONS, articles: [], site: DEFAULT_SITE }, null, 2));
      console.log(`Đã tạo tài khoản admin: ${ENV_USER} / ${pw}`);
    }
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  if (migrate(db)) await saveDb(db);
  cache = db; cacheAt = Date.now();
  return db;
}
function migrate(db) {
  let changed = false;
  if (db.sections.some(x => SECTION_MIGRATION[x.id])) {
    db.sections = DEFAULT_SECTIONS;
    for (const a of db.articles) if (SECTION_MIGRATION[a.section]) a.section = SECTION_MIGRATION[a.section];
    changed = true;
  }
  // bổ sung chuyên mục còn thiếu, giữ tên admin đã đổi và đúng thứ tự mặc định
  if (DEFAULT_SECTIONS.some(d => !db.sections.some(x => x.id === d.id))) {
    db.sections = DEFAULT_SECTIONS.map(d => db.sections.find(x => x.id === d.id) || d);
    changed = true;
  }
  if (db.site && !db.site.footer) { db.site.footer = DEFAULT_SITE.footer; changed = true; }
  // chân trang mới: nạp nội dung mặc định nếu còn là bản cũ (chưa có giấy phép)
  if (db.site && db.site.footer && db.site.footer.licenses === undefined) {
    const d = DEFAULT_SITE.footer, o = db.site.footer;
    db.site.footer = { ...d, facebook: o.facebook || '', youtube: o.youtube || '', tiktok: o.tiktok || '', zalo: o.zalo || '', bank: o.bank || d.bank };
    changed = true;
  }
  if (db.site && db.site.shop) for (const [i, p] of db.site.shop.products.entries()) {
    if (!p.id) { p.id = 'p' + (i + 1) + crypto.randomBytes(2).toString('hex'); changed = true; }
    if (p.price === undefined) { p.price = 0; p.description = p.description || ''; changed = true; }
  }
  if (!db.site) { db.site = DEFAULT_SITE; changed = true; }
  return changed;
}
async function saveDb(db) {
  if (BLOB) {
    await blob.put(DB_KEY, JSON.stringify(db), {
      access: 'public', addRandomSuffix: false, allowOverwrite: true,
      contentType: 'application/json', cacheControlMaxAge: 60,
    });
  } else fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  cache = db; cacheAt = Date.now();
}

// ---------- kho JSON riêng (tên tệp khó đoán), có khoá tuần tự trong một tiến trình ----------
const storeKey = n => 'data/' + n + '-' + sign(n).slice(0, 24) + '.json';
const locks = new Map();
const withLock = (n, fn) => { const prev = locks.get(n) || Promise.resolve(); const run = prev.catch(() => {}).then(fn); locks.set(n, run); return run; };
async function readStore(n, fallback) {
  if (BLOB) {
    try { const info = await blob.head(storeKey(n)); return await (await fetch(info.url + '?t=' + Date.now(), { cache: 'no-store' })).json(); }
    catch (e) { if (isNotFound(e)) return fallback; throw e; }
  }
  const f = path.join(ROOT, 'data', n + '.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : fallback;
}
async function writeStore(n, val) {
  if (BLOB) await blob.put(storeKey(n), JSON.stringify(val), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  else { fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'data', n + '.json'), JSON.stringify(val, null, 2)); }
}
// đọc-sửa-ghi an toàn
const mutate = (n, fallback, fn) => withLock(n, async () => { const v = await readStore(n, fallback); const out = await fn(v); await writeStore(n, v); return out; });
const loadUsers = () => readStore('users', []);
const saveUsers = list => writeStore('users', list);

// ---------- auth ----------
function makeToken(role, id) { const p = `${role}.${id}.${Date.now() + 12 * 3600 * 1000}`; return p + '.' + sign(p); }
function session(req) {
  const t = req.cookies.token;
  if (!t) return null;
  const i = t.lastIndexOf('.');
  const p = t.slice(0, i), sig = t.slice(i + 1);
  const good = Buffer.from(sign(p)), got = Buffer.from(sig);
  if (got.length !== good.length || !crypto.timingSafeEqual(got, good)) return null;
  const [role, id, exp] = p.split('.');
  return Number(exp) > Date.now() ? { role, id } : null;
}
const isAdmin = req => (session(req) || {}).role === 'admin';
const requireAdmin = (req, res, next) => isAdmin(req) ? next() : res.status(401).json({ error: 'Cần đăng nhập bằng tài khoản quản trị' });
const safeEq = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };

const attempts = new Map();
function rateLimitLogin(req, res, next) {
  const k = req.ip, now = Date.now();
  const a = (attempts.get(k) || []).filter(t => now - t < 15 * 60000);
  if (a.length >= 8) return res.status(429).json({ error: 'Thử quá nhiều lần, vui lòng đợi 15 phút' });
  a.push(now); attempts.set(k, a); next();
}

// ---------- uploads ----------
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov'];
const extOk = n => { const e = path.extname(n).toLowerCase(); return IMAGE_EXT.includes(e) || VIDEO_EXT.includes(e); };
const upload = multer({
  storage: BLOB ? multer.memoryStorage() : multer.diskStorage({
    destination: (req, f, cb) => { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); cb(null, UPLOAD_DIR); },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: BLOB ? 4 * 1024 * 1024 : 500 * 1024 * 1024 }, // Vercel giới hạn body 4,5MB; video dùng upload trực tiếp
  fileFilter: (req, file, cb) => cb(null, extOk(file.originalname)),
});

// ---------- app ----------
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(e => { console.error(e); res.status(500).json({ error: 'Lỗi máy chủ: ' + (e.message || e) }); });
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
if (!BLOB) {
  app.use('/uploads', express.static(UPLOAD_DIR, { setHeaders: r => r.setHeader('X-Content-Type-Options', 'nosniff') }));
  app.use(express.static(path.join(ROOT, 'public')));
}

app.get('/api/config', (req, res) => res.json({ blob: BLOB, adminPasswordSet: !!ENV_PASSWORD, adminUserIsDefault: ENV_USER.toLowerCase() === 'admin' }));

app.get('/api/sections', wrap(async (req, res) => res.json((await loadDb()).sections)));
app.get('/api/articles', wrap(async (req, res) => {
  const db = await loadDb(); const q = req.query;
  let list = db.articles.filter(a => a.published);
  if (q.section) list = list.filter(a => a.section === q.section);
  if (q.featured) list = list.filter(a => a.featured);
  list.sort((a, b) => b.createdAt - a.createdAt);
  if (q.limit) list = list.slice(0, Number(q.limit));
  res.json(list);
}));
app.get('/api/articles/:id', wrap(async (req, res) => {
  const adm = isAdmin(req);
  const a = (await loadDb(adm)).articles.find(x => x.id === req.params.id && (x.published || adm));
  a ? res.json(a) : res.status(404).json({ error: 'Không tìm thấy' });
}));

// auth
const setSession = (req, res, role, id) => res.cookie('token', makeToken(role, id), { httpOnly: true, sameSite: 'strict', secure: req.secure, maxAge: 12 * 3600 * 1000 });
app.post('/api/login', rateLimitLogin, wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Thiếu thông tin' });
  const u = username.trim();
  // quản trị viên
  let isAdminLogin = false;
  if (ENV_PASSWORD) isAdminLogin = !!((safeEq(u.toLowerCase(), ENV_USER.toLowerCase()) | safeEq(u.toLowerCase(), 'admin')) & safeEq(password.trim(), ENV_PASSWORD));
  else if (!BLOB) {
    const { admin } = await loadDb();
    isAdminLogin = u.toLowerCase() === admin.username.toLowerCase() && crypto.timingSafeEqual(Buffer.from(hashPassword(password, admin.salt).hash), Buffer.from(admin.hash));
  }
  if (isAdminLogin) { setSession(req, res, 'admin', 'admin'); return res.json({ ok: true, role: 'admin', name: 'Quản trị viên' }); }
  if (BLOB && !ENV_PASSWORD && u.toLowerCase() === ENV_USER.toLowerCase()) return res.status(503).json({ error: 'Chưa cấu hình biến môi trường ADMIN_PASSWORD trên Vercel' });
  // người dùng thường
  const user = (await loadUsers()).find(x => x.email === u.toLowerCase());
  if (user && crypto.timingSafeEqual(Buffer.from(hashPassword(password, user.salt).hash), Buffer.from(user.hash))) {
    setSession(req, res, 'user', user.id); return res.json({ ok: true, role: 'user', name: user.name });
  }
  res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
}));
app.post('/api/register', rateLimitLogin, wrap(async (req, res) => {
  const name = String((req.body || {}).name || '').trim().slice(0, 60);
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const password = (req.body || {}).password;
  if (!name) return res.status(400).json({ error: 'Vui lòng nhập họ tên' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return res.status(400).json({ error: 'Email không hợp lệ' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Mật khẩu tối thiểu 8 ký tự' });
  const users = await loadUsers();
  if (users.some(x => x.email === email)) return res.status(409).json({ error: 'Email này đã được đăng ký' });
  const user = { id: crypto.randomBytes(6).toString('hex'), name, email, ...hashPassword(password), createdAt: Date.now() };
  users.push(user); await saveUsers(users);
  setSession(req, res, 'user', user.id);
  res.json({ ok: true, role: 'user', name });
}));
app.post('/api/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/me', wrap(async (req, res) => {
  const s = session(req);
  if (!s) return res.json({ admin: false, role: null });
  if (s.role === 'admin') return res.json({ admin: true, role: 'admin', name: 'Quản trị viên' });
  const u = (await loadUsers()).find(x => x.id === s.id);
  res.json({ admin: false, role: u ? 'user' : null, name: u ? u.name : '' });
}));
app.post('/api/password', requireAdmin, wrap(async (req, res) => {
  if (ENV_PASSWORD) return res.status(400).json({ error: 'Mật khẩu đang được đặt bằng biến môi trường ADMIN_PASSWORD trên Vercel; hãy đổi ở đó.' });
  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Mật khẩu tối thiểu 8 ký tự' });
  const db = await loadDb(true); Object.assign(db.admin, hashPassword(password)); await saveDb(db); res.json({ ok: true });
}));

// articles
const FIELDS = ['title', 'section', 'summary', 'content', 'image', 'video', 'videoUrl', 'featured', 'published'];
function pick(body) {
  const o = {};
  for (const f of FIELDS) if (body[f] !== undefined) o[f] = body[f];
  for (const f of ['title', 'section', 'summary', 'content', 'image', 'video', 'videoUrl']) if (o[f] !== undefined) o[f] = String(o[f]);
  for (const f of ['featured', 'published']) if (o[f] !== undefined) o[f] = !!o[f];
  return o;
}
const MEDIA_URL = /^(\/uploads\/[\w.-]+|https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[\w\-./%]+)$/i;
const validate = (db, o) => {
  if (o.section !== undefined && !db.sections.some(s => s.id === o.section)) return 'Chuyên mục không hợp lệ';
  for (const f of ['image', 'video']) if (o[f] && !MEDIA_URL.test(o[f])) return 'Đường dẫn tệp không hợp lệ';
  if (o.videoUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(o.videoUrl)) return 'Chỉ hỗ trợ link YouTube';
};

app.get('/api/admin/articles', requireAdmin, wrap(async (req, res) =>
  res.json([...(await loadDb(true)).articles].sort((a, b) => b.createdAt - a.createdAt))));
app.post('/api/admin/articles', requireAdmin, wrap(async (req, res) => {
  const db = await loadDb(true), o = pick(req.body);
  if (!o.title) return res.status(400).json({ error: 'Thiếu tiêu đề' });
  const err = validate(db, o); if (err) return res.status(400).json({ error: err });
  const a = { id: crypto.randomBytes(6).toString('hex'), title: '', section: db.sections[0].id, summary: '', content: '', image: '', video: '', videoUrl: '', featured: false, published: true, createdAt: Date.now(), updatedAt: Date.now(), ...o };
  db.articles.push(a); await saveDb(db); res.json(a);
}));
app.put('/api/admin/articles/:id', requireAdmin, wrap(async (req, res) => {
  const db = await loadDb(true), a = db.articles.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Không tìm thấy' });
  const o = pick(req.body), err = validate(db, o); if (err) return res.status(400).json({ error: err });
  Object.assign(a, o, { updatedAt: Date.now() }); await saveDb(db); res.json(a);
}));
app.delete('/api/admin/articles/:id', requireAdmin, wrap(async (req, res) => {
  const db = await loadDb(true); db.articles = db.articles.filter(x => x.id !== req.params.id); await saveDb(db); res.json({ ok: true });
}));
app.put('/api/admin/sections/:id', requireAdmin, wrap(async (req, res) => {
  const db = await loadDb(true), s = db.sections.find(x => x.id === req.params.id);
  if (!s || !req.body.name) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  s.name = String(req.body.name); await saveDb(db); res.json(s);
}));


// ---------- nội dung trang chủ ----------
const T = (v, n = 200) => String(v ?? '').slice(0, n);
const MEDIA = v => { v = String(v ?? ''); return v === '' || MEDIA_URL.test(v) ? v : ''; };
const LINK = v => { v = String(v ?? '').trim().slice(0, 300); return /^(#|\/(?!\/)|https?:\/\/|tel:|mailto:|[\w-]+\.html)/i.test(v) ? v : ''; };
const L = (arr, max, fn) => (Array.isArray(arr) ? arr : []).slice(0, max).map(fn);
function cleanSite(i = {}) {
  const o = i.multimedia || {}, sh = i.shop || {}, h = i.honors || {}, it = i.intro || {};
  return {
    hero: L(i.hero, 10, x => ({ image: MEDIA(x.image), line1: T(x.line1, 120), line2: T(x.line2, 120), button: T(x.button, 40), link: LINK(x.link) })),
    tournaments: L(i.tournaments, 8, x => ({ name: T(x.name, 100), homeName: T(x.homeName, 60), homeLogo: MEDIA(x.homeLogo), awayName: T(x.awayName, 60), awayLogo: MEDIA(x.awayLogo), date: T(x.date, 20), time: T(x.time, 20), ticketUrl: LINK(x.ticketUrl) })),
    intro: { line1: T(it.line1, 60), line2: T(it.line2, 60) },
    squad: L(i.squad, 60, x => ({ name: T(x.name, 60), number: T(x.number, 4), image: MEDIA(x.image) })),
    multimedia: { image: MEDIA(o.image), button: T(o.button, 40), link: LINK(o.link) },
    shop: { title: T(sh.title, 80), subtitle: T(sh.subtitle, 80), products: L(sh.products, 60, x => ({ id: /^[\w-]{2,24}$/.test(x.id || '') ? x.id : 'p' + crypto.randomBytes(4).toString('hex'), name: T(x.name, 80), price: Math.min(1e9, Math.max(0, Math.round(Number(x.price) || 0))), description: T(x.description, 600), image: MEDIA(x.image), link: LINK(x.link) })) },
    honors: { title: T(h.title, 80), banner: MEDIA(h.banner), items: L(h.items, 200, x => ({ year: T(x.year, 20), name: T(x.name, 120), result: ['champion', 'runner', 'third'].includes(x.result) ? x.result : 'champion' })) },
    footer: { brand: T((i.footer || {}).brand, 80), licenses: T((i.footer || {}).licenses, 1500), copyright: T((i.footer || {}).copyright, 200), instagram: LINK((i.footer || {}).instagram), about: T((i.footer || {}).about, 300), address: T((i.footer || {}).address, 200), phone: T((i.footer || {}).phone, 40), email: T((i.footer || {}).email, 100), facebook: LINK((i.footer || {}).facebook), youtube: LINK((i.footer || {}).youtube), tiktok: LINK((i.footer || {}).tiktok), zalo: LINK((i.footer || {}).zalo), bank: T((i.footer || {}).bank, 400) },
    sponsors: L(i.sponsors, 60, x => ({ name: T(x.name, 60), image: MEDIA(x.image), url: LINK(x.url) })),
  };
}
app.get('/api/site', wrap(async (req, res) => { res.json((await loadDb()).site || DEFAULT_SITE); }));
app.put('/api/admin/site', requireAdmin, wrap(async (req, res) => {
  const db = await loadDb(true); db.site = cleanSite(req.body); await saveDb(db); res.json(db.site);
}));


// ---------- tìm kiếm ----------
const norm = v => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
app.get('/api/search', wrap(async (req, res) => {
  const q = norm(req.query.q).trim().slice(0, 80);
  if (q.length < 2) return res.json([]);
  const words = q.split(/\s+/);
  const out = [];
  for (const a of (await loadDb()).articles) {
    if (!a.published) continue;
    const t = norm(a.title), hay = t + ' ' + norm(a.summary) + ' ' + norm(a.content);
    if (!words.every(w => hay.includes(w))) continue;
    out.push({ ...a, content: '', score: (t.includes(q) ? 10 : 0) + words.filter(w => t.includes(w)).length });
  }
  out.sort((a, b) => b.score - a.score || b.createdAt - a.createdAt);
  res.json(out.slice(0, 50));
}));

// ---------- bình luận ----------
const lastComment = new Map();
const visibleComment = (c, s) => ({ id: c.id, name: c.name, text: c.text, createdAt: c.createdAt, mine: !!s && (s.role === 'admin' || s.id === c.authorId) });
app.get('/api/articles/:id/comments', wrap(async (req, res) => {
  const s = session(req);
  const list = (await readStore('comments', [])).filter(c => c.articleId === req.params.id).sort((a, b) => a.createdAt - b.createdAt);
  res.json(list.map(c => visibleComment(c, s)));
}));
app.post('/api/articles/:id/comments', wrap(async (req, res) => {
  const s = session(req);
  if (!s) return res.status(401).json({ error: 'Vui lòng đăng nhập để bình luận' });
  const text = String((req.body || {}).text || '').trim().slice(0, 1000);
  if (text.length < 2) return res.status(400).json({ error: 'Bình luận quá ngắn' });
  const db = await loadDb();
  if (!db.articles.some(a => a.id === req.params.id && a.published)) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  const k = s.role + s.id;
  if (Date.now() - (lastComment.get(k) || 0) < 8000) return res.status(429).json({ error: 'Bạn bình luận quá nhanh, vui lòng đợi vài giây' });
  lastComment.set(k, Date.now());
  let name = 'Quản trị viên';
  if (s.role !== 'admin') { const u = (await loadUsers()).find(x => x.id === s.id); if (!u) return res.status(401).json({ error: 'Tài khoản không tồn tại' }); name = u.name; }
  const c = { id: crypto.randomBytes(6).toString('hex'), articleId: req.params.id, authorId: s.id, name, text, createdAt: Date.now() };
  await mutate('comments', [], list => { list.push(c); if (list.length > 20000) list.splice(0, list.length - 20000); });
  res.json(visibleComment(c, s));
}));
app.delete('/api/comments/:id', wrap(async (req, res) => {
  const s = session(req);
  if (!s) return res.status(401).json({ error: 'Chưa đăng nhập' });
  let removed = false;
  await mutate('comments', [], list => { const i = list.findIndex(c => c.id === req.params.id && (s.role === 'admin' || c.authorId === s.id)); if (i >= 0) { list.splice(i, 1); removed = true; } });
  removed ? res.json({ ok: true }) : res.status(404).json({ error: 'Không tìm thấy hoặc không có quyền' });
}));

// ---------- đơn hàng ----------
const orderHits = new Map();
const STATUSES = ['new', 'confirmed', 'shipping', 'done', 'cancelled'];
app.post('/api/orders', wrap(async (req, res) => {
  const now = Date.now(), hits = (orderHits.get(req.ip) || []).filter(t => now - t < 3600e3);
  if (hits.length >= 10) return res.status(429).json({ error: 'Bạn đặt hàng quá nhiều lần, vui lòng thử lại sau' });
  const b = req.body || {};
  const name = T(b.name, 80).trim(), phone = T(b.phone, 20).trim(), address = T(b.address, 250).trim(), note = T(b.note, 300).trim();
  if (name.length < 2) return res.status(400).json({ error: 'Vui lòng nhập họ tên' });
  if (!/^[0-9+\s().-]{8,16}$/.test(phone)) return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
  if (address.length < 5) return res.status(400).json({ error: 'Vui lòng nhập địa chỉ nhận hàng' });
  const products = ((await loadDb()).site || DEFAULT_SITE).shop.products;
  const items = [];
  for (const it of (Array.isArray(b.items) ? b.items : []).slice(0, 30)) {
    const p = products.find(x => x.id === it.id), qty = Math.round(Number(it.qty));
    if (!p || !(p.price > 0) || !(qty >= 1 && qty <= 99)) continue;
    const ex = items.find(x => x.id === p.id);
    if (ex) ex.qty = Math.min(99, ex.qty + qty); else items.push({ id: p.id, name: p.name, price: p.price, qty });
  }
  if (!items.length) return res.status(400).json({ error: 'Giỏ hàng trống hoặc sản phẩm không còn bán' });
  const order = {
    id: crypto.randomBytes(6).toString('hex'), code: 'DH' + String(crypto.randomInt(0, 1e6)).padStart(6, '0'),
    items, total: items.reduce((t, x) => t + x.price * x.qty, 0), name, phone, address, note,
    payment: b.payment === 'bank' ? 'bank' : 'cod', status: 'new', createdAt: now,
  };
  await mutate('orders', [], list => { list.push(order); });
  hits.push(now); orderHits.set(req.ip, hits);
  res.json({ code: order.code, total: order.total, payment: order.payment });
}));
app.get('/api/admin/orders', requireAdmin, wrap(async (req, res) => res.json((await readStore('orders', [])).sort((a, b) => b.createdAt - a.createdAt))));
app.put('/api/admin/orders/:id', requireAdmin, wrap(async (req, res) => {
  if (!STATUSES.includes((req.body || {}).status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  let ok = false;
  await mutate('orders', [], list => { const o = list.find(x => x.id === req.params.id); if (o) { o.status = req.body.status; ok = true; } });
  ok ? res.json({ ok: true }) : res.status(404).json({ error: 'Không tìm thấy đơn' });
}));
app.delete('/api/admin/orders/:id', requireAdmin, wrap(async (req, res) => {
  await mutate('orders', [], list => { const i = list.findIndex(x => x.id === req.params.id); if (i >= 0) list.splice(i, 1); });
  res.json({ ok: true });
}));

// upload ảnh (qua máy chủ) — ảnh đã được chỉnh/nén ở trình duyệt nên nhỏ
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  upload.single('file')(req, res, async err => {
    try {
      if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Tệp quá lớn (ảnh tối đa 4MB)' : err.message });
      if (!req.file) return res.status(400).json({ error: 'Tệp không hợp lệ (ảnh jpg/png/webp/gif, video mp4/webm/mov)' });
      if (BLOB) {
        const r = await blob.put('uploads/' + req.file.originalname.replace(/[^\w.-]/g, '_'), req.file.buffer, { access: 'public', addRandomSuffix: true, contentType: req.file.mimetype });
        return res.json({ url: r.url });
      }
      res.json({ url: '/uploads/' + req.file.filename });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Tải lên thất bại: ' + e.message }); }
  });
});

// upload video trực tiếp từ trình duyệt lên Vercel Blob (vượt giới hạn 4,5MB của hàm)
app.post('/api/admin/blob-token', wrap(async (req, res) => {
  if (!BLOB) return res.status(400).json({ error: 'Chưa bật Vercel Blob' });
  const { handleUpload } = require('@vercel/blob/client');
  const body = req.body || {};
  if (body.type === 'blob.generate-client-token' && !isAdmin(req)) return res.status(401).json({ error: 'Chưa đăng nhập' });
  const json = await handleUpload({
    body, request: req,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
      maximumSizeInBytes: 500 * 1024 * 1024, addRandomSuffix: true,
    }),
    onUploadCompleted: async () => {},
  });
  res.json(json);
}));

module.exports = app;
if (require.main === module) app.listen(PORT, () => console.log(`Chạy tại http://localhost:${PORT}  |  Quản trị: http://localhost:${PORT}/admin.html`));
