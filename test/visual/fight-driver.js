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
export async function fight(page){
 await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
 for(let turn=0;turn<30;turn++){
  if(!await page.locator('.battle-screen').count())return;
  await page.waitForFunction(()=>!document.querySelector('.battle-screen')||['player','finished'].includes(document.querySelector('.battle-screen').dataset.battlePhase));
  if(!await page.locator('.battle-screen').count())return;
  if(await page.locator('.battle-screen').getAttribute('data-battle-phase')==='finished')return;
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
