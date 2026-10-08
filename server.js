const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'data', 'db.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const SECRET_FILE = path.join(ROOT, 'data', '.secret');

// ---------- storage ----------
const DEFAULT_SECTIONS = [
  { id: 'thoi-su', name: 'Thời sự' },
  { id: 'an-ninh', name: 'An ninh - Trật tự' },
  { id: 'phap-luat', name: 'Pháp luật' },
  { id: 'giao-thong', name: 'Giao thông' },
  { id: 'video', name: 'Video' },
];

function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialPw = process.env.ADMIN_PASSWORD || 'admin123';
    const db = {
      admin: { username: process.env.ADMIN_USER || 'admin', ...hashPassword(initialPw) },
      sections: DEFAULT_SECTIONS,
      articles: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    console.log(`Đã tạo tài khoản admin: ${db.admin.username} / ${initialPw}  (hãy đổi mật khẩu sau khi đăng nhập)`);
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
let db = loadDb();
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

const SECRET = fs.existsSync(SECRET_FILE)
  ? fs.readFileSync(SECRET_FILE, 'utf8')
  : (() => { const s = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SECRET_FILE, s); return s; })();

// ---------- auth (signed cookie token) ----------
const sign = v => crypto.createHmac('sha256', SECRET).update(v).digest('hex');
function makeToken() {
  const exp = String(Date.now() + 12 * 3600 * 1000);
  return exp + '.' + sign(exp);
}
function validToken(t) {
  if (!t) return false;
  const [exp, sig] = t.split('.');
  if (!exp || !sig) return false;
  const good = Buffer.from(sign(exp));
  const got = Buffer.from(sig);
  return got.length === good.length && crypto.timingSafeEqual(got, good) && Number(exp) > Date.now();
}
function requireAdmin(req, res, next) {
  if (validToken(req.cookies.token)) return next();
  res.status(401).json({ error: 'Chưa đăng nhập' });
}

const attempts = new Map();
function rateLimitLogin(req, res, next) {
  const k = req.ip, now = Date.now();
  const a = (attempts.get(k) || []).filter(t => now - t < 15 * 60000);
  if (a.length >= 8) return res.status(429).json({ error: 'Thử quá nhiều lần, vui lòng đợi 15 phút' });
  a.push(now); attempts.set(k, a);
  next();
}

// ---------- uploads ----------
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov'];
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, IMAGE_EXT.includes(ext) || VIDEO_EXT.includes(ext));
  },
});

// ---------- app ----------
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR, { setHeaders: r => r.setHeader('X-Content-Type-Options', 'nosniff') }));
app.use(express.static(path.join(ROOT, 'public')));

const strip = a => ({ ...a });
const publicList = (q) => {
  let list = db.articles.filter(a => a.published);
  if (q.section) list = list.filter(a => a.section === q.section);
  if (q.featured) list = list.filter(a => a.featured);
  list.sort((a, b) => b.createdAt - a.createdAt);
  if (q.limit) list = list.slice(0, Number(q.limit));
  return list.map(strip);
};

app.get('/api/sections', (req, res) => res.json(db.sections));
app.get('/api/articles', (req, res) => res.json(publicList(req.query)));
app.get('/api/articles/:id', (req, res) => {
  const a = db.articles.find(x => x.id === req.params.id && (x.published || validToken(req.cookies.token)));
  a ? res.json(a) : res.status(404).json({ error: 'Không tìm thấy' });
});

// auth
app.post('/api/login', rateLimitLogin, (req, res) => {
  const { username, password } = req.body || {};
  const { admin } = db;
  const ok = username === admin.username && typeof password === 'string' &&
    crypto.timingSafeEqual(Buffer.from(hashPassword(password, admin.salt).hash), Buffer.from(admin.hash));
  if (!ok) return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
  res.cookie('token', makeToken(), { httpOnly: true, sameSite: 'strict', maxAge: 12 * 3600 * 1000 });
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/me', (req, res) => res.json({ admin: validToken(req.cookies.token) }));
app.post('/api/password', requireAdmin, (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Mật khẩu tối thiểu 8 ký tự' });
  Object.assign(db.admin, hashPassword(password));
  save(); res.json({ ok: true });
});

// admin: articles
app.get('/api/admin/articles', requireAdmin, (req, res) =>
  res.json([...db.articles].sort((a, b) => b.createdAt - a.createdAt)));

const FIELDS = ['title', 'section', 'summary', 'content', 'image', 'video', 'videoUrl', 'featured', 'published'];
function pick(body) {
  const o = {};
  for (const f of FIELDS) if (body[f] !== undefined) o[f] = body[f];
  for (const f of ['title', 'section', 'summary', 'content', 'image', 'video', 'videoUrl'])
    if (o[f] !== undefined) o[f] = String(o[f]);
  for (const f of ['featured', 'published']) if (o[f] !== undefined) o[f] = !!o[f];
  return o;
}
const validate = o => {
  if (o.section !== undefined && !db.sections.some(s => s.id === o.section)) return 'Chuyên mục không hợp lệ';
  for (const f of ['image', 'video']) if (o[f] && !/^\/uploads\/[\w.-]+$/.test(o[f])) return 'Đường dẫn tệp không hợp lệ';
  if (o.videoUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(o.videoUrl)) return 'Chỉ hỗ trợ link YouTube';
};

app.post('/api/admin/articles', requireAdmin, (req, res) => {
  const o = pick(req.body);
  if (!o.title) return res.status(400).json({ error: 'Thiếu tiêu đề' });
  const err = validate(o); if (err) return res.status(400).json({ error: err });
  const a = {
    id: crypto.randomBytes(6).toString('hex'), title: '', section: db.sections[0].id, summary: '', content: '',
    image: '', video: '', videoUrl: '', featured: false, published: true, createdAt: Date.now(), updatedAt: Date.now(), ...o,
  };
  db.articles.push(a); save(); res.json(a);
});
app.put('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const a = db.articles.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Không tìm thấy' });
  const o = pick(req.body);
  const err = validate(o); if (err) return res.status(400).json({ error: err });
  Object.assign(a, o, { updatedAt: Date.now() }); save(); res.json(a);
});
app.delete('/api/admin/articles/:id', requireAdmin, (req, res) => {
  db.articles = db.articles.filter(x => x.id !== req.params.id); save(); res.json({ ok: true });
});

// admin: sections (đổi tên chuyên mục)
app.put('/api/admin/sections/:id', requireAdmin, (req, res) => {
  const s = db.sections.find(x => x.id === req.params.id);
  if (!s || !req.body.name) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  s.name = String(req.body.name); save(); res.json(s);
});

// admin: upload
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  upload.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tệp không hợp lệ (chỉ ảnh jpg/png/webp/gif, video mp4/webm/mov)' });
    res.json({ url: '/uploads/' + req.file.filename });
  });
});

app.listen(PORT, () => console.log(`Chạy tại http://localhost:${PORT}  |  Quản trị: http://localhost:${PORT}/admin.html`));
