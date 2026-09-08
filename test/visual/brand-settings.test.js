import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
test('settings persist and large mirrored controls remain usable in both orientations',{timeout:120000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(host.url+'/gra?mode=quick');await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Ustawienia',exact:true}).count(),1);
  await page.getByRole('button',{name:'Ustawienia',exact:true}).click();await page.getByRole('combobox',{name:'Wielkość przycisków',exact:true}).selectOption('1.25');
  await page.getByRole('checkbox',{name:'Sterowanie leworęczne',exact:true}).check();await page.getByRole('checkbox',{name:'Ogranicz ruch i efekty',exact:true}).check();
  await page.getByRole('slider',{name:'Głośność muzyki',exact:true}).fill('0');await page.getByRole('slider',{name:'Głośność efektów',exact:true}).fill('0.4');await page.getByRole('combobox',{name:'Jakość grafiki',exact:true}).selectOption('low');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('dialog')),true);
  await page.getByRole('button',{name:'Gotowe',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Ustawienia',exact:true}).click();
  assert.equal(await page.getByRole('combobox',{name:'Wielkość przycisków',exact:true}).inputValue(),'1.25');assert.equal(await page.getByRole('slider',{name:'Głośność muzyki',exact:true}).inputValue(),'0');
  await page.getByRole('button',{name:'Gotowe',exact:true}).click();await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  if(await page.getByRole('button',{name:'Pomiń wskazówki',exact:true}).count())await page.getByRole('button',{name:'Pomiń wskazówki',exact:true}).click();
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);assert.equal(await page.locator('.brand-hud').getAttribute('data-scale'),'1.25');assert.equal(await page.locator('.battle-screen').getAttribute('data-shake'),'off');
   const left=await page.getByRole('button',{name:'W lewo',exact:true}).boundingBox(),jump=await page.getByRole('button',{name:'Skok',exact:true}).boundingBox();assert.ok(left.x>jump.x);assert.ok(left.height>=48&&jump.height>=48);
   await page.getByRole('button',{name:'Celuj',exact:true}).click();assert.equal(await page.getByRole('slider',{name:'Kąt',exact:true}).isVisible(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'.superpowers/makeover-qa/settings-large-'+viewport.width+'.png'});
  }
  await page.getByRole('button',{name:'Pauza',exact:true}).click();await page.getByRole('button',{name:'Pomoc',exact:true}).click();await page.getByRole('heading',{name:'Jak zrobić rozróbę?',exact:true}).waitFor();
  await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Pauza',exact:true}).waitFor();await page.getByRole('button',{name:'Wznów grę',exact:true}).click();assert.deepEqual(errors,[]);
 }finally{await browser.close();await host.close()}
});
