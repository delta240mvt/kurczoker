import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1024,height:576}});
 await page.goto(process.argv[2]??'http://127.0.0.1:57728/gra?mode=quick');
 await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
 await page.getByRole('button',{name:'Pomiń wskazówki',exact:true}).click();
 await page.waitForTimeout(1500);
 const poster=await page.locator('canvas').screenshot({type:'png'});
 await page.evaluate(()=>{const canvas=document.querySelector('canvas');window.demoChunks=[];window.demoRecorder=new MediaRecorder(canvas.captureStream(24),{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:900000});window.demoRecorder.ondataavailable=e=>window.demoChunks.push(e.data);window.demoRecorder.start()});
 await page.keyboard.down('ArrowRight');await page.keyboard.press('Space');await page.waitForTimeout(1700);await page.keyboard.up('ArrowRight');
 await page.keyboard.press('Space');await page.waitForTimeout(1300);
 await page.getByRole('button',{name:'Celuj',exact:true}).click();await page.getByRole('slider',{name:'Kąt',exact:true}).fill('25');await page.getByRole('slider',{name:'Moc',exact:true}).fill('9');await page.getByRole('button',{name:'Strzel',exact:true}).click();await page.waitForTimeout(7000);
 const data=await page.evaluate(()=>new Promise(resolve=>{window.demoRecorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(window.demoChunks).arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);resolve(btoa(binary));window.demoRecorder.stream.getTracks().forEach(t=>t.stop())};window.demoRecorder.stop()}));
 const manifestPath='src/engine/tactical/releaseManifest.json',manifest=JSON.parse(await readFile(manifestPath,'utf8'));manifest.assets=manifest.assets.filter(a=>!['demo','demo-poster'].includes(a.id));
 await mkdir('public/game/release',{recursive:true});
 for(const [id,bytes,ext,kind] of [['demo',Buffer.from(data,'base64'),'webm','video'],['demo-poster',poster,'png','image']]){const sha256=createHash('sha256').update(bytes).digest('hex'),url='/game/release/'+id+'.'+sha256.slice(0,12)+'.'+ext;await writeFile('public'+url,bytes);manifest.assets.push({id,url,bytes:bytes.length,sha256,kind,provenance:'Actual KURCZOKER gameplay captured from the production build using keyboard and game UI; tools/record-game-demo.mjs'})}
 await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');console.log('Recorded real gameplay and poster.');
}finally{await browser.close()}
