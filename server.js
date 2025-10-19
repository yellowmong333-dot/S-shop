const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ✅ Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ✅ Multer Cloudinary 저장소 설정
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sfoodgo_uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
const upload = multer({ storage });

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Render Keepalive용 Health Check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', express.static(path.join(__dirname, 'public')));

// ✅ 업로드 엔드포인트
app.post('/upload', upload.fields([{ name: 'mainImage' }, { name: 'detailImage' }]), (req, res) => {
  const files = req.files;
  res.json({
    mainImage: files.mainImage ? files.mainImage[0].path : null,
    detailImage: files.detailImage ? files.detailImage[0].path : null,
  });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
