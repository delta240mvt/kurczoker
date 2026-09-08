import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
test('landing exposes both modes, nine maps and a lightweight accessible preview',{timeout:90000},async()=>{
 const host=process.env.KURCZOKER_VISUAL_BASE_URL?{url:process.env.KURCZOKER_VISUAL_BASE_URL,close:async()=>{}}:await serveBuild();
 const browser=await chromium.launch();
 try{const page=await browser.newPage(),requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
  await page.goto(host.url);await page.getByRole('heading',{name:'Mała przerwa. Wielka rozróba w kurniku.',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Szybka potyczka',exact:true}).first().getAttribute('href'),'/gra?mode=quick');
  assert.equal(await page.locator('.landing-map').count(),9);assert.equal(await page.locator('canvas').count(),0);
  await page.locator('video').evaluate(v=>v.play());await page.waitForFunction(()=>document.querySelector('video').currentTime>1);assert.ok(await page.locator('video').evaluate(v=>v.videoWidth>0));await page.locator('video').evaluate(v=>v.pause());
  assert.equal(requests.some(url=>/\.glb|rapier|KurczokerCanvas/.test(url)),false);
  for(const viewport of [{width:1440,height:900},{width:360,height:800}]){await page.setViewportSize(viewport);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'.superpowers/makeover-qa/landing-'+viewport.width+'.png',fullPage:true})}
  await page.getByText('Czy gra jest bezpłatna?',{exact:true}).click();assert.equal(await page.locator('details[open]').count(),1);
  await page.getByRole('link',{name:'Wyprawa · 10–15 min',exact:true}).first().click();assert.equal(new URL(page.url()).searchParams.get('mode'),'expedition');assert.deepEqual(errors,[]);
 }finally{await browser.close();await host.close()}
});
