import R from '@dimforge/rapier3d-compat';
import {WEAPONS} from './config.js';
import {launchVelocity} from './ballistics.js';
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
  for(const hit of hits) {
    const {actor,damage,direction}=hit;
    hit.damage=damageActor(actor,damage,{x:direction.x*damage*.025,y:Math.max(.2,direction.y)*damage*.025,z:0},battle);
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
  const {cellSize}=terrain;
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

export function damageActor(actor,damage,impulse,battle) {
 if(damage>0&&actor.guardAvailable){damage=Math.ceil(damage/2);actor.guardAvailable=false;}
 const actual=Math.min(actor.health,damage);actor.health-=actual;actor.hitAt=battle.time;
 if(actor.health<=0)actor.body.setEnabled(false);else actor.body.applyImpulse(impulse,true);
 return actual;
}
export function executeWeapon({weaponId,actor,aim,battle}) {
 const definition=WEAPONS[weaponId];
 if(!battle.canAct())return {accepted:false,reason:'phase'};
 if(!definition||!battle.inventory.owned.includes(weaponId))return {accepted:false,reason:'locked'};
 const finiteAmmo=!['jajooka','kick'].includes(weaponId);
 if(finiteAmmo&&!(battle.inventory.ammo[weaponId]>0))return {accepted:false,reason:'empty'};
 const position=actor.body.translation(),direction=battle.facing;
 let kickTarget,minePoint;
 if(definition.kind==='contact') {
  kickTarget=battle.actors.filter(a=>a.team!==actor.team&&a.health>0).map(a=>({actor:a,p:a.body.translation()}))
   .filter(a=>Math.hypot(a.p.x-position.x,a.p.y-position.y)<=definition.range&&(a.p.x-position.x)*direction>=0)
   .sort((a,b)=>Math.abs(a.p.x-position.x)-Math.abs(b.p.x-position.x))[0];
  if(!kickTarget)return {accepted:false,reason:'out-of-range'};
  const dx=kickTarget.p.x-position.x,dy=kickTarget.p.y-position.y,d=Math.hypot(dx,dy);
  if(battle.world.castRay(new R.Ray(position,{x:dx/d,y:dy/d,z:0}),d,true,undefined,(2<<16)|1))return {accepted:false,reason:'blocked'};
 }
 if(definition.kind==='mine') {
  if(!actor.grounded)return {accepted:false,reason:'ground'};
  const x=position.x+direction*1.05,foot=position.y-.55;
  if(!battle.terrain?.materialAt(x,foot-.08)||battle.terrain.materialAt(x,foot+.15))return {accepted:false,reason:'ground'};
  minePoint={x,y:foot+.17};
 }
 if(finiteAmmo)battle.inventory.ammo[weaponId]--;
 battle.direction=0;battle.rope.reel(0);
 if(['impact','bounce','cluster'].includes(definition.kind)) {
  battle.spawnProjectile(actor.team,battle.origin(actor,aim.angleDeg),launchVelocity(aim.angleDeg,aim.power),actor,weaponId);
  battle.nextPhase('player-shot');
 } else if(definition.kind==='contact') {
  performKick(actor,direction,battle);
  battle.beginEnemyResponses();
 } else if(definition.kind==='mine') {
  const mine={id:++battle.shotId,ownerId:actor.id,team:actor.team,...minePoint,age:0,vy:0};
  battle.mines.push(mine);battle.events.push({id:'mine-'+mine.id,type:'mine-place',time:battle.time,payload:mine});
  battle.beginEnemyResponses();
 } else if(definition.kind==='cone') {
  const {origin,rays:casts}=coneRays({actor,aim,battle}),rays=casts.map(c=>c.point);let damage=0;
  for(const {hit,point,vector} of casts) {
   if(!hit)continue;
   const target=battle.actors.find(a=>a.collider.handle===hit.collider.handle&&a.health>0);
   if(target)damage+=damageActor(target,definition.damage/definition.pellets,{x:vector.x*.2,y:vector.y*.2,z:0},battle);
   else explode({id:++battle.shotId,point,radius:.18,maxDamage:0,ownerId:actor.id},battle);
  }
  battle.events.push({id:++battle.shotId,type:'shotgun',time:battle.time,damage,team:actor.team,payload:{ownerId:actor.id,origin,rays}});
  battle.beginEnemyResponses();
 }
 return {accepted:true};
}

export function coneRays({actor,aim,battle}) {
 const definition=WEAPONS.shotgun,origin=battle.origin(actor,aim.angleDeg);
 const rays=Array.from({length:definition.pellets},(_,i)=>{
  const angle=(aim.angleDeg+(i/(definition.pellets-1)-.5)*definition.spreadDeg)*Math.PI/180;
  const vector={x:Math.cos(angle),y:Math.sin(angle),z:0};
  const hit=battle.world.castRay(new R.Ray(origin,vector),definition.range,true,undefined,((8|16)<<16)|(1|2|4),actor.collider,actor.body);
  const distance=hit?.timeOfImpact??definition.range;
  return {hit,vector,point:{x:origin.x+vector.x*distance,y:origin.y+vector.y*distance}};
 });
 return {origin,rays};
}

export function performKick(actor,direction,battle){
 const position=actor.body.translation(),definition=WEAPONS.kick;
 const target=battle.actors.find(a=>a.team!==actor.team&&a.health>0&&
  Math.hypot(a.body.translation().x-position.x,a.body.translation().y-position.y)<=definition.range&&
  (a.body.translation().x-position.x)*direction>=0);
 if(!target)return false;
 const p=target.body.translation(),dx=p.x-position.x,dy=p.y-position.y,d=Math.hypot(dx,dy);
 if(d>0&&battle.world.castRay(new R.Ray(position,{x:dx/d,y:dy/d,z:0}),d,true,undefined,(2<<16)|1))return false;
 const mass=target.body.mass(),damage=damageActor(target,definition.damage,{x:direction*mass*definition.impulse,y:mass*2,z:0},battle);
 battle.events.push({id:++battle.shotId,type:'impact',time:battle.time,x:p.x,y:p.y,damage,team:actor.team,payload:{ownerId:actor.id,kind:'kick',hits:[{actorId:target.id,damage}]}});
 return true;
}
