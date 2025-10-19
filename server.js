
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
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
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.status(200).send('OK'));
const DATA_FILE = path.join(__dirname, 'data.json');
function readData() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch(e){ return { items: [] }; }}
function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
if (!fs.existsSync(DATA_FILE)) writeData({ items: [] });
app.post(['/api/admin/login', '/admin-login'], (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASS) return res.json({ success: true });
  return res.status(401).json({ success: false });
});
app.get('/api/items', (req, res) => {
  const data = readData();
  data.items.sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
  res.json({ items: data.items });
});
app.post(['/upload', '/api/upload'], upload.any(), (req, res) => {
  try {
    let mainUrl = null, detailUrl = null;
    (req.files || []).forEach(f => {
      const url = f.path || f.secure_url || null;
      if (['mainImage','main'].includes(f.fieldname)) mainUrl = url;
      if (['detailImage','detail'].includes(f.fieldname)) detailUrl = url;
    });
    const name = (req.body && (req.body.name || req.body.title)) || '';
    const data = readData();
    const id = Date.now().toString();
    const order = (data.items.length ? Math.max(...data.items.map(i=>i.order||0))+1 : 1);
    const item = { id, name, mainUrl, detailUrl, order, createdAt: new Date().toISOString() };
    data.items.push(item);
    writeData(data);
    return res.json({ success:true, item });
  } catch(err){
    console.error('Upload failed:', err);
    return res.status(500).json({ success:false, error:'Upload failed' });
  }
});
app.post('/api/reorder', (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids)) return res.status(400).json({ success:false });
    const data = readData();
    data.items.forEach(i => { const idx = ids.indexOf(i.id); if (idx !== -1) i.order = idx+1; });
    writeData(data);
    res.json({ success:true });
  } catch(e){ res.status(500).json({ success:false }); }
});
app.delete('/api/item/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const before = data.items.length;
  data.items = data.items.filter(i => i.id !== id);
  writeData(data);
  res.json({ success: before !== data.items.length });
});
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
