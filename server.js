const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ====== 환경변수(Cloudinary / 관리자 비번) ======
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// ====== 앱/포트(포트 10000 고정) ======
const app = express();
const PORT = 10000;

// ====== 미들웨어 ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일
app.use('/', express.static(path.join(__dirname, 'public')));

// 데이터 파일
const DATA_FILE = path.join(__dirname, 'data.json');
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ items: [] }, null, 2));
}
const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeData = (d) => fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));

// 헬스체크
app.get('/health', (_, res) => res.status(200).send('OK'));

// ====== Cloudinary 업로드 스토리지 ======
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'sfshop_uploads',
    resource_type: 'auto',                 // 이미지/동영상 자동
    public_id: Date.now() + '-' + file.originalname.replace(/\s+/g, '_')
  })
});
const upload = multer({ storage });

// ====== API ======

// 관리자 로그인 (단순 비번)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASS) return res.json({ success: true });
  return res.status(401).json({ success: false });
});

// 목록 조회
app.get('/api/items', (_, res) => {
  const data = readData();
  res.json({ success: true, items: data.items });
});

// 업로드(제목 + 메인/상세)
app.post('/api/upload', upload.fields([{ name: 'mainImage' }, { name: 'detailImage' }]), (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const main = req.files?.mainImage?.[0]?.path || null;
    const detail = req.files?.detailImage?.[0]?.path || null;

    if (!main) return res.status(400).json({ success: false, error: '메인 이미지가 필요합니다.' });

    const data = readData();
    data.items.push({
      id: String(Date.now()),
      title,
      mainUrl: main,
      detailUrl: detail,
      createdAt: Date.now()
    });
    writeData(data);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// 순서 저장 (id 배열)
app.post('/api/order', (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ success: false });

  const data = readData();
  const map = new Map(data.items.map(it => [it.id, it]));
  const reordered = ids.map(id => map.get(id)).filter(Boolean);
  data.items = reordered;
  writeData(data);
  res.json({ success: true });
});

// 개별 삭제
app.delete('/api/item/:id', (req, res) => {
  const id = req.params.id;
  const data = readData();
  const before = data.items.length;
  data.items = data.items.filter(it => it.id !== id);
  writeData(data);
  res.json({ success: true, removed: before - data.items.length });
});

// 상세 보기용(데이터만)
app.get('/api/item/:id', (req, res) => {
  const id = req.params.id;
  const data = readData();
  const it = data.items.find(x => x.id === id);
  if (!it) return res.status(404).json({ success: false });
  res.json({ success: true, item: it });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
