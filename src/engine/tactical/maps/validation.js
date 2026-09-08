import {createTerrain} from '../terrain/mask.js';
import {ACTOR_RADIUS,ACTOR_HALF_HEIGHT,findSafeReturn} from '../character.js';

export function bodyClear(terrain,x,y,{radius=ACTOR_RADIUS,halfHeight=ACTOR_HALF_HEIGHT}={}){
 for(const dx of [-radius,0,radius])for(const dy of [-halfHeight+.06,0,halfHeight-.02])if(terrain.materialAt(x+dx,y+dy))return false;
 return true;
}
export function validateMap(map){
 const errors=[];let terrain;
 try{terrain=createTerrain(map)}catch(e){return {ok:false,errors:[e.message]}}
 if(!map.id||!map.name)errors.push('Missing identity');
 if(new Set(map.shapes.map(s=>s.id)).size!==map.shapes.length)errors.push('Duplicate shape IDs');
 if(new Set(map.spawns.map(s=>s.id)).size!==map.spawns.length)errors.push('Duplicate spawn IDs');
 if(map.spawns.filter(s=>s.team==='player').length!==1)errors.push('Expected one player');
 for(const spawn of map.spawns){
  if(![spawn.x,spawn.y].every(Number.isFinite)||spawn.x<.3||spawn.x>map.width-.3||spawn.y<.55||spawn.y>map.height-.55)errors.push(`Out of bounds: ${spawn.id}`);
  if(!bodyClear(terrain,spawn.x,spawn.y))errors.push(`Blocked spawn: ${spawn.id}`);
  if(!terrain.materialAt(spawn.x,spawn.y-.75))errors.push(`Unsupported spawn: ${spawn.id}`);
 }
 if(!findSafeReturn({terrain,safeZones:map.safeZones}))errors.push('Missing safe return');
 return {ok:errors.length===0,errors};
}

export function standingNodes(terrain,width,height,actorSize){
 const nodes=[];
 for(let x=.5;x<width;x+=1)for(let ground=.125;ground<height;ground+=.125){
  if(!terrain.materialAt(x,ground-.01)||terrain.materialAt(x,ground+.01))continue;
  const y=ground+ACTOR_HALF_HEIGHT+.015;
  if(bodyClear(terrain,x,y,actorSize))nodes.push({x,y});
 }
 return nodes;
}
export function canJumpBetween(terrain,a,b,actorSize){
 const dx=b.x-a.x,dy=b.y-a.y;
 if(Math.abs(dx)>5||dy>1.45||dy<-8)return false;
 if(Math.abs(dy)<.2){
  let walk=true;
  for(let i=1;i<25;i++){
   const x=a.x+dx*i/25,y=a.y+dy*i/25;
   if(!bodyClear(terrain,x,y,actorSize)||!terrain.materialAt(x,y-.6)){walk=false;break;}
  }
  if(walk)return true;
 }
 // Real jump velocity and gravity: choose the descending intersection with the destination.
 const duration=(5.5+Math.sqrt(30.25-20*dy))/10;
 if(Math.abs(dx)/duration>4)return false;
 for(let i=1;i<25;i++){
  const t=duration*i/25;
  if(!bodyClear(terrain,a.x+dx*t/duration,a.y+5.5*t-5*t*t,actorSize))return false;
 }
 return true;
}
function lineClear(terrain,a,b){
 const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.125);
 for(let i=1;i<steps;i++)if(terrain.materialAt(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;
 return true;
}
/** Conservative sampled movement graph, plus candidate shared grapple anchors.
 * Grapple edges are feasibility hints, not a proof of player skill or playability. */
export function inspectTraversal(map){
 const terrain=createTerrain(map),nodes=standingNodes(terrain,map.width,map.height),edges=nodes.map(()=>new Set());
 for(let i=0;i<nodes.length;i++)for(let j=0;j<nodes.length;j++)if(i!==j&&canJumpBetween(terrain,nodes[i],nodes[j]))edges[i].add(j);
 const anchors=[];
 for(const s of map.shapes)for(let x=s.x+.5;x<s.x+s.width;x+=2){
  const p={x,y:s.y-.05};if(s.y>2&&!terrain.materialAt(x,p.y))anchors.push(p);
 }
 for(const anchor of anchors){
  const visible=[];
  for(let i=0;i<nodes.length;i++){const p=nodes[i];if(anchor.y>p.y+.8&&Math.hypot(p.x-anchor.x,p.y-anchor.y)<18&&lineClear(terrain,p,anchor))visible.push(i)}
  for(const i of visible)for(const j of visible)if(i!==j)edges[i].add(j);
 }
 const clearanceFailures=map.spawns.filter(s=>!bodyClear(terrain,s.x,s.y)).map(s=>s.id),reachableSpawnPairs=[];
 const nearest=s=>nodes.reduce((best,p,i)=>Math.hypot(p.x-s.x,p.y-s.y)<Math.hypot(nodes[best].x-s.x,nodes[best].y-s.y)?i:best,0);
 if(!nodes.length)return {reachableSpawnPairs,clearanceFailures:map.spawns.map(s=>s.id)};
 for(let i=0;i<map.spawns.length;i++){
  const start=nearest(map.spawns[i]),seen=new Set([start]),queue=[start];
  for(let k=0;k<queue.length;k++)for(const n of edges[queue[k]])if(!seen.has(n)){seen.add(n);queue.push(n)}
  for(let j=i+1;j<map.spawns.length;j++)if(seen.has(nearest(map.spawns[j])))reachableSpawnPairs.push([map.spawns[i].id,map.spawns[j].id]);
 }
 return {reachableSpawnPairs,clearanceFailures};
}
