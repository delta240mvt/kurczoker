import R from '@dimforge/rapier3d-compat';
import {GRAVITY,STEP} from './config.js';
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
  const hit=castSegment(projectile,next);
  if(hit){next.x=hit.point.x;next.y=hit.point.y;}
  return {projectile:next,hit};
}

export function predictTrajectory({origin,angleDeg,power,dt=STEP,maxSteps=180,castSegment,ownerId='player'}) {
  const v=launchVelocity(angleDeg,power);
  let projectile={...origin,vx:v.x,vy:v.y,age:0,ownerId};
  const points=[{x:origin.x,y:origin.y,z:0}];
  for(let n=0;n<maxSteps;n++) {
    const result=stepProjectile(projectile,dt,castSegment);projectile=result.projectile;
    points.push({x:projectile.x,y:projectile.y,z:0});
    if(result.hit||projectile.y < -2)break;
  }
  return points;
}
