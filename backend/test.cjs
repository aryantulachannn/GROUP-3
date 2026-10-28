const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {randomUUID}=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
function start(dbPath){return new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[path.join(__dirname,'server.js')],{env:{...process.env,PORT:'0',DB_PATH:dbPath}});let output='';
 const timer=setTimeout(()=>{child.kill();reject(new Error('Server startup timed out: '+output));},8000);
 child.stdout.on('data',b=>{output+=b;const match=output.match(/EduMarth website: (http:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timer);resolve({child,url:match[1]});}});
 child.stderr.on('data',b=>output+=b);child.once('exit',code=>{clearTimeout(timer);if(!output.includes('EduMarth website:'))reject(new Error(output+' Exit '+code));});
});}
async function stop(child){if(child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});}
test('catalogue, contact persistence, validation, retry protection and private files',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'edumarth-test-'));const dbPath=path.join(dir,'test.db');fs.copyFileSync(path.join(__dirname,'..','edumarth.db'),dbPath);
 let running;
 try{
  let db=new DatabaseSync(dbPath);const before=db.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n;db.close();
  running=await start(dbPath);let url=running.url;
  const products=await (await fetch(url+'/api/products')).json();assert.equal(products.length,20);assert.equal(products[0].id,'edu-001');assert.equal(products[0].price,12999);assert(Array.isArray(products[0].features));
  assert.equal((await (await fetch(url+'/api/categories')).json()).length,4);
  for(const file of ['/','/about.html','/contact.html','/script.js','/pages.js','/assets/headphones.svg'])assert.equal((await fetch(url+file)).status,200,file);
  for(const file of ['/edumarth.db','/backend/server.js','/backend/package.json','/products.js','/api/enquiries','/backups/edumarth.db'])assert.equal((await fetch(url+file)).status,404,file);
  const headers={'Content-Type':'application/json','Idempotency-Key':randomUUID()};
  const data={name:'Integration Test',email:'test@example.invalid',topic:'Website feedback',subject:'API integration test',message:"A message with apostrophes: '); DROP TABLE products; --"};
  const post=(body,extra={})=>fetch(url+'/api/enquiries',{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});
  assert.equal((await post({...data,email:'invalid'})).status,400);
  assert.equal((await post({...data,message:'short'})).status,400);
  assert.equal((await post({...data,topic:'bad'})).status,400);
  assert.equal((await post({...data,name:{value:'bad'}})).status,400);
  assert.equal((await post(data,{Origin:'https://unrelated.example'})).status,403);
  assert.equal((await fetch(url+'/api/enquiries',{method:'POST',headers,body:'invalid JSON'})).status,400);
  assert.equal((await post({...data,message:'x'.repeat(20000)})).status,413);
  let response=await post(data);assert.equal(response.status,201);const saved=await response.json();assert(Number.isInteger(saved.id));
  response=await post(data);assert.equal(response.status,200);assert.equal((await response.json()).id,saved.id);
  assert.equal((await post({...data,subject:'Different payload'})).status,409);
  db=new DatabaseSync(dbPath);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n,before+1);const row=db.prepare('SELECT * FROM enquiries WHERE enquiry_id=?').get(saved.id);assert.equal(row.message,data.message);assert.equal(row.is_demo,0);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM products').get().n,20);db.close();
  await stop(running.child);running=await start(dbPath);url=running.url;
  response=await post(data);assert.equal(response.status,200);assert.equal((await response.json()).id,saved.id);
  console.log('Verified enquiry survives restart; retries are deduplicated; database and backend source are not public.');
 }finally{if(running)await stop(running.child);fs.rmSync(dir,{recursive:true,force:true});}
});
