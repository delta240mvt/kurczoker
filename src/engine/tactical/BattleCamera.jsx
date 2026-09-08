import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {cameraTarget} from './camera.js';
import {cameraShake} from './settings.js';
export function BattleCamera({sim,view={mode:'move'},settings={}}) {
 const previous=useRef(null),{camera,size}=useThree();
 useFrame((_,dt)=>{
  if(sim.disposed)return;
  const target=cameraTarget({viewport:size,bounds:sim.arena,actor:sim.player.snapshot(),
   projectile:sim.projectiles[0],rope:sim.rope.snapshot(),mode:view.mode,
   ropeOverview:view.ropeOverview,hudScale:settings.hudScale,overviewCenter:view.overviewCenter,dt:settings.reducedMotion?1:dt,previous:previous.current});
  const shake=cameraShake({time:sim.time,hitAt:sim.player.hitAt,shake:settings.shake,reducedMotion:settings.reducedMotion});
  previous.current=target;camera.position.set(target.x+shake.x,target.y+shake.y,40);
  camera.lookAt(target.x+shake.x,target.y+shake.y,0);camera.zoom=target.zoom;camera.updateProjectionMatrix();
 });
 return null;
}
