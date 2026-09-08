import R from '@dimforge/rapier3d-compat';
import {launchVelocity} from './ballistics.js';
import {GRAVITY} from './config.js';
import {damageActor} from './weapons.js';
export function bossIntent({health,maxHealth,actionIndex,canCharge}){
 const charge=actionIndex%2===1&&canCharge,shots=health<maxHealth/2?3:2;
 return charge?{type:'charge',shots:0,label:'Jajokról szykuje szarżę'}:{type:'salvo',shots,label:`Jajokról: salwa ${shots} granatów`};
}
function clearAdvance(battle,actor,direction,distance){
 const p=actor.body.translation();
 for(let d=.25;d<=distance+.01;d+=.25)if(!battle.terrain.materialAt(p.x+direction*d,p.y-.65))return false;
 const hit=battle.world.castShape({x:p.x,y:p.y+.035,z:0},{x:0,y:0,z:0,w:1},{x:direction,y:0,z:0},new R.Capsule(.25,.3),0,distance,true,R.QueryFilterFlags.EXCLUDE_DYNAMIC,(4<<16)|1,actor.collider,actor.body);
 return !hit;
}
export function announceBoss(battle){
 const actor=battle.enemies.find(a=>a.role==='boss'&&a.health>0);if(!actor)return null;
 const target=battle.player.body.translation(),p=actor.body.translation(),direction=Math.sign(target.x-p.x)||-1;
 const actionIndex=battle.boss?.actionIndex??0;
 return {actorId:actor.id,actionIndex,intent:{...bossIntent({health:actor.health,maxHealth:actor.maxHealth,actionIndex,canCharge:clearAdvance(battle,actor,direction,1.5)}),target:{x:target.x,y:target.y}},charge:null};
}
export function startBossAction(battle,actor){
 const {intent}=battle.boss,p=actor.body.translation();
 if(intent.type==='charge'){
  battle.boss.charge={startX:p.x,direction:Math.sign(intent.target.x-p.x)||-1,hit:false};battle.nextPhase('enemy-charge');return;
 }
 // The target was shown before the player's move. The king never retargets mid-turn.
 const dx=intent.target.x-p.x,dy=intent.target.y-p.y,flight=Math.max(1.2,Math.min(2,Math.abs(dx)/8));
 const vx=dx/flight,vy=(dy-.2-.5*GRAVITY*flight*flight)/flight;
 const angle=Math.atan2(vy,vx)*180/Math.PI,power=Math.min(18,Math.hypot(vx,vy));
 for(let i=0;i<intent.shots;i++){
  const spread=(i-(intent.shots-1)/2)*5;
  battle.spawnProjectile('enemy',battle.origin(actor,angle+spread),launchVelocity(angle+spread,power),actor,'granajko');
 }
 battle.nextPhase('enemy-shot');
}
export function stepBossCharge(battle,dt){
 const charge=battle.boss?.charge,actor=battle.enemies.find(a=>a.id===battle.activeEnemyId);
 if(!charge||!actor)return;
 const p=actor.body.translation(),v=actor.body.linvel(),remaining=8-Math.abs(p.x-charge.startX);
 if(remaining<=.02||battle.phaseTime>1.8||!clearAdvance(battle,actor,charge.direction,.75)){
  actor.body.setLinvel({x:0,y:v.y,z:0},true);battle.boss.charge=null;battle.nextPhase('enemy-resolve');return;
 }
 actor.body.setLinvel({x:charge.direction*Math.min(8,remaining/dt),y:v.y,z:0},true);
}
export function resolveBossChargeHit(battle){
 const charge=battle.boss?.charge,actor=battle.enemies.find(a=>a.id===battle.activeEnemyId);
 if(!charge||charge.hit||!actor)return;
 const p=actor.body.translation(),target=battle.player,t=target.body.translation();
 if(target.health<=0||Math.hypot(t.x-p.x,t.y-p.y)>1.15)return;
 charge.hit=true;const mass=target.body.mass();
 const damage=damageActor(target,20,{x:charge.direction*mass*8,y:mass*3,z:0},battle);
 battle.events.push({id:++battle.shotId,type:'impact',time:battle.time,x:t.x,y:t.y,damage,team:'enemy',payload:{ownerId:actor.id,kind:'charge',hits:[{actorId:target.id,damage}]}});
}
