const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use('/', express.static(path.join(__dirname,'public')));
app.use('/uploads', express.static(path.join(__dirname,'uploads')));
const DATA_FILE = path.join(__dirname, 'data.json');
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({items:[]},null,2));
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
function readData(){return JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));}
function writeData(d){fs.writeFileSync(DATA_FILE, JSON.stringify(d,null,2));}
const storage = multer.diskStorage({
  destination:(req,file,cb)=>cb(null,UPLOAD_DIR),
  filename:(req,file,cb)=>cb(null,Date.now()+'-'+file.originalname)
});
const upload = multer({storage});
app.get('/api/items',(req,res)=>res.json(readData().items));
app.post('/api/upload', upload.fields([{name:'main'},{name:'detail'}]), (req,res)=>{
  const d = readData();
  const id = Date.now().toString();
  d.items.push({id,main:'/uploads/'+req.files['main'][0].filename,detail:'/uploads/'+req.files['detail'][0].filename});
  writeData(d);
  res.json({ok:true});
});
app.listen(PORT,()=>console.log('server running on '+PORT));
