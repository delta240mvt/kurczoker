import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
test('a chicken can jump out from the stepped rim of an actual crater',{timeout:90000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:360,height:800},isMobile:true,hasTouch:true});
 try{await page.goto(host.url+'/gra?mode=quick');await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();await page.getByRole('button',{name:'Skok',exact:true}).waitFor();await page.getByRole('button',{name:'Pomiń wskazówki',exact:true}).click();
  await page.waitForFunction(()=>+document.querySelector('.battle-screen').dataset.simTime>1);await page.getByRole('button',{name:'Celuj',exact:true}).click();await page.getByRole('button',{name:'Strzel',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.battle-screen').dataset.turn==='2');await page.waitForTimeout(1000);
  const before=+await page.locator('.battle-screen').getAttribute('data-player-y');assert.ok(+await page.locator('.battle-screen').getAttribute('data-terrain-revision')>0);
  await page.getByRole('button',{name:'Skok',exact:true}).click();await page.waitForFunction(y=>+document.querySelector('.battle-screen').dataset.playerY>y+.2,before);await page.screenshot({path:'.superpowers/makeover-qa/release-crater-jump.png'});
 }finally{await browser.close();await host.close()}
});
test('pause freezes a live grenade and rope survives orientation change',{timeout:120000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{await page.goto(host.url+'/gra?mode=quick');await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  await page.getByRole('button',{name:'Pomiń wskazówki',exact:true}).click();await page.waitForFunction(()=>+document.querySelector('.battle-screen').dataset.simTime>1);
  await page.getByRole('button',{name:'Lasso',exact:true}).click();
  // Yard's overhead beam is visible in the rope camera, at world x=6,y=7.
  const point=await page.locator('.battle-screen').evaluate(e=>{const x=+e.dataset.playerX,y=+e.dataset.playerY,h=innerHeight,w=innerWidth,zoom=h/11;const half=11*w/h/2,cx=Math.max(half,x);return {x:w/2+(6-cx)*zoom,y:h/2-(7-(y+.2))*zoom}});
  await page.mouse.click(point.x,point.y);await page.getByRole('button',{name:'Puść lasso',exact:true}).waitFor();
  await page.setViewportSize({width:844,height:390});assert.equal(await page.locator('.battle-screen').getAttribute('data-rope'),'attached');assert.equal(await page.getByRole('button',{name:'Zwiń',exact:true}).isVisible(),true);
  await page.screenshot({path:'.superpowers/makeover-qa/release-rope-landscape.png'});await page.getByRole('button',{name:'Puść lasso',exact:true}).click();
  await page.getByRole('button',{name:'Celuj',exact:true}).click();await page.getByRole('combobox',{name:'Broń',exact:true}).selectOption('granajko');await page.getByRole('slider',{name:'Kąt',exact:true}).fill('70');await page.getByRole('button',{name:'Strzel',exact:true}).click();
  await page.getByRole('button',{name:'Pauza',exact:true}).click();await page.getByRole('dialog',{name:'Pauza',exact:true}).waitFor();
  const time=await page.locator('.battle-screen').getAttribute('data-sim-time'),count=await page.locator('.battle-screen').getAttribute('data-projectile-count');assert.ok(+count>0);await page.waitForTimeout(1000);assert.equal(await page.locator('.battle-screen').getAttribute('data-sim-time'),time);assert.equal(await page.locator('.battle-screen').getAttribute('data-projectile-count'),count);
  await page.getByRole('button',{name:'Wznów grę',exact:true}).click();await page.waitForFunction(()=>+document.querySelector('.battle-screen').dataset.turn>=2);assert.deepEqual(errors,[]);
 }finally{await browser.close();await host.close()}
});
