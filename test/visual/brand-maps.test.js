import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
const maps=['yard','hills','roofs','ravine','mill','caves','quarry','islands','fortress'];
test('dziewięć map: pion i poziom, ruch, skok, mina, odpowiedź wroga i przegląd',{timeout:600000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{for(const map of (process.env.QA_MAP?[process.env.QA_MAP]:maps))for(const [width,height] of (process.env.QA_LANDSCAPE?[[844,390]]:[[390,844],[844,390]])){
  await page.setViewportSize({width,height});await page.goto(`${host.url}/gra?mode=quick&map=${map}`,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();
  const arena=page.locator('[data-map-id]');await page.waitForFunction(()=>document.querySelector('[data-sim-time]')?.dataset.simTime>1);
  assert.equal(await arena.getAttribute('data-map-id'),map);
  const before=await arena.evaluate(e=>({x:+e.dataset.playerX,y:+e.dataset.playerY}));
  const right=await page.getByRole('button',{name:'W prawo',exact:true}).boundingBox(),jump=await page.getByRole('button',{name:'Skok',exact:true}).boundingBox();
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:right.x+right.width/2,y:right.y+right.height/2},{id:2,x:jump.x+jump.width/2,y:jump.y+jump.height/2}]});
  try{await page.waitForFunction(before=>{const e=document.querySelector('[data-player-x]');return +e.dataset.playerX>before.x+.15&&+e.dataset.playerY>before.y+.3},before)}
  finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()}
  await page.waitForFunction(y=>+document.querySelector('[data-player-y]').dataset.playerY<y+.05,before.y);
  await page.getByRole('button',{name:'Celuj',exact:true}).click();
  await page.getByRole('combobox',{name:'Broń',exact:true}).selectOption('mine');
  await page.getByRole('button',{name:'Postaw minę',exact:true}).click();
  await page.waitForFunction(()=>+document.querySelector('[data-mine-count]').dataset.mineCount===1);
  await page.waitForFunction(()=>+document.querySelector('[data-turn]').dataset.turn>=2||document.querySelector('[data-battle-phase]').dataset.battlePhase==='finished');
  await page.getByRole('button',{name:'Mapa',exact:true}).click();
  await page.screenshot({path:`.superpowers/makeover-qa/map-${map}-${width}.png`});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false,map);
  console.log(`map UI PASS ${map} ${width}x${height}`);
 }
 assert.deepEqual(errors,[]);
 }catch(e){console.log(await page.locator("main").innerText());console.log(await page.locator("[data-player-x]").evaluate(e=>({...e.dataset})));await page.screenshot({path:".superpowers/makeover-qa/map-failure.png"});throw e;}finally{await browser.close();await host.close()}
});
