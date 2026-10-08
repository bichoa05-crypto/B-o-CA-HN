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
  { id: 'thoi-su', name: 'Thời sự' },
  { id: 'an-ninh', name: 'An ninh - Trật tự' },
  { id: 'phap-luat', name: 'Pháp luật' },
  { id: 'giao-thong', name: 'Giao thông' },
  { id: 'video', name: 'Video' },
];

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
      db = { sections: DEFAULT_SECTIONS, articles: [] };
      await saveDb(db);
    }
  } else {
    if (!fs.existsSync(DB_FILE)) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      const pw = ENV_PASSWORD || 'admin123';
      fs.writeFileSync(DB_FILE, JSON.stringify({ admin: { username: ENV_USER, ...hashPassword(pw) }, sections: DEFAULT_SECTIONS, articles: [] }, null, 2));
      console.log(`Đã tạo tài khoản admin: ${ENV_USER} / ${pw}`);
    }
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  cache = db; cacheAt = Date.now();
  return db;
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

// ---------- users (kho riêng, tên tệp khó đoán) ----------
const USERS_KEY = 'data/users-' + sign('users').slice(0, 24) + '.json';
const USERS_FILE = path.join(ROOT, 'data', 'users.json');
async function loadUsers() {
  if (BLOB) {
    try { const info = await blob.head(USERS_KEY); return await (await fetch(info.url + '?t=' + Date.now(), { cache: 'no-store' })).json(); }
    catch (e) { if (isNotFound(e)) return []; throw e; }
  }
  return fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) : [];
}
async function saveUsers(list) {
  if (BLOB) await blob.put(USERS_KEY, JSON.stringify(list), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  else { fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true }); fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2)); }
}

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

app.get('/api/config', (req, res) => res.json({ blob: BLOB }));

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
  if (ENV_PASSWORD) isAdminLogin = !!(safeEq(u.toLowerCase(), ENV_USER.toLowerCase()) & safeEq(password.trim(), ENV_PASSWORD));
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
