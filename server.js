const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ✅ Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static(path.join(__dirname, 'public')));

// ✅ 헬스 체크 (UptimeRobot용)
app.get('/health', (req, res) => res.status(200).send('OK'));

// ✅ Cloudinary 업로드 스토리지 설정
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'sfshop_uploads',
    resource_type: 'auto',
    public_id: file.originalname.split('.')[0]
  }),
});

const upload = multer({ storage });

// ✅ 업로드 엔드포인트 (호환 버전)
app.post(['/api/upload', '/upload'], upload.any(), (req, res) => {
  try {
    // multer.any()로 들어온 파일들을 필드명 호환 처리
    let mainUrl = null;
    let detailUrl = null;

    (req.files || []).forEach(f => {
      if (['mainImage', 'main'].includes(f.fieldname)) mainUrl = f.path;
      if (['detailImage', 'detail'].includes(f.fieldname)) detailUrl = f.path;
    });

    // 업로드가 하나도 없더라도 응답은 정상적으로 반환
    res.json({
      success: true,
      result: {
        mainImage: mainUrl,
        detailImage: detailUrl
      }
    });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});


// ✅ 관리자 비밀번호 (환경변수)
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// ✅ 기존 + 새 버전 모두 지원
app.post(['/api/admin/login', '/admin-login'], (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
