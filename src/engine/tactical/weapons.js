import R from '@dimforge/rapier3d-compat';
import {syncTerrainColliders} from './terrain/collisions.js';

export function explode({id,point,radius,maxDamage,ownerId},battle) {
  if(battle.resolvedExplosions.has(id))return;
  battle.resolvedExplosions.add(id);
  const hits=[];
  // Determine cover before editing terrain. Subsequent explosions see the edit.
  for(const actor of battle.actors) {
    if(actor.health<=0)continue;
    const p=actor.body.translation(),dx=p.x-point.x,dy=p.y-point.y,distance=Math.hypot(dx,dy);
    if(distance>radius+.3)continue;
    const direction=distance>.001?{x:dx/distance,y:dy/distance,z:0}:{x:0,y:1,z:0};
    const occluded=distance>.35 && battle.world.castRay(new R.Ray({...point,z:0},direction),
      Math.max(0,distance-.35),true,R.QueryFilterFlags.EXCLUDE_DYNAMIC,(8<<16)|1);
    if(occluded)continue;
    let damage=Math.max(0,Math.round(maxDamage*(1-Math.max(0,distance-.35)/radius)));
    if(!battle.terrain) {
      // Temporary balance adapter for the old 3-HP UI, removed with the new shell.
      if(actor.id===ownerId)continue;
      damage=actor.team==='player'?1:2+(battle.options.stats?.eggBombDamageBonus??0)+battle.boost;
      if(actor.team==='player' && battle.guard>0){damage=0;battle.guard--;}
      else if(actor.team==='player' && (battle.options.artifacts??[]).includes('shell-shield')&&!battle.shellUsed){damage=0;battle.shellUsed=true;}
    }
    if(damage)hits.push({actor,damage,direction});
  }
  for(const {actor,damage,direction} of hits) {
    actor.health=Math.max(0,actor.health-damage);actor.hitAt=battle.time;
    actor.body.applyImpulse({x:direction.x*damage*.025,y:Math.max(.2,direction.y)*damage*.025,z:0},true);
  }
  if(battle.terrain) {
    const chunkIds=battle.terrain.cutCircle({...point,radius});
    if(chunkIds.length)syncTerrainColliders({R,world:battle.world,terrain:battle.terrain,registry:battle.terrainRegistry,chunkIds});
  }
  battle.trajectoryCache=null;
  const owner=battle.actors.find(a=>a.id===ownerId);
  battle.events.push({id,type:'impact',time:battle.time,x:point.x,y:point.y,
    damage:hits.reduce((n,h)=>n+h.damage,0),team:owner?.team,target:hits[0]?.actor.team,
    payload:{ownerId,radius,hits:hits.map(h=>({actorId:h.actor.id,damage:h.damage}))}});
}

export function toolArea({toolId,actor,direction=1}) {
  if(!actor || !Number.isFinite(actor.x)||!Number.isFinite(actor.y))return null;
  if(toolId==='drill')return {x:actor.x-.75,y:actor.y-2.8,width:1.5,height:2.5};
  if(toolId==='pickaxe' && [-1,1].includes(direction))
    return {x:direction>0?actor.x:actor.x-2.5,y:actor.y-.55,width:2.5,height:1.5};
  return null;
}
export function previewTool(command,snapshot,terrain) {
  const actor=snapshot.actors.find(a=>a.team==='player');
  const area=toolArea({...command,actor});
  const reject=reason=>({area,allowed:false,reason});
  if(!area||!terrain)return reject('invalid');
  if(snapshot.paused||snapshot.phase!=='player'||snapshot.outcome)return reject('phase');
  if(snapshot.toolUsed)return reject('used');
  if(!(snapshot.inventory.tools[command.toolId]>0))return reject('empty');
  const {cellSize}=terrain.snapshot();
  // Align a near-ground pickaxe cut with the actual floor, avoiding a tiny
  // blocking lip at the entrance or a new step at the exit of the tunnel.
  if(command.toolId==='pickaxe') {
    const foot=actor.y-.55;
    for(let ground=Math.ceil((foot+.25)/cellSize)*cellSize;ground>=foot-.3;ground-=cellSize) {
      if(terrain.materialAt(actor.x,ground-cellSize*.5) && !terrain.materialAt(actor.x,ground+cellSize*.5)) {
        area.y=ground;break;
      }
    }
  }
  for(let y=(Math.floor(area.y/cellSize)+.5)*cellSize;y<area.y+area.height;y+=cellSize)
    for(let x=(Math.floor(area.x/cellSize)+.5)*cellSize;x<area.x+area.width;x+=cellSize){
      if(x<area.x||y<area.y)continue;
      const material=terrain.materialAt(x,y);
      if(material===1||material===2)return {area,allowed:true};
    }
  return reject('blocked');
}
export function useTool(command,battle) {
  const preview=previewTool(command,battle.snapshot(),battle.terrain);
  if(!preview.allowed)return {accepted:false,reason:preview.reason};
  const chunkIds=battle.terrain.cutRect(preview.area);
  if(!chunkIds.length)return {accepted:false,reason:'blocked'};
  battle.inventory.tools[command.toolId]--;battle.toolUsed=true;
  syncTerrainColliders({R,world:battle.world,terrain:battle.terrain,registry:battle.terrainRegistry,chunkIds});
  battle.trajectoryCache=null;
  battle.events.push({id:`tool-${battle.turn}`,type:'tool',time:battle.time,payload:{toolId:command.toolId,area:preview.area}});
  return {accepted:true};
}
