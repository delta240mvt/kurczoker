import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serveBuild} from '../test/visual/server.js';
const host=process.argv[2]?null:await serveBuild();
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1024,height:576}});
 await page.goto(process.argv[2]??`${host.url}/gra?mode=quick&map=yard`);
 await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();
 await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
 await page.getByRole('button',{name:'Pomiń wskazówki',exact:true}).click();
 await page.waitForFunction(()=>{const e=document.querySelector('.battle-screen');return e?.dataset.battlePhase==='player'&&JSON.parse(e.dataset.actors).find(a=>a.team==='player')?.grounded});
 await page.evaluate(()=>{
  const source=document.querySelector('canvas'),canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=576;const ctx=canvas.getContext('2d');
  const draw=()=>{ctx.drawImage(source,0,0,1024,576);window.demoFrame=requestAnimationFrame(draw)};draw();
  window.demoChunks=[];
  window.demoRecorder=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:1800000});
  window.demoRecorder.ondataavailable=e=>window.demoChunks.push(e.data);
  window.demoRecorder.start();
 });
 let poster;
 for(let turn=0;turn<3;turn++){
  await page.getByRole('button',{name:'Ruch',exact:true}).click();
  await page.evaluate(()=>document.activeElement?.blur());
  if(turn)await page.evaluate(()=>window.demoRecorder.resume());
  await page.keyboard.down(turn===1?'ArrowLeft':'ArrowRight');
  await page.keyboard.press('Space');
  await page.waitForTimeout(650);
  if(!poster)poster=await page.locator('canvas').screenshot({type:'png'});
  await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(250);
  await page.evaluate(()=>window.demoRecorder.pause());
  await page.getByRole('button',{name:'Celuj',exact:true}).click();
  await page.getByRole('combobox',{name:'Broń',exact:true}).selectOption('jajooka');
  await page.getByRole('slider',{name:'Kąt',exact:true}).fill(String([35,50,25][turn]));
  await page.getByRole('slider',{name:'Moc',exact:true}).fill(String([12,10,14][turn]));
  await page.evaluate(()=>window.demoRecorder.resume());
  await page.getByRole('button',{name:'Strzel',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.battle-screen')?.dataset.battlePhase!=='player');
  await page.waitForFunction(()=>{const e=document.querySelector('.battle-screen');return !e||['player','finished'].includes(e.dataset.battlePhase)},{},{timeout:45000});
  await page.waitForTimeout(200);
  await page.evaluate(()=>window.demoRecorder.pause());
  const state=await page.locator('.battle-screen').getAttribute('data-battle-phase').catch(()=>null);
  console.log('Captured exchange',turn+1,state);
  if(state!=='player')break;
 }
 const data=await page.evaluate(()=>new Promise(resolve=>{
  window.demoRecorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(window.demoChunks).arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);resolve(btoa(binary));cancelAnimationFrame(window.demoFrame);window.demoRecorder.stream.getTracks().forEach(t=>t.stop())};window.demoRecorder.stop();
 }));
 const manifestPath='src/engine/tactical/releaseManifest.json',manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 manifest.assets=manifest.assets.filter(a=>!['demo','demo-poster'].includes(a.id));
 await mkdir('public/game/release',{recursive:true});
 for(const [id,bytes,ext,kind] of [['demo',Buffer.from(data,'base64'),'webm','video'],['demo-poster',poster,'png','image']]){
  const sha256=createHash('sha256').update(bytes).digest('hex'),url='/game/release/'+id+'.'+sha256.slice(0,12)+'.'+ext;
  await writeFile('public'+url,bytes);
  manifest.assets.push({id,url,bytes:bytes.length,sha256,kind,provenance:'Actual KURCZOKER gameplay captured using keyboard and game UI; aiming setup omitted with recorder pause; tools/record-game-demo.mjs'});
 }
 await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 console.log('Recorded real gameplay and action poster.');
}finally{await browser.close();await host?.close()}
