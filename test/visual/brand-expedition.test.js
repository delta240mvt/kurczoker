import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
const actors=page=>page.locator('.battle-screen').getAttribute('data-actors').then(JSON.parse);
function aimAt(hero,enemy,power){
 const dx=Math.abs(enemy.x-hero.x),dy=enemy.y-hero.y;let best={error:Infinity,angle:0};
 for(let angle=-80;angle<=80;angle++){
  const r=angle*Math.PI/180,t=(dx-.48*Math.cos(r))/(power*Math.cos(r));if(t<=0)continue;
  const predicted=.2+dx*Math.tan(r)-5*t*(t+1/60),error=Math.abs(predicted-(dy+.05));
  if(error<best.error)best={error,angle};
 }
 return enemy.x>=hero.x?best.angle:best.angle>=0?180-best.angle:-180-best.angle;
}
async function fight(page){
 await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
 for(let turn=0;turn<30;turn++){
  if(!await page.locator('.battle-screen').count())return;
  await page.waitForFunction(()=>!document.querySelector('.battle-screen')||document.querySelector('.battle-screen').dataset.battlePhase==='player');
  if(!await page.locator('.battle-screen').count())return;
  const map=await page.locator('.battle-screen').getAttribute('data-map-id');
  let lastJump=-1,lastX=null;
  // Walk through actual controls; the same visible actor diagnostics used by QA.
  for(let step=0;step<100;step++){
   const list=await actors(page),hero=list.find(a=>a.team==='player'),enemy=list.find(a=>a.team==='enemy'&&a.alive);
   if(!enemy)break;
   const distance=Math.abs(hero.x-enemy.x),height=Math.abs(hero.y-enemy.y);
   // Stop on level footing outside the explosion radius. A capsule supported
   // on a crater rim can jump, but that does not make it a safe firing position.
   if(distance>=3.5&&distance<5&&height<.6&&hero.grounded&&Math.abs(hero.vy)<.1)break;
   const toward=hero.x<enemy.x,right=distance<3.7?!toward:toward,key=right?'d':'a';await page.keyboard.up(right?'a':'d');await page.keyboard.down(key);
   const belowMill=map==='mill'&&hero.x<29;
   const stuck=lastX!==null&&Math.abs(hero.x-lastX)<.03;lastX=hero.x;
   if(hero.grounded&&!belowMill&&(enemy.y>hero.y+.3||stuck)&&step-lastJump>3){await page.keyboard.press('Space');lastJump=step}
   await page.waitForTimeout(100);
  }
  await page.keyboard.up('a');await page.keyboard.up('d');await page.waitForTimeout(350);
  const list=await actors(page),hero=list.find(a=>a.team==='player'),enemy=list.find(a=>a.team==='enemy'&&a.alive);if(!enemy)return;
  await page.getByRole('button',{name:'Celuj',exact:true}).click();await page.getByRole('combobox',{name:'Broń',exact:true}).selectOption('jajooka');
  let shot=null;
  for(const power of [10,8,14,18]){
   const candidates=[0,-2,2,-4,4].map(offset=>Math.max(-180,Math.min(180,aimAt(hero,enemy,power)+offset)));
   // Crater lips may block the direct branch of the parabola. Check the
   // visible high arc as well before moving again; never fire through cover.
   for(let elevation=50;elevation<=86;elevation+=2)candidates.push(enemy.x>=hero.x?elevation:180-elevation);
   for(const angle of [...new Set(candidates)]){
    await page.getByRole('slider',{name:'Kąt',exact:true}).fill(String(angle));await page.getByRole('slider',{name:'Moc',exact:true}).fill(String(power));
    await page.waitForFunction(({angle,power})=>{const c=document.querySelector('canvas');return +c.dataset.aimAngle===angle&&+c.dataset.aimPower===power&&c.dataset.aimEnd},{angle,power});
    const end=JSON.parse(await page.locator('canvas').getAttribute('data-aim-end'));
    if(end&&Math.hypot(end.x-enemy.x,end.y-enemy.y)<.72&&end.y>enemy.y-.3&&Math.hypot(end.x-hero.x,end.y-hero.y)>2.5){shot={angle,power};break}
   }
   if(shot)break;
  }
  if(!shot){console.log('Reposition',map,hero.x.toFixed(1),hero.y.toFixed(1),enemy.x.toFixed(1),enemy.y.toFixed(1));await page.getByRole('button',{name:'Ruch',exact:true}).click();await page.keyboard.down(hero.x<enemy.x?'d':'a');await page.keyboard.press('Space');await page.waitForTimeout(650);await page.keyboard.up('a');await page.keyboard.up('d');continue}
  console.log('Shot',map,hero.health,enemy.health,hero.x.toFixed(1),hero.y.toFixed(1),enemy.x.toFixed(1),enemy.y.toFixed(1),shot.angle);const previous=await page.locator('.battle-screen').getAttribute('data-turn');await page.getByRole('button',{name:'Strzel',exact:true}).click();
  await page.waitForFunction(previous=>{const e=document.querySelector('.battle-screen');return !e||e.dataset.turn!==previous||e.dataset.battlePhase==='finished'},previous,{timeout:45000});
 }
 throw new Error('Combat did not finish within 30 actual turns');
}
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
