import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
import {fight} from './fight-driver.js';
test('wyprawa przez UI: ruch, zapis po strzale, nagrody, sklep i finał',{timeout:900000},async()=>{
 const host=process.env.KURCZOKER_VISUAL_BASE_URL?{url:process.env.KURCZOKER_VISUAL_BASE_URL,close:async()=>{}}:await serveBuild();
 const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  // Fix Date only; rAF and timers remain real. Seed 1 stabilizes route/reward
  // choices without changing health, physics, inventory, or battle outcomes.
  await page.clock.setFixedTime(new Date(1));
  await page.goto(host.url+'/gra?mode=expedition');await page.getByRole('button',{name:'Rozpocznij wyprawę',exact:true}).click();
  await page.getByRole('button',{name:'Wejdź na planszę',exact:true}).click();
  let fights=0,retries=0,shops=0;
  while(fights<6){
   await fight(page);fights++;
   await page.screenshot({path:`.superpowers/makeover-qa/expedition-${fights}.png`});
   const scene=await page.locator('[data-scene]').getAttribute('data-scene');
   if(scene==='retry'){retries++;await page.getByRole('button',{name:'Wykorzystaj drugą szansę',exact:true}).click();continue}
   if(scene==='result')break;
   assert.equal(scene,'reward');const choices=page.locator('.brand-choice-grid button');
   const heal=choices.filter({hasText:'Ziarno na zdrowie'});await (await heal.count()?heal:choices.first()).click();
   if(await page.locator('[data-scene="shop"]').count()){
    shops++;const shopHeal=page.locator('.brand-choice-grid button').filter({hasText:'Ziarno na zdrowie'});if(await shopHeal.isEnabled())await shopHeal.click();
    await page.getByRole('button',{name:'Ruszaj dalej',exact:true}).click();
   }
   await page.getByRole('button',{name:'Wejdź na planszę',exact:true}).click();
  }
  assert.equal(await page.getByRole('heading',{name:'Korona spadła.',exact:true}).count(),1);assert.equal(shops,2);assert.ok(retries<=1);assert.deepEqual(errors,[]);
 }catch(e){await page.screenshot({path:'.superpowers/makeover-qa/expedition-failure.png'});throw e}
 finally{await browser.close();await host.close()}
});

test('refresh keeps an actual crater and the next turn',{timeout:120000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{await page.goto(host.url+'/gra?mode=expedition');await page.getByRole('button',{name:'Rozpocznij wyprawę',exact:true}).click();await page.getByRole('button',{name:'Wejdź na planszę',exact:true}).click();
  await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  await page.getByRole('button',{name:'Celuj',exact:true}).click();await page.getByRole('slider',{name:'Kąt',exact:true}).fill('70');await page.getByRole('button',{name:'Strzel',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.battle-screen')?.dataset.turn==='2');
  await page.getByRole('button',{name:'Pauza',exact:true}).click();
  await page.getByText('Postęp zapisany w tej przeglądarce.',{exact:true}).waitFor();
  const revision=await page.locator('.battle-screen').getAttribute('data-terrain-revision');assert.ok(+revision>0);
  await page.reload();await page.getByRole('button',{name:'Wznów wyprawę',exact:true}).click();await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  assert.equal(await page.locator('.battle-screen').getAttribute('data-terrain-revision'),revision);

 }finally{await browser.close();await host.close()}
});

test('defeat, one persisted retry, final defeat through attack controls',{timeout:180000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 try{
  await page.goto(host.url+'/gra?mode=expedition');await page.getByRole('button',{name:'Rozpocznij wyprawę',exact:true}).click();await page.getByRole('button',{name:'Wejdź na planszę',exact:true}).click();
  for(let attempt=0;attempt<2;attempt++){
   await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
   for(let shot=0;shot<12&&await page.locator('.battle-screen').count();shot++){
    await page.getByRole('button',{name:'Celuj',exact:true}).click();await page.getByRole('slider',{name:'Kąt',exact:true}).fill('-90');
    const turn=await page.locator('.battle-screen').getAttribute('data-turn');await page.getByRole('button',{name:'Strzel',exact:true}).click();
    await page.waitForFunction(turn=>{const e=document.querySelector('.battle-screen');return !e||e.dataset.turn!==turn},turn);
   }
   if(attempt===0){await page.getByRole('button',{name:'Wykorzystaj drugą szansę',exact:true}).click();await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
    await page.reload();await page.getByRole('button',{name:'Wznów wyprawę',exact:true}).click();}
  }
  await page.getByRole('heading',{name:'Tym razem kurnik górą.',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Wykorzystaj drugą szansę',exact:true}).count(),0);
 }finally{await browser.close();await host.close()}
});

test('storage failure is visible and does not block a new fight',{timeout:90000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();
 try{
  await page.addInitScript(()=>{IDBObjectStore.prototype.put=function(){throw new DOMException('No space','QuotaExceededError')}});
  await page.goto(host.url+'/gra?mode=expedition');await page.getByRole('button',{name:'Rozpocznij wyprawę',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Brak miejsca'}).waitFor();await page.getByRole('button',{name:'Wejdź na planszę',exact:true}).click();await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  assert.equal(await page.locator('.battle-screen').getAttribute('data-battle-phase'),'player');
 }finally{await browser.close();await host.close()}
});
