import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {cameraTarget} from './camera.js';
export function BattleCamera({sim,view={mode:'move'}}) {
 const previous=useRef(null),{camera,size}=useThree();
 useFrame((_,dt)=>{
  if(sim.disposed)return;
  const target=cameraTarget({viewport:size,bounds:sim.arena,actor:sim.player.snapshot(),
   projectile:sim.projectiles[0],rope:sim.rope.snapshot(),mode:view.mode,
   ropeOverview:view.ropeOverview,overviewCenter:view.overviewCenter,dt,previous:previous.current});
  previous.current=target;camera.position.set(target.x,target.y,40);
  camera.lookAt(target.x,target.y,0);camera.zoom=target.zoom;camera.updateProjectionMatrix();
 });
 return null;
}
