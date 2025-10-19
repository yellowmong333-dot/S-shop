
const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ========= Cloudinary 설정 =========
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 업로드 스토리지(Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'sfoodgo_uploads',
    resource_type: 'auto',
    public_id: (file.originalname || 'upload').replace(/\.[^/.]+$/, ''),
  }),
});
const upload = multer({ storage });

const app = express();
const PORT = process.env.PORT || 3000;

// ========= 미들웨어 =========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 (사용자/관리자 UI는 기존 public 그대로 사용)
app.use('/', express.static(path.join(__dirname, 'public')));

// ========= 헬스 체크 (UptimeRobot) =========
app.get('/health', (req, res) => res.status(200).send('OK'));

// ========= 관리자 로그인 =========
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// 기존 경로(/api/admin/login)와 새 경로(/admin-login) 모두 허용
app.post(['/api/admin/login', '/admin-login'], (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASS) return res.json({ success: true });
  return res.status(401).json({ success: false });
});

// ========= 업로드 엔드포인트 =========
// - 경로 호환: /upload, /api/upload
// - 필드 호환: mainImage | main, detailImage | detail
app.post(['/upload', '/api/upload'], upload.any(), (req, res) => {
  try {
    let mainUrl = null;
    let detailUrl = null;

    (req.files || []).forEach((f) => {
      const url = f.path || f.secure_url || null;
      if (['mainImage', 'main'].includes(f.fieldname)) mainUrl = url;
      if (['detailImage', 'detail'].includes(f.fieldname)) detailUrl = url;
    });

    return res.json({
      success: true,
      result: { mainImage: mainUrl, detailImage: detailUrl },
    });
  } catch (err) {
    console.error('Upload failed:', err);
    return res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// ========= 서버 시작 =========
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
