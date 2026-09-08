import {useMemo,useRef,useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {BufferGeometry,Vector3} from 'three';
import {previewTool} from './weapons.js';
export function RopeVisual({sim}) {
 const line=useRef(),geometry=useMemo(()=>new BufferGeometry().setFromPoints(Array.from({length:14},()=>new Vector3())),[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useFrame(()=>{
  if(sim.disposed||!line.current)return;const rope=sim.rope.snapshot();line.current.visible=!!rope;if(!rope)return;
  const points=[rope.anchor,...rope.pivots,sim.player.body.translation()];
  points.forEach((p,i)=>geometry.attributes.position.setXYZ(i,p.x,p.y,1.35));
  geometry.attributes.position.needsUpdate=true;geometry.setDrawRange(0,points.length);geometry.computeBoundingSphere();
 });
 return <line ref={line} geometry={geometry} frustumCulled={false}><lineBasicMaterial color="#020304" linewidth={3}/></line>;
}
export function ToolVisual({sim,toolId,visible}) {
 const ref=useRef();useFrame(()=>{
  if(sim.disposed||!ref.current)return;ref.current.visible=visible;if(!visible)return;
  const preview=previewTool({toolId,direction:sim.facing},sim.snapshot({includeTerrain:false}),sim.terrain);
  if(!preview.area){ref.current.visible=false;return;}
  const a=preview.area;ref.current.position.set(a.x+a.width/2,a.y+a.height/2,1.3);ref.current.scale.set(a.width,a.height,1);
  ref.current.material.color.set(preview.allowed?'#F2E500':'#E34959');
 });
 return <mesh ref={ref}><planeGeometry/><meshBasicMaterial color="#F2E500" transparent opacity={.4} depthWrite={false}/></mesh>;
}
