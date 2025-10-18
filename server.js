const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({items:[]}, null, 2));

// serve front-end static
app.use('/', express.static(path.join(__dirname, 'public')));
// serve uploads
app.use('/uploads', express.static(UPLOAD_DIR));

// helpers
function readData(){ return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function writeData(d){ fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

// list items for user page
app.get('/api/items', (req, res) => {
  const d = readData();
  res.json(d.items);
});

// multer setup for two files: main and detail
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOAD_DIR); },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.random().toString(36).substr(2,6);
    const ext = path.extname(file.originalname) || '';
    cb(null, file.fieldname + '-' + unique + ext);
  }
});
const upload = multer({ storage });

// upload endpoint: expects 'main' and 'detail' files and title(optional)
app.post('/api/upload', upload.fields([{name:'main'},{name:'detail'}]), (req, res) => {
  try{
    const files = req.files || {};
    const mainFile = files['main'] && files['main'][0] ? '/uploads/' + files['main'][0].filename : null;
    const detailFile = files['detail'] && files['detail'][0] ? '/uploads/' + files['detail'][0].filename : null;
    if(!mainFile || !detailFile) return res.status(400).json({error:'Both main and detail images required.'});
    const title = req.body.title || '';
    const d = readData();
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
    d.items.push({id, title, main: mainFile, detail: detailFile});
    writeData(d);
    res.json({ok:true, item: d.items[d.items.length-1]});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'server error'});
  }
});

// delete an item by id
app.delete('/api/item/:id', (req, res) => {
  const id = req.params.id;
  const d = readData();
  const idx = d.items.findIndex(it=>it.id===id);
  if(idx===-1) return res.status(404).json({error:'not found'});
  // remove files
  try{
    const it = d.items[idx];
    [it.main, it.detail].forEach(rel => {
      if(!rel) return;
      const p = path.join(__dirname, rel.replace(/^\/+/,""));
      if(fs.existsSync(p)) fs.unlinkSync(p);
    });
  }catch(e){ console.error(e); }
  d.items.splice(idx,1);
  writeData(d);
  res.json({ok:true});
});

// reorder: accepts JSON {order: [id,...]}
app.post('/api/reorder', (req, res) => {
  const order = req.body.order;
  if(!Array.isArray(order)) return res.status(400).json({error:'order array required'});
  const d = readData();
  const map = {};
  d.items.forEach(it=>map[it.id]=it);
  const newItems = [];
  order.forEach(id => { if(map[id]) newItems.push(map[id]); });
  // append any missing items
  d.items.forEach(it => { if(!order.includes(it.id)) newItems.push(it); });
  d.items = newItems;
  writeData(d);
  res.json({ok:true});
});

// simple admin auth - compare against ENV or default password 'admin123'
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
app.post('/api/admin/login', (req, res) => {
  const p = req.body.password || '';
  if(p === ADMIN_PASS) return res.json({ok:true});
  return res.status(401).json({error:'unauthorized'});
});

app.listen(PORT, ()=>console.log('Server listening on', PORT));
