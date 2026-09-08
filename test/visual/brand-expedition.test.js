import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
const actors=page=>page.locator('.battle-screen').getAttribute('data-actors').then(JSON.parse);
async function fight(page){
 await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
 for(let turn=0;turn<30;turn++){
  if(!await page.locator('.battle-screen').count())return;
  await page.waitForFunction(()=>!document.querySelector('.battle-screen')||document.querySelector('.battle-screen').dataset.battlePhase==='player');
  if(!await page.locator('.battle-screen').count())return;
  const map=await page.locator('.battle-screen').getAttribute('data-map-id');
  let lastJump=-1;
  // Walk through actual controls; the same visible actor diagnostics used by QA.
  for(let step=0;step<500;step++){
   const list=await actors(page),hero=list.find(a=>a.team==='player'),enemy=list.find(a=>a.team==='enemy'&&a.alive);
   if(!enemy)break;
   if(Math.abs(hero.x-enemy.x)<5.5&&Math.abs(hero.y-enemy.y)<.45&&hero.grounded)break;
   const right=hero.x<enemy.x,key=right?'d':'a';await page.keyboard.up(right?'a':'d');await page.keyboard.down(key);
   const belowMill=map==='mill'&&hero.x<29;
   if(hero.grounded&&!belowMill&&map!=='fortress'&&step-lastJump>2){await page.keyboard.press('Space');lastJump=step}
   await page.waitForTimeout(100);
  }
  await page.keyboard.up('a');await page.keyboard.up('d');await page.waitForTimeout(350);
  const list=await actors(page),hero=list.find(a=>a.team==='player'),enemy=list.find(a=>a.team==='enemy'&&a.alive);if(!enemy)return;
  const dx=enemy.x-hero.x,dy=enemy.y-hero.y+.15,power=12;
  const angle=Math.atan2(dy+5*(Math.abs(dx)/power)**2,dx)*180/Math.PI;
  await page.getByRole('button',{name:'Celuj',exact:true}).click();await page.getByRole('combobox',{name:'Broń',exact:true}).selectOption('jajooka');
  await page.getByRole('slider',{name:'Kąt',exact:true}).fill(String(Math.round(angle)));await page.getByRole('slider',{name:'Moc',exact:true}).fill(String(power));
  console.log('Shot',map,hero.health,enemy.health,hero.x.toFixed(1),hero.y.toFixed(1),enemy.x.toFixed(1),enemy.y.toFixed(1),Math.round(angle));const previous=await page.locator('.battle-screen').getAttribute('data-turn');await page.getByRole('button',{name:'Strzel',exact:true}).click();
  await page.waitForFunction(previous=>{const e=document.querySelector('.battle-screen');return !e||e.dataset.turn!==previous||e.dataset.battlePhase==='finished'},previous,{timeout:45000});
 }
 throw new Error('Combat did not finish within 30 actual turns');
}
test('wyprawa przez UI: ruch, zapis po strzale, nagrody, sklep i finał',{timeout:900000},async()=>{
 const host=process.env.KURCZOKER_VISUAL_BASE_URL?{url:process.env.KURCZOKER_VISUAL_BASE_URL,close:async()=>{}}:await serveBuild();
 const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
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
