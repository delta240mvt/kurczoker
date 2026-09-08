import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
test('wybór dziewięciu map, dwie potyczki i świeży rewanż bez zmiany zapisu',{timeout:180000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{await page.goto(host.url+'/gra?mode=quick',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Podwórze',exact:true}).waitFor();
  await page.evaluate(()=>localStorage.setItem('kurczoker-save',JSON.stringify({runId:'preserve-fixture',stage:2})));
  const original=await page.evaluate(()=>localStorage.getItem('kurczoker-save'));
  assert.equal(await page.locator('.brand-map-grid button').count(),9);
  await page.getByRole('button',{name:'Jaskinie',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Jaskinie',exact:true}).getAttribute('aria-pressed'),'true');
  await page.screenshot({path:'.superpowers/makeover-qa/quick-select-phone.png'});
  for(const name of ['Jaskinie','Podwórze']){
   await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();
   await page.waitForFunction(()=>+document.querySelector('[data-sim-time]')?.dataset.simTime>1);
   await page.getByRole('button',{name:'Celuj',exact:true}).click();
   const select=page.getByRole('combobox',{name:'Broń',exact:true});assert.equal(await select.locator('option').count(),6);
   await select.selectOption('cluster');await page.getByRole('slider',{name:'Kąt',exact:true}).fill('90');await page.getByRole('button',{name:'Strzel',exact:true}).click();
   await page.waitForFunction(()=>+document.querySelector('[data-turn]').dataset.turn>=2||document.querySelector('[data-battle-phase]').dataset.battlePhase==='finished');
   await page.getByRole('button',{name:'Pauza',exact:true}).click();await page.getByRole('button',{name:'Wróć do menu',exact:true}).click();
  }
  await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();await page.waitForFunction(()=>+document.querySelector('[data-sim-time]')?.dataset.simTime>1);
  assert.equal(await page.locator('[data-terrain-revision]').getAttribute('data-terrain-revision'),'0');
  await page.getByRole('button',{name:'Celuj',exact:true}).click();assert.match(await page.getByRole('combobox',{name:'Broń'}).locator('option[value="cluster"]').textContent(),/1/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('kurczoker-save')),original);assert.deepEqual(errors,[]);
 }finally{await browser.close();await host.close()}
});
