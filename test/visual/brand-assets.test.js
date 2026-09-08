import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {serveBuild} from './server.js';
test('model load failure retries the same arena',{timeout:90000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage();
 try{await page.route('**/*.glb',r=>r.abort());await page.goto(host.url+'/gra?mode=quick');await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Nie udało się wczytać modeli'}).waitFor();await page.unroute('**/*.glb');await page.getByRole('button',{name:'Spróbuj ponownie',exact:true}).click();
  await page.getByRole('button',{name:'Skok',exact:true}).waitFor();assert.equal(await page.locator('.battle-screen').getAttribute('data-map-id'),'yard');
  await page.waitForFunction(()=>+document.querySelector('.battle-screen')?.dataset.simTime>4);console.log('Desktop render',await page.locator('.battle-screen').getAttribute('data-performance'));
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(3000);console.log('Portrait render',await page.locator('.battle-screen').getAttribute('data-performance'));await page.screenshot({path:'.superpowers/makeover-qa/brand-new-model-phone.png'});
 }finally{await browser.close();await host.close()}
});
test('all decoded models and animation poses render into a review sheet',{timeout:90000},async()=>{
 const host=await serveBuild(),browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:1050,height:1600}});
 const catalog=JSON.parse(await readFile('src/engine/tactical/releaseManifest.json','utf8'));
 try{
  await page.goto(host.url+'/asset-review');await page.setContent('<style>body{margin:0;background:#f8f7f3;color:#020304;font:16px monospace}header{height:50px;display:flex;align-items:center;justify-content:space-around}canvas{display:block}footer{padding:10px}</style><header><b>HERO</b><b>SHOOTER</b><b>GRENADIER</b><b>RUSHER</b><b>BOSS</b></header><canvas></canvas><footer role="status">Loading</footer>');
  const source=`import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';import {RenderPixelatedPass} from 'three/addons/postprocessing/RenderPixelatedPass.js';import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';import {loadGameAssets} from './src/engine/tactical/assets.js';
   const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:false});renderer.setSize(1050,1500);renderer.setClearColor('#f8f7f3');
   const scene=new T.Scene(),camera=new T.OrthographicCamera(-5.25,5.25,15,0,.1,100);camera.position.set(0,0,20);scene.add(new T.AmbientLight('#ffffff',2));const light=new T.DirectionalLight('#fff1c5',2);light.position.set(-5,12,10);scene.add(light);
   const loaded=await loadGameAssets({renderer}),catalog=${JSON.stringify(catalog)};
   for(let column=0;column<catalog.assets.length;column++){
    const asset=catalog.assets[column],gltf=loaded.models[asset.id];
    for(let row=0;row<8;row++){
     const clone=gltf.scene.clone(true),group=new T.Group();group.add(clone);group.position.set(-4.2+column*2.1-(row===7?.4:0),13.5-row*1.8,0);group.rotation.y=-.25;scene.add(group);
     const mixer=new T.AnimationMixer(clone),clip=gltf.animations[row];mixer.clipAction(clip).play();mixer.setTime(clip.duration*(clip.name==='Defeat'?.85:.25));
    }
   }
   renderer.render(scene,camera);document.querySelector('footer').textContent='Ready: Idle / Walk / Jump / Swing / Land / Attack / Hit / Defeat';
   for(const mode of ['Native','Pixelated']){const button=document.createElement('button');button.textContent=mode;document.querySelector('footer').append(button);button.onclick=()=>{
    renderer.setPixelRatio(mode==='Native'?.85:1);const pass=mode==='Pixelated'?new EffectComposer(renderer):null;if(pass){pass.addPass(new RenderPixelatedPass(2,scene,camera));pass.addPass(new OutputPass());pass.setSize(1050,1500);}
    const start=performance.now();for(let i=0;i<8;i++){if(pass)pass.render();else renderer.render(scene,camera);renderer.getContext().finish();}
    document.querySelector('footer').dataset.renderMs=((performance.now()-start)/8).toFixed(2);document.querySelector('footer').dataset.mode=mode;if(pass){for(const effect of pass.passes)effect.dispose();pass.dispose();}
   }}
`;
  const bundle=await build({stdin:{contents:source,resolveDir:process.cwd(),sourcefile:'asset-review.js'},bundle:true,format:'esm',write:false,platform:'browser'});
  await page.addScriptTag({content:bundle.outputFiles[0].text,type:'module'});await page.getByRole('status').filter({hasText:'Ready'}).waitFor();
  await page.screenshot({path:'.superpowers/makeover-qa/brand-animation-sheet.png'});
  for(const mode of ['Native','Pixelated']){await page.getByRole('button',{name:mode,exact:true}).click();console.log(mode,await page.getByRole('status').getAttribute('data-render-ms'));await page.screenshot({path:'.superpowers/makeover-qa/brand-animation-'+mode+'.png'});}
 }finally{await browser.close();await host.close()}
});
