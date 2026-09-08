import {Castle} from './World.jsx';
export function BrandWorld({arena}) {
 return <>
  <color attach="background" args={['#CFEBD6']}/>
  <ambientLight intensity={1.1}/><hemisphereLight args={['#FFFEED','#65839C',1.7]}/>
  <directionalLight position={[-8,20,15]} intensity={2.3} color="#FFF3BC"/>
  <mesh position={[arena.width*.7,arena.height*.6,-20]}><circleGeometry args={[3,32]}/><meshBasicMaterial color="#F2E500"/></mesh>
  {Array.from({length:9},(_,i)=><mesh key={'hill'+i} position={[i*8-8,2,-15-(i%2)*3]} scale={[8,4+i%3*2,3]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={i%2?'#82BDA2':'#ABD6B3'} flatShading/></mesh>)}
  {Array.from({length:16},(_,i)=><group key={'tree'+i} position={[i*3.8-3,2.5,-4-i%3]}>
   <mesh position={[0,.9,0]}><cylinderGeometry args={[.12,.18,1.8,5]}/><meshStandardMaterial color="#AD8048"/></mesh>
   <mesh position={[0,2.2,0]} scale={[.9,1.4,.8]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%3?'#41A783':'#73C693'} flatShading/></mesh>
  </group>)}
  <Castle position={[arena.width*.78,2.5,-6]} scale={1.6}/>
  {Array.from({length:5},(_,i)=><group key={'cloud'+i} position={[i*12,12+i%2*4,-12]}>
   {[0,1,2].map(j=><mesh key={j} position={[j*.8,j===1?.3:0,0]} scale={[1.2,.6,.7]}><icosahedronGeometry args={[1,1]}/><meshBasicMaterial color="#F8F7F3"/></mesh>)}
  </group>)}
 </>;
}
