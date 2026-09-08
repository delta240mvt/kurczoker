export const ACTOR_RADIUS=.3;
export const ACTOR_HALF_HEIGHT=.55;

export function isSafePosition({point,terrain,actors=[],actorSize={radius:ACTOR_RADIUS,halfHeight:ACTOR_HALF_HEIGHT}}) {
  const {x,y}=point,{radius,halfHeight}=actorSize;
  if(![x,y].every(Number.isFinite)) return false;
  if(!terrain.materialAt(x,y-halfHeight-.04)) return false;
  for(const dx of [-radius,0,radius]) for(const dy of [-halfHeight+.08,0,halfHeight]) {
    if(terrain.materialAt(x+dx,y+dy)) return false;
  }
  return !actors.some(a=>a.alive && Math.abs(a.x-x)<radius*2+.08 && Math.abs(a.y-y)<halfHeight*2+.08);
}

export function findSafeReturn({terrain,actors=[],safeZones,lastSafe,actorSize={radius:ACTOR_RADIUS,halfHeight:ACTOR_HALF_HEIGHT}}) {
  const safe=point=>isSafePosition({point,terrain,actors,actorSize});
  if(lastSafe && safe(lastSafe)) return {...lastSafe};
  const candidates=[];
  for(const zone of safeZones) {
    for(let x=zone.x;x<=zone.x+zone.width;x+=.25) {
      for(let ground=zone.y;ground<=zone.y+zone.height;ground+=.125) {
        const point={x,y:ground+actorSize.halfHeight+.015};
        if(safe(point)){candidates.push(point);break;}
      }
    }
  }
  if(lastSafe) candidates.sort((a,b)=>Math.hypot(a.x-lastSafe.x,a.y-lastSafe.y)-Math.hypot(b.x-lastSafe.x,b.y-lastSafe.y));
  return candidates[0]??null;
}

export function createCharacter({R,world,spawn,health=100,maxHealth=100}) {
  const body=world.createRigidBody(R.RigidBodyDesc.dynamic()
    .setTranslation(spawn.x,spawn.y,0).setCcdEnabled(true));
  body.setEnabledTranslations(true,true,false,true);
  body.setEnabledRotations(false,false,false,true);
  const group=spawn.team==='player'?2:4;
  const collider=world.createCollider(R.ColliderDesc.capsule(.25,ACTOR_RADIUS)
    .setFriction(.7).setCollisionGroups((group<<16)|(spawn.team==='player'?1|4|16:1|2|8)),body);
  const actor={
    id:spawn.id,team:spawn.team,role:spawn.role,body,collider,
    health,maxHealth,grounded:false,hitAt:-100,lastSafe:null,guardAvailable:false,
    updateGrounded(){
      const p=body.translation(),v=body.linvel();
      actor.grounded=v.y<.8 && [-.15,0,.15].some(dx=>{
        const ray=new R.Ray({x:p.x+dx,y:p.y,z:0},{x:0,y:-1,z:0});
        const hit=world.castRayAndGetNormal(ray,.63,true,undefined,(group<<16)|1,collider,body);
        return hit && hit.normal.y>.4;
      });
      return actor.grounded;
    },
    jump(){
      if(!actor.grounded || actor.health<=0) return false;
      const v=body.linvel();body.setLinvel({x:v.x,y:5.5,z:0},true);
      actor.grounded=false;return true;
    },
    step({direction=0,speed=4,jump=false},dt){
      if(actor.health<=0) return;
      actor.updateGrounded();
      if(jump) actor.jump();
      const v=body.linvel();
      const target=direction*speed;
      const acceleration=actor.grounded?24:direction?6:0;
      const delta=Math.max(-acceleration*dt,Math.min(acceleration*dt,target-v.x));
      if(delta) body.setLinvel({x:v.x+delta,y:v.y,z:0},true);
    },
    snapshot(){
      const p=body.translation(),v=body.linvel();
      return {id:actor.id,team:actor.team,role:actor.role,x:p.x,y:p.y,vx:v.x,vy:v.y,
        health:actor.health,maxHealth:actor.maxHealth,grounded:actor.grounded,alive:actor.health>0,
        hitAt:actor.hitAt,lastSafe:actor.lastSafe?{...actor.lastSafe}:null,guardAvailable:actor.guardAvailable};
    },
    dispose(){if(body.isValid()) world.removeRigidBody(body);},
    get vy(){return body.linvel().y;},
    set vy(y){const v=body.linvel();body.setLinvel({x:v.x,y,z:0},true);},
  };
  return actor;
}
