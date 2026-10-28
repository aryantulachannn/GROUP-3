'use strict';
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(__dirname, '..');
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(root, 'edumarth.db');
if (!fs.existsSync(dbPath)) { console.error('Database not found:', dbPath); process.exit(1); }
const db = new DatabaseSync(dbPath, { timeout: 5000 });
db.exec('PRAGMA foreign_keys = ON');
// Preserve existing enquiries; add an idempotency key for safe retries.
if (!db.prepare('PRAGMA table_info(enquiries)').all().some(c => c.name === 'request_key')) db.exec('ALTER TABLE enquiries ADD COLUMN request_key TEXT');
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_enquiries_request_key ON enquiries(request_key)');
const app = express();
app.disable('x-powered-by');
app.use((req,res,next) => {
  res.set('X-Content-Type-Options','nosniff');
  res.set('Referrer-Policy','same-origin');
  if(req.path.startsWith('/api/')) res.set('Cache-Control','no-store');
  next();
});
app.use(express.json({limit:'16kb'}));
app.get('/api/health',(req,res) => res.json({status:'ok',products:db.prepare('SELECT COUNT(*) AS n FROM products').get().n}));
app.get('/api/categories',(req,res,next) => {try{res.json(db.prepare('SELECT category_id AS id, name FROM categories ORDER BY name').all());}catch(e){next(e);}});
app.get('/api/products',(req,res,next) => {
  try {
    const products=db.prepare('SELECT * FROM products ORDER BY product_id').all().map(p => {
      let features=[];try{const value=JSON.parse(p.features_json);if(Array.isArray(value))features=value.filter(f=>typeof f==='string');}catch{}
      return {id:p.product_id,category:p.category_id,name:p.name,description:p.description,price:p.price_cents,compareAt:p.compare_at_cents,image:p.image_path,stock:p.stock,features};
    });
    res.json(products);
  } catch(e){next(e);}
});
const topics=['Product enquiry','Website feedback','Accessibility issue','Project collaboration','General question'];
function validate(input) {
  const data={},errors={};
  for(const key of ['name','email','topic','subject','message']) data[key]=typeof input?.[key]==='string' ? input[key].trim() : '';
  if(data.name.length<2||data.name.length>100)errors.name='Enter a name between 2 and 100 characters.';
  if(data.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))errors.email='Enter a valid email address.';
  if(!topics.includes(data.topic))errors.topic='Choose a valid topic.';
  if(data.subject.length<3||data.subject.length>150)errors.subject='Enter a subject between 3 and 150 characters.';
  if(data.message.length<20||data.message.length>2000)errors.message='Enter a message between 20 and 2,000 characters.';
  return {data,errors};
}
app.post('/api/enquiries',(req,res,next) => {
  if(req.get('origin')) {
    try {if(new URL(req.get('origin')).host!==req.get('host'))return res.status(403).json({error:'Please submit using this website.'});}
    catch{return res.status(403).json({error:'Invalid origin.'});}
  }
  if(!req.is('application/json'))return res.status(415).json({error:'JSON content is required.'});
  const {data,errors}=validate(req.body);
  if(Object.keys(errors).length)return res.status(400).json({error:'Please check your form.',errors});
  const key=req.get('Idempotency-Key');
  if(typeof key!=='string'||! /^[a-zA-Z0-9-]{16,80}$/.test(key))return res.status(400).json({error:'Invalid submission key. Reload the page and retry.'});
  try {
    const existing=db.prepare('SELECT * FROM enquiries WHERE request_key=?').get(key);
    if(existing){
      if(!Object.entries(data).every(([k,v])=>existing[k]===v))return res.status(409).json({error:'Submission key already used. Edit the message and retry.'});
      return res.json({id:existing.enquiry_id,message:'Your enquiry is saved in the project database. No email has been sent.'});
    }
    const inserted=db.prepare('INSERT INTO enquiries(name,email,topic,subject,message,is_demo,request_key) VALUES(?,?,?,?,?,0,?)').run(data.name,data.email,data.topic,data.subject,data.message,key);
    res.status(201).json({id:Number(inserted.lastInsertRowid),message:'Your enquiry is saved in the project database. No email has been sent.'});
  }catch(e){next(e);}
});
// Serve only public files. The database, server code, backups and dependencies stay private.
const publicFiles=new Set(['index.html','about.html','contact.html','style.css','script.js','pages.js']);
app.use('/assets',express.static(path.join(root,'assets'),{dotfiles:'deny',index:false}));
app.get('/',(req,res)=>res.sendFile(path.join(root,'index.html')));
app.get('/:file',(req,res,next)=>publicFiles.has(req.params.file) ? res.sendFile(path.join(root,req.params.file)) : next());
app.use((req,res)=>res.status(404).json({error:'Not found.'}));
app.use((err,req,res,next)=>{
  if(err.type==='entity.too.large')return res.status(413).json({error:'Message is too large.'});
  if(err.type==='entity.parse.failed')return res.status(400).json({error:'Invalid JSON.'});
  console.error('Request failed:',err.message);res.status(500).json({error:'Unable to complete the request. Please try again.'});
});
const port=Number(process.env.PORT||3001);
const server=app.listen(port,'127.0.0.1',()=>console.log(`EduMarth website: http://127.0.0.1:${server.address().port}\nProducts API: http://127.0.0.1:${server.address().port}/api/products\nDatabase: ${dbPath}`));
server.on('error',err=>{console.error(err.code==='EADDRINUSE' ? `Port ${port} is in use. Stop the old server with Control+C, or use PORT=3002 npm start.` : err.message);db.close();process.exitCode=1;});
function shutdown(){server.close(()=>{db.close();process.exit(0);});}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
