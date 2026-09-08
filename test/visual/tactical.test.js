import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
// Full expedition/reward/shop/victory coverage migrated to brand-expedition.test.js.
// Asset recovery is in brand-assets; touch/actual win/rematch in brand-foundation.
test('keyboard, blur pause and legacy-save preservation in the redesigned runtime',{timeout:90000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:360,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{await page.goto(host.url+'/gra?mode=quick');await page.evaluate(()=>localStorage.setItem('kurczoker.checkpoint.v1','legacy-preserved'));await page.reload();
  await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();await page.getByRole('button',{name:'Skok',exact:true}).waitFor();await page.getByRole('button',{name:'Pomiń wskazówki',exact:true}).click();
  await page.waitForFunction(()=>+document.querySelector('.battle-screen').dataset.simTime>1);const x=+(await page.locator('.battle-screen').getAttribute('data-player-x'));
  await page.keyboard.down('d');await page.waitForFunction(x=>+document.querySelector('.battle-screen').dataset.playerX>x+.5,x);await page.keyboard.up('d');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.getByRole('dialog',{name:'Pauza',exact:true}).waitFor();const time=await page.locator('.battle-screen').getAttribute('data-sim-time');await page.waitForTimeout(500);assert.equal(await page.locator('.battle-screen').getAttribute('data-sim-time'),time);
  await page.getByRole('button',{name:'Wznów grę',exact:true}).click();await page.getByRole('button',{name:'Celuj',exact:true}).click();const angle=page.getByRole('slider',{name:'Kąt',exact:true});await angle.focus();const before=+await angle.inputValue();await page.keyboard.press('ArrowRight');assert.equal(+await angle.inputValue(),before+1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('kurczoker.checkpoint.v1')),'legacy-preserved');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 }finally{await browser.close();await host.close()}
});
