// server.js (관리자 로그인/업로드/삭제/순서변경 포함 완전판)
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 기본 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 데이터 파일/폴더 준비
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ items: [] }, null, 2));

// 유틸
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function writeData(d) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

// 상품 목록 (사용자 페이지에서 사용)
app.get('/api/items', (req, res) => {
  const d = readData();
  res.json(d.items);
});

// multer 설정 (메인/상세 이미지 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique =
      Date.now() + '-' + Math.random().toString(36).slice(2, 8) + path.extname(file.originalname || '');
    cb(null, file.fieldname + '-' + unique);
  },
});
const upload = multer({ storage });

// 업로드 (관리자)
app.post('/api/upload', upload.fields([{ name: 'main' }, { name: 'detail' }]), (req, res) => {
  try {
    const files = req.files || {};
    const mainFile = files['main'] && files['main'][0] ? '/uploads/' + files['main'][0].filename : null;
    const detailFile = files['detail'] && files['detail'][0] ? '/uploads/' + files['detail'][0].filename : null;
    if (!mainFile || !detailFile) return res.status(400).json({ error: 'Both main and detail images required.' });

    const title = req.body.title || '';
    const d = readData();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    d.items.push({ id, title, main: mainFile, detail: detailFile });
    writeData(d);
    res.json({ ok: true, item: d.items[d.items.length - 1] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// 삭제 (관리자)
app.delete('/api/item/:id', (req, res) => {
  const id = req.params.id;
  const d = readData();
  const idx = d.items.findIndex((it) => it.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });

  // 파일 삭제 시도
  try {
    const it = d.items[idx];
    [it.main, it.detail].forEach((rel) => {
      if (!rel) return;
      const p = path.join(__dirname, rel.replace(/^\/+/, ''));
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  } catch (e) {
    console.error(e);
  }

  d.items.splice(idx, 1);
  writeData(d);
  res.json({ ok: true });
});

// 순서 변경 (관리자) - { order: [id, id, ...] }
app.post('/api/reorder', (req, res) => {
  const order = req.body.order;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' });

  const d = readData();
  const map = {};
  d.items.forEach((it) => (map[it.id] = it));

  const newItems = [];
  order.forEach((id) => {
    if (map[id]) newItems.push(map[id]);
  });
  // 누락된 항목 뒤에 보존
  d.items.forEach((it) => {
    if (!order.includes(it.id)) newItems.push(it);
  });

  d.items = newItems;
  writeData(d);
  res.json({ ok: true });
});

// 관리자 로그인 (환경변수 또는 기본값)
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
app.post('/api/admin/login', (req, res) => {
  const p = (req.body && req.body.password) || '';
  if (p === ADMIN_PASS) return res.json({ ok: true });
  return res.status(401).json({ error: 'unauthorized' });
});

// 서버 시작
app.listen(PORT, () => console.log('Server listening on', PORT));
