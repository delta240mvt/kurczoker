import R from '@dimforge/rapier3d-compat';
import {GRAVITY,STEP,WEAPONS,projectileDefinition} from './config.js';
import {launchVelocity} from './ballistics.js';

export function createSegmentCaster(world,actors) {
  const shape=new R.Ball(.14),rotation={x:0,y:0,z:0,w:1};
  return (from,to)=>{
    const velocity={x:to.x-from.x,y:to.y-from.y,z:0};
    const owner=from.age<.15?actors.find(a=>a.id===from.ownerId):null;
    const hit=world.castShape({x:from.x,y:from.y,z:0},rotation,velocity,shape,0,1,true,
      undefined,((8|16)<<16)|(1|2|4),owner?.collider,owner?.body);
    if(!hit)return null;
    return {fraction:hit.time_of_impact,
      point:{x:from.x+velocity.x*hit.time_of_impact,y:from.y+velocity.y*hit.time_of_impact},
      normal:{x:hit.normal1.x,y:hit.normal1.y},collider:hit.collider};
  };
}

export function stepProjectile(projectile,dt,castSegment) {
  const next={...projectile,vy:projectile.vy+GRAVITY*dt,age:projectile.age+dt};
  next.x=projectile.x+next.vx*dt;next.y=projectile.y+next.vy*dt;
  if(next.fuse!=null)next.fuse-=dt;
  const hit=castSegment(projectile,next);
  if(hit){
    next.x=hit.point.x;next.y=hit.point.y;
    const definition=projectileDefinition(projectile.weaponId);
    if(['bounce','cluster'].includes(definition?.kind)&&next.fuse>0){
      const normal=hit.normal,dot=next.vx*normal.x+next.vy*normal.y;
      next.vx-=(1+definition.restitution)*dot*normal.x;
      next.vy-=(1+definition.restitution)*dot*normal.y;
      next.x+=normal.x*.025;next.y+=normal.y*.025;next.bounces++;
      return {projectile:next,hit:null,bounce:hit};
    }
  }
  return {projectile:next,hit};
}

export function predictTrajectory({origin,angleDeg,power,dt=STEP,maxSteps=180,castSegment,ownerId='player',weaponId='jajooka'}) {
  const v=launchVelocity(angleDeg,power);
  let projectile={...origin,vx:v.x,vy:v.y,age:0,ownerId,weaponId,fuse:WEAPONS[weaponId]?.fuse??null,bounces:0};
  const points=[{x:origin.x,y:origin.y,z:0}];
  for(let n=0;n<maxSteps;n++) {
    const result=stepProjectile(projectile,dt,castSegment);projectile=result.projectile;
    points.push({x:projectile.x,y:projectile.y,z:0});
    if(result.hit||projectile.y < -2||projectile.fuse!=null&&projectile.fuse<=0)break;
  }
  return points;
}

export function spawnClusterFragments(projectile,nextId,random=()=>.5) {
 return Array.from({length:5},(_,i)=>{
  const angle=(20+i*35+(random()-.5)*12)*Math.PI/180,speed=4+random()*2;
  return {id:nextId(),ownerId:projectile.ownerId,team:projectile.team,weaponId:'fragment',
   x:projectile.x,y:projectile.y+.18,z:0,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,fuse:null,bounces:0};
 });
}
export function tickMines(mines,actors,dt,terrain) {
 const active=[],explosions=[];
 for(const old of mines){
  const mine={...old,age:old.age+dt};
  if(terrain&&!terrain.materialAt(mine.x,mine.y-.17)) {
   mine.vy=(mine.vy??0)+GRAVITY*dt;
   const end=mine.y+mine.vy*dt,step=terrain.cellSize/2;
   for(let y=mine.y;y>=end;y-=step){
    if(terrain.materialAt(mine.x,y-.17)){mine.y=Math.ceil((y-.17)/terrain.cellSize)*terrain.cellSize+.17;mine.vy=0;break;}
    mine.y=Math.max(end,y-step);
   }
  }else mine.vy=0;
  if(mine.y < -2)continue;
  if(mine.age>=WEAPONS.mine.armSeconds&&actors.some(a=>a.health>0&&Math.hypot(a.x-mine.x,a.y-mine.y)<=WEAPONS.mine.triggerRadius))explosions.push(mine);
  else active.push(mine);
 }
 return {mines:active,explosions};
}
