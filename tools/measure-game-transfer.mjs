import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
export async function measureGameTransfer(url){
 const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),client=await page.context().newCDPSession(page),requests=[],errors=[];let encodedBytes=0;
  await client.send('Network.enable');await client.send('Network.setCacheDisabled',{cacheDisabled:true});
  client.on('Network.loadingFinished',e=>{encodedBytes+=e.encodedDataLength});client.on('Network.responseReceived',e=>requests.push({url:e.response.url,status:e.response.status,mime:e.response.mimeType}));page.on('pageerror',e=>errors.push(e.message));
  const started=Date.now();await page.goto(new URL('/gra?mode=quick',url).href);await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[aria-label="Skok"]')?.disabled===false);const startupMs=Date.now()-started;
  await page.getByRole('button',{name:'Pomiń wskazówki',exact:true}).click();await page.waitForTimeout(6000);const idle=await page.locator('.battle-screen').getAttribute('data-performance');
  await page.getByRole('button',{name:'Celuj',exact:true}).click();await page.getByRole('combobox',{name:'Broń',exact:true}).selectOption('cluster');await page.getByRole('slider',{name:'Kąt',exact:true}).fill('80');await page.getByRole('button',{name:'Strzel',exact:true}).click();await page.waitForTimeout(3500);
  const burst=await page.locator('.battle-screen').getAttribute('data-performance'),buffer=await page.locator('canvas').evaluate(c=>({width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight}));
  return {url,environment:'Playwright Chromium / SwiftShader software GPU; emulated 390x844, not a physical phone',encodedBytes,within10MiB:encodedBytes<=10*1024**2,startupMs,idle:JSON.parse(idle||'null'),burst:JSON.parse(burst||'null'),profile:await page.locator('.battle-screen').getAttribute('data-quality'),dpr:await page.locator('.battle-screen').getAttribute('data-dpr'),buffer,requests,errors};
 }finally{await browser.close()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(!process.argv[2])throw new Error('Pass the local or immutable preview URL.');console.log(JSON.stringify(await measureGameTransfer(process.argv[2]),null,2))}
