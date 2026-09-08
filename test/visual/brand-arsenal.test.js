import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
test('arsenał przez UI: granat, odłamki, śrut, mina i kopniak',{timeout:240000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(host.url+'/gra?mode=quick',{waitUntil:'domcontentloaded'});
  for(const id of ['granajko','cluster','shotgun','mine','kick']){
   await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('[aria-label="Skok"]')?.disabled===false);
   await page.waitForFunction(()=>{const y=Number(document.querySelector('[data-player-y]')?.dataset.playerY);return y>3.03&&y<3.07});
   if(id==='kick') {
    await page.keyboard.down('d');await page.waitForFunction(()=>Number(document.querySelector('[data-player-x]').dataset.playerX)>8.6);
    await page.keyboard.press('Space');await page.waitForFunction(()=>Number(document.querySelector('[data-player-x]').dataset.playerX)>11.1);await page.keyboard.up('d');
    await page.waitForFunction(()=>{const y=Number(document.querySelector('[data-player-y]').dataset.playerY);return y>3.7&&y<3.85});
    await page.keyboard.down('d');await page.keyboard.press('Space');await page.waitForFunction(()=>Number(document.querySelector('[data-player-x]').dataset.playerX)>13.8);await page.keyboard.up('d');
    await page.waitForFunction(()=>{const y=Number(document.querySelector('[data-player-y]').dataset.playerY);return y>4.5&&y<4.6});
    await page.keyboard.down('d');await page.waitForFunction(()=>Number(document.querySelector('[data-player-x]').dataset.playerX)>15.9);await page.keyboard.up('d');
   }
   await page.getByRole('button',{name:'Celuj',exact:true}).click();
   await page.getByRole('combobox',{name:'Broń',exact:true}).selectOption(id);
   if(!['mine','kick'].includes(id)){await page.getByRole('slider',{name:'Kąt',exact:true}).fill(id==='granajko'?'-60':id==='cluster'?'70':'0');
   await page.getByRole('slider',{name:'Moc',exact:true}).fill(id==='cluster'?'10':'8');}
   await page.getByRole('button',{name:id==='mine'?'Postaw minę':id==='kick'?'Kopnij':'Strzel',exact:true}).click();
   if(id==='granajko')await page.waitForFunction(()=>Number(document.querySelector('[data-projectile-count]').dataset.projectileCount)>0);
   if(id==='cluster')await page.waitForFunction(()=>Number(document.querySelector('[data-projectile-count]').dataset.projectileCount)>1);
   if(id==='mine')await page.waitForFunction(()=>Number(document.querySelector('[data-mine-count]').dataset.mineCount)===1);
   if(id==='kick')await page.getByText(/35 HP/).waitFor();
   await page.screenshot({path:`.superpowers/makeover-qa/brand-weapon-${id}.png`});
   if(id==='granajko')await page.waitForFunction(()=>document.querySelector('[data-turn]').dataset.turn==='2');
   await page.getByRole('button',{name:'Pauza',exact:true}).click();
   await page.getByRole('button',{name:'Wróć do menu',exact:true}).click();
   console.log('weapon UI passed',id);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await host.close();}
});
