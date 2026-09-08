import {GRAVITY,WEAPONS} from './config.js';
import {predictTrajectory} from './projectiles.js';
import {standingNodes,canJumpBetween,bodyClear} from './maps/validation.js';
const graphCache=new WeakMap();
export function scoreEnemyAction({role,damage,selfDamage,distanceAfter,opensPath}){
 return damage*3-selfDamage*5+(opensPath?8:0)-distanceAfter*(role==='rusher'?2:.2);
}
export function buildWalkGraph(terrain,actorSize){
 const key=JSON.stringify(actorSize??{}),cached=graphCache.get(terrain);
 if(cached?.revision===terrain.revision&&cached.key===key)return cached;
 const {width,height}=terrain.snapshot(),nodes=standingNodes(terrain,width,height,actorSize),edges=[];
 for(let from=0;from<nodes.length;from++)for(let to=0;to<nodes.length;to++)if(from!==to&&canJumpBetween(terrain,nodes[from],nodes[to],actorSize))edges.push({from,to,jump:nodes[to].y>nodes[from].y+.2});
 const graph={nodes,edges,revision:terrain.revision,key};graphCache.set(terrain,graph);return graph;
}
function directAim(actor,target){
 const dx=target.x-actor.x,dy=target.y-actor.y,flight=Math.max(1.1,Math.min(3,Math.abs(dx)/8));
 const vx=dx/flight,vy=(dy-.2-.5*GRAVITY*flight*flight)/flight;
 return {angleDeg:Math.atan2(vy,vx)*180/Math.PI,power:Math.min(18,Math.hypot(vx,vy))};
}
function nextMovement(actor,target,terrain){
 const graph=buildWalkGraph(terrain);if(!graph.nodes.length)return {moveDirection:0,moveSeconds:0,jump:false};
 const nearest=p=>graph.nodes.reduce((best,n,i)=>Math.hypot(n.x-p.x,n.y-p.y)<Math.hypot(graph.nodes[best].x-p.x,graph.nodes[best].y-p.y)?i:best,0);
 const start=nearest(actor),goal=nearest(target),queue=[start],previous=new Map([[start,null]]);
 const outgoing=new Map();for(const e of graph.edges){if(!outgoing.has(e.from))outgoing.set(e.from,[]);outgoing.get(e.from).push(e)}
 for(let i=0;i<queue.length&&!previous.has(goal);i++)for(const e of outgoing.get(queue[i])??[])if(!previous.has(e.to)){previous.set(e.to,e);queue.push(e.to)}
 if(!previous.has(goal)||start===goal)return {moveDirection:0,moveSeconds:0,jump:false};
 let edge=previous.get(goal);while(edge&&edge.from!==start)edge=previous.get(edge.from);
 const point=graph.nodes[edge.to],dx=point.x-actor.x;
 return {moveDirection:Math.sign(dx),moveSeconds:Math.min(1,Math.abs(dx)/3),jump:edge.jump};
}
/** A bounded set of shared-integrator trajectories, with no terrain mutation. */
export function planEnemyAction({actor,snapshot,terrain,castSegment,allowMove=true}){
 const target=snapshot.actors.find(a=>a.team==='player'&&a.health>0);if(!target||actor.health<=0)return null;
 const direction=Math.sign(target.x-actor.x),distance=Math.hypot(target.x-actor.x,target.y-actor.y),direct=directAim(actor,target);
 if(!terrain||!castSegment)return {moveDirection:0,moveSeconds:0,weaponId:'jajooka',...direct,candidatesEvaluated:1};
 if(actor.role==='rusher'&&distance<=WEAPONS.kick.range&&bodyClear(terrain,(actor.x+target.x)/2,(actor.y+target.y)/2))return {moveDirection:0,moveSeconds:0,weaponId:'kick',angleDeg:direction<0?180:0,power:0,candidatesEvaluated:1};
 const movement=allowMove&&distance>(actor.role==='rusher'?1.1:10)?nextMovement(actor,target,terrain):{moveDirection:0,moveSeconds:0,jump:false};
 const weaponId=actor.role==='grenadier'?'granajko':'jajooka',definition=WEAPONS[weaponId];
 const positions=[{x:actor.x,y:actor.y,moveDirection:0,moveSeconds:0,jump:false}];
 if(movement.moveSeconds>0)positions.push({x:actor.x+movement.moveDirection*3*movement.moveSeconds,y:actor.y,...movement});
 let best=null,evaluated=0;
 for(const position of positions){
  const angles=[...new Set([direct.angleDeg,...[15,30,45,60,75,90,105,120,135,150,165]])];
  for(const angleDeg of angles)for(const power of [6,9,12,15,18]){
   evaluated++;
   const radians=angleDeg*Math.PI/180,origin={x:position.x+Math.cos(radians)*.48,y:position.y+Math.sin(radians)*.48+.2};
   const points=predictTrajectory({origin,angleDeg,power,ownerId:actor.id,weaponId,castSegment,maxSteps:210});
   const end=points.at(-1),damage=Math.max(0,definition.damage*(1-Math.hypot(end.x-target.x,end.y-target.y)/definition.radius));
   const selfDamage=Math.max(0,definition.damage*(1-Math.hypot(end.x-position.x,end.y-position.y)/definition.radius));
   const material=terrain.materialAt(end.x,end.y-.16),opensPath=material===1||material===2;
   const score=scoreEnemyAction({role:actor.role,damage,selfDamage,distanceAfter:Math.hypot(target.x-position.x,target.y-position.y),opensPath});
   if(!best||score>best.score)best={score,moveDirection:position.moveDirection,moveSeconds:position.moveSeconds,jump:position.jump,weaponId,angleDeg,power};
  }
 }
 return best?{...best,candidatesEvaluated:evaluated}:null;
}
