import R from '@dimforge/rapier3d-compat';
import {boundaryCorners} from './terrain/geometry.js';

const MIN_LENGTH=1.2,MAX_LENGTH=18,REEL_SPEED=4;
const zero={x:0,y:0,z:0};
const contourCache=new WeakMap();
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function ropeSegmentClear(a,b,terrain,spacing=.03) {
  const length=distance(a,b),steps=Math.max(2,Math.ceil(length/spacing));
  for(let n=1;n<steps;n++) {
    const f=n/steps;
    if(terrain.materialAt(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f)) return false;
  }
  return true;
}

export function traceRopePath({anchor,player,pivots,terrain}) {
  const clear=(a,b)=>ropeSegmentClear(a,b,terrain);
  if(clear(anchor,player)) return [];
  const old=pivots.filter(p=>!terrain.materialAt(p.x,p.y)).map(p=>({...p}));
  // Unwrap only when the shortcut is visible; retain the existing side otherwise.
  for(let i=old.length-1;i>=0;i--) {
    if(clear(i?old[i-1]:anchor,i+1<old.length?old[i+1]:player)) old.splice(i,1);
  }
  const path=[anchor,...old,player];
  if(path.every((p,i)=>i===0||clear(path[i-1],p))) return old;
  let cache=contourCache.get(terrain);
  if(!cache || cache.revision!==terrain.revision) {
    cache={revision:terrain.revision,corners:boundaryCorners(terrain.snapshot()),edges:new Map()};
    contourCache.set(terrain,cache);
  }
  const candidates=cache.corners.filter(p=>distance(anchor,p)<=MAX_LENGTH&&distance(player,p)<=MAX_LENGTH)
    .sort((a,b)=>distance(anchor,a)+distance(a,player)-distance(anchor,b)-distance(b,player)).slice(0,128);
  const nodes=[anchor,...candidates,player],last=nodes.length-1;
  const costs=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Set();costs[0]=0;
  const visible=(i,j)=>{
    if(i===0||j===0||i===last||j===last) return clear(nodes[i],nodes[j]);
    const a=nodes[i],b=nodes[j],key=`${a.x},${a.y}:${b.x},${b.y}`;
    if(!cache.edges.has(key))cache.edges.set(key,clear(a,b));
    return cache.edges.get(key);
  };
  for(let n=0;n<nodes.length;n++) {
    let current=-1;
    for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(current<0||costs[i]<costs[current]))current=i;
    if(current<0||!Number.isFinite(costs[current]))break;
    if(current===last)break;
    visited.add(current);
    for(let next=1;next<nodes.length;next++) {
      if(visited.has(next))continue;
      const cost=costs[current]+distance(nodes[current],nodes[next]);
      if(cost<costs[next] && visible(current,next)){costs[next]=cost;previous[next]=current;}
    }
  }
  if(previous[last]<0)throw new Error('Rope path blocked');
  const result=[];
  for(let i=previous[last];i>0;i=previous[i]) {
    result.unshift(nodes[i]);
    if(result.length>12)throw new Error('Rope pivot budget exceeded');
  }
  return result;
}

export function createRope({world,playerBody,terrain,onRelease=()=>{}}) {
  let state=null,anchorBody=null,joint=null,constraintLength=0;
  function constrain(length) {
    if(joint){world.removeImpulseJoint(joint,true);joint=null;}
    joint=world.createImpulseJoint(R.JointData.rope(length,zero,zero),anchorBody,playerBody,true);
    constraintLength=length;
  }
  function release(reason='manual') {
    const wasAttached=!!state;
    if(joint){world.removeImpulseJoint(joint,true);joint=null;}
    if(anchorBody){world.removeRigidBody(anchorBody);anchorBody=null;}
    state=null;
    if(wasAttached)onRelease(reason);
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
      if(terrain) {
        if(!terrain.materialAt(state.anchor.x-state.normal.x*.03,state.anchor.y-state.normal.y*.03)) {release('anchor-destroyed');return;}
        try{state.pivots=traceRopePath({anchor:state.anchor,player:playerBody.translation(),pivots:state.pivots,terrain});}
        catch{release('blocked');return;}
      }
      let used=0,previous=state.anchor;
      for(const pivot of state.pivots){used+=distance(previous,pivot);previous=pivot;}
      if(used+MIN_LENGTH>MAX_LENGTH){release('range');return;}
      const length=Math.max(used+MIN_LENGTH,Math.min(MAX_LENGTH,state.length+state.reelRate*REEL_SPEED*dt));
      state.length=length;
      anchorBody.setTranslation({...previous,z:0},true);
      const freeLength=length-used;
      if(Math.abs(freeLength-constraintLength)>.0001)constrain(freeLength);
    },
    snapshot(){return state?structuredClone(state):null;},
    get attached(){return state!==null;},
  };
}
