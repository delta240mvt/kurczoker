import {GRAVITY} from './config.js';
/** A bounded physical shot. Later roles use the same command interface. */
export function planEnemyAction({actor,snapshot,terrain}) {
  const target=snapshot.actors.find(a=>a.team==='player'&&a.health>0);
  if(!target || actor.health<=0)return null;
  const dx=target.x-actor.x,dy=target.y-actor.y;
  const flight=Math.max(1.1,Math.min(3,Math.abs(dx)/8));
  const vx=dx/flight,vy=(dy-.2-.5*GRAVITY*flight*flight)/flight;
  const power=Math.min(18,Math.hypot(vx,vy));
  const direction=Math.sign(dx);
  const safe=terrain && terrain.materialAt(actor.x+direction*.7,actor.y-.7) &&
    !terrain.materialAt(actor.x+direction*.7,actor.y);
  return {moveDirection:safe&&Math.abs(dx)>14?direction:0,
    moveSeconds:safe&&Math.abs(dx)>14?.5:0,weaponId:'jajooka',
    angleDeg:Math.atan2(vy,vx)*180/Math.PI,power};
}
