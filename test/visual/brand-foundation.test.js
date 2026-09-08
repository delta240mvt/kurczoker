import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
 test(`Podwórze przez UI ${viewport.width}x${viewport.height}`,{timeout:120000},async()=>{
 const host=process.env.KURCZOKER_VISUAL_BASE_URL?{url:process.env.KURCZOKER_VISUAL_BASE_URL,close:async()=>{}}:await serveBuild();
 const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport,hasTouch:viewport.width<1000,isMobile:viewport.width<1000});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(host.url+'/gra?mode=quick',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click({timeout:15000});
  await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  await page.getByRole('button',{name:'Pauza',exact:true}).click();
  await page.getByRole('dialog',{name:'Pauza',exact:true}).waitFor();
  await page.getByRole('button',{name:'Wznów grę',exact:true}).click();
  if(viewport.width===390) {
   await page.waitForFunction(()=>{const y=Number(document.querySelector('[data-player-y]')?.dataset.playerY);return y>3.03&&y<3.07});
   const startX=Number(await page.locator('.battle-screen').getAttribute('data-player-x'));
   const right=await page.getByRole('button',{name:'W prawo',exact:true}).boundingBox();
   const jump=await page.getByRole('button',{name:'Skok',exact:true}).boundingBox();
   const cdp=await page.context().newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
    {id:1,x:right.x+right.width/2,y:right.y+right.height/2},
    {id:2,x:jump.x+jump.width/2,y:jump.y+jump.height/2}]});
   try{await page.waitForFunction(x=>{const e=document.querySelector('.battle-screen');return Number(e.dataset.playerX)>x+.15&&Number(e.dataset.playerY)>3.4},startX);}
   finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
   await page.waitForFunction(()=>Number(document.querySelector('[data-player-y]')?.dataset.playerY)<3.1);
  }
  const dims=await page.evaluate(()=>({w:innerWidth,doc:document.documentElement.scrollWidth}));assert.equal(dims.w,dims.doc);
  await page.getByRole('button',{name:'Mapa',exact:true}).click();
  await page.getByRole('button',{name:'Do kurczaka',exact:true}).click();
  await page.getByRole('button',{name:'Narzędzia',exact:true}).click();
  await page.getByRole('button',{name:'Wiertło',exact:true}).click();
  await page.getByRole('button',{name:'Użyj narzędzia',exact:true}).click();
  await page.getByRole('button',{name:'Celuj',exact:true}).click();
  await page.getByRole('slider',{name:'Kąt'}).fill('-90');
  await page.getByRole('button',{name:'Strzel',exact:true}).click();
  await page.waitForFunction(()=>Number(document.querySelector('[data-terrain-revision]')?.dataset.terrainRevision)>0);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`.superpowers/makeover-qa/brand-${viewport.width}.png`});
 }finally{await browser.close();await host.close();}
 });
}

test('Podwórze: dwa skoki na wzgórze, wymiana ataków, zwycięstwo i rewanż',{timeout:180000},async()=>{
 const host=process.env.KURCZOKER_VISUAL_BASE_URL?{url:process.env.KURCZOKER_VISUAL_BASE_URL,close:async()=>{}}:await serveBuild();
 const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(host.url+'/gra?mode=quick',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();
  await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('[aria-label="Skok"]')?.disabled===false);
  await page.keyboard.down('d');
  await page.waitForFunction(()=>Number(document.querySelector('[data-player-x]')?.dataset.playerX)>8.6);
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>Number(document.querySelector('[data-player-x]')?.dataset.playerX)>11.1);
  await page.keyboard.up('d');
  await page.waitForFunction(()=>{const y=Number(document.querySelector('[data-player-y]')?.dataset.playerY);return y>3.7&&y<3.85});
  await page.keyboard.down('d');await page.keyboard.press('Space');
  await page.waitForFunction(()=>Number(document.querySelector('[data-player-x]')?.dataset.playerX)>13.8);
  await page.keyboard.up('d');
  await page.waitForFunction(()=>{const y=Number(document.querySelector('[data-player-y]')?.dataset.playerY);return y>4.5&&y<4.6});
  await page.getByRole('button',{name:'Celuj',exact:true}).click();
  await page.getByRole('slider',{name:'Kąt',exact:true}).fill('5');
  await page.getByRole('slider',{name:'Moc',exact:true}).fill('8');
  await page.getByRole('button',{name:'Strzel',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-turn]')?.dataset.turn==='2');
  await page.getByRole('button',{name:'Strzel',exact:true}).click();
  await page.getByRole('heading',{name:'Pięknie poleciały pióra.',exact:true}).waitFor({timeout:30000});
  await page.screenshot({path:'.superpowers/makeover-qa/brand-desktop-victory.png'});
  await page.getByRole('button',{name:'Rewanż',exact:true}).click();
  await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await host.close();}
});
