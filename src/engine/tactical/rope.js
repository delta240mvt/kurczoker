import R from '@dimforge/rapier3d-compat';

const MIN_LENGTH=1.2,MAX_LENGTH=18,REEL_SPEED=4;
const zero={x:0,y:0,z:0};

export function createRope({world,playerBody,terrain}) {
  let state=null,anchorBody=null,joint=null;
  function constrain(length) {
    if(joint){world.removeImpulseJoint(joint,true);joint=null;}
    joint=world.createImpulseJoint(R.JointData.rope(length,zero,zero),anchorBody,playerBody,true);
  }
  function release() {
    if(joint){world.removeImpulseJoint(joint,true);joint=null;}
    if(anchorBody){world.removeRigidBody(anchorBody);anchorBody=null;}
    state=null;
  }
  return {
    attach(point) {
      if(!point || ![point.x,point.y].every(Number.isFinite)) return {accepted:false,reason:'invalid'};
      const p=playerBody.translation(),dx=point.x-p.x,dy=point.y-p.y,length=Math.hypot(dx,dy);
      if(length<MIN_LENGTH || length>MAX_LENGTH) return {accepted:false,reason:'range'};
      const direction={x:dx/length,y:dy/length,z:0};
      const ray=new R.Ray(p,direction);
      const hit=world.castRayAndGetNormal(ray,length+.1,true,R.QueryFilterFlags.EXCLUDE_DYNAMIC,
        (2<<16)|1,undefined,playerBody);
      if(!hit || Math.abs(hit.timeOfImpact-length)>.15) return {accepted:false,reason:'blocked'};
      const anchor={x:p.x+direction.x*hit.timeOfImpact,y:p.y+direction.y*hit.timeOfImpact};
      release();
      state={anchor,normal:{x:hit.normal.x,y:hit.normal.y},pivots:[],length,reelRate:0};
      anchorBody=world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(anchor.x,anchor.y,0));
      constrain(length);
      return {accepted:true};
    },
    release,
    reel(rate) {
      if(!state || ![-1,0,1].includes(rate)) return {accepted:false,reason:'invalid'};
      state.reelRate=rate;return {accepted:true};
    },
    step(dt) {
      if(!state)return;
      const length=Math.max(MIN_LENGTH,Math.min(MAX_LENGTH,state.length+state.reelRate*REEL_SPEED*dt));
      if(length!==state.length){state.length=length;constrain(length);}
    },
    snapshot(){return state?structuredClone(state):null;},
    get attached(){return state!==null;},
  };
}
