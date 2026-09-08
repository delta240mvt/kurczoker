import {Castle} from './World.jsx';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
function Mill({x,y}){
 const blades=useRef();useFrame((_,dt)=>{if(blades.current)blades.current.rotation.z+=dt*.25});
 return <group position={[x,y,-5]}><mesh position={[0,2,0]}><cylinderGeometry args={[1,1.7,4,6]}/><meshStandardMaterial color="#FFF0D5"/></mesh><group ref={blades} position={[0,3.5,1.8]}>{[0,1].map(i=><mesh key={i} rotation={[0,0,i*Math.PI/2]}><boxGeometry args={[6,.45,.2]}/><meshStandardMaterial color="#B17548"/></mesh>)}</group></group>;
}
export function BrandWorld({arena}) {
 const cave=arena.theme==='cave',water=arena.theme==='water',canyon=arena.theme==='canyon';
 return <>
  <color attach="background" args={[cave?'#57537B':water?'#C4EAF3':canyon?'#F2D5B8':'#CFEBD6']}/>
  <ambientLight intensity={1.1}/><hemisphereLight args={['#FFFEED','#65839C',1.7]}/>
  <directionalLight position={[-8,20,15]} intensity={2.3} color="#FFF3BC"/>
  {!cave&&<mesh position={[arena.width*.7,arena.height*.6,-20]}><circleGeometry args={[3,32]}/><meshBasicMaterial color="#F2E500"/></mesh>}
  {!cave&&Array.from({length:9},(_,i)=><mesh key={'hill'+i} position={[i*8-8,2,-15-(i%2)*3]} scale={[8,4+i%3*2,3]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={i%2?'#82BDA2':'#ABD6B3'} flatShading/></mesh>)}
  {!cave&&Array.from({length:Math.ceil(arena.width/4)},(_,i)=><group key={'tree'+i} position={[i*4-3,2.5,-4-i%3]}>
   <mesh position={[0,.9,0]}><cylinderGeometry args={[.12,.18,1.8,5]}/><meshStandardMaterial color="#AD8048"/></mesh>
   <mesh position={[0,2.2,0]} scale={[.9,1.4,.8]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%3?'#41A783':'#73C693'} flatShading/></mesh>
  </group>)}
  {arena.theme==='mill'?<Mill x={25} y={26}/>:!cave&&<Castle position={[arena.width*.78,2.5,-6]} scale={arena.theme==='fortress'?2.8:1.6}/>}
  {water&&<mesh position={[arena.width/2,-.8,-2]}><boxGeometry args={[arena.width,1,8]}/><meshStandardMaterial color="#28B5C4" roughness={.25}/></mesh>}
  {cave&&Array.from({length:12},(_,i)=><mesh key={'crystal'+i} position={[i*5+3,2.7,-2.5]} rotation={[0,0,(i%3-1)*.3]}><coneGeometry args={[.6,2,5]}/><meshStandardMaterial color={i%2?'#00D6D8':'#BD93EE'} emissive="#594477" emissiveIntensity={.4}/></mesh>)}
  {!cave&&Array.from({length:5},(_,i)=><group key={'cloud'+i} position={[i*12,12+i%2*4,-12]}>
   {[0,1,2].map(j=><mesh key={j} position={[j*.8,j===1?.3:0,0]} scale={[1.2,.6,.7]}><icosahedronGeometry args={[1,1]}/><meshBasicMaterial color="#F8F7F3"/></mesh>)}
  </group>)}
 </>;
}
