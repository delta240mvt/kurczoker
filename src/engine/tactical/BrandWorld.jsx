import {Castle} from './World.jsx';
import {useRef,useLayoutEffect} from 'react';
import {Object3D,Color} from 'three';
import {useFrame} from '@react-three/fiber';
function Instances({items,children}){
 const ref=useRef();useLayoutEffect(()=>{const dummy=new Object3D();items.forEach((item,i)=>{dummy.position.set(...item.position);dummy.scale.set(...(item.scale??[1,1,1]));dummy.rotation.set(...(item.rotation??[0,0,0]));dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix);ref.current.setColorAt(i,new Color(item.color));});ref.current.instanceMatrix.needsUpdate=true;ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere()},[items]);
 return <instancedMesh ref={ref} args={[null,null,items.length]}>{children}<meshLambertMaterial flatShading/></instancedMesh>;
}
function Mill({x,y,sim}){
 const blades=useRef();useFrame(()=>{if(blades.current)blades.current.rotation.z=(sim?.time??0)*.25});
 return <group position={[x,y,-5]}><mesh position={[0,2,0]}><cylinderGeometry args={[1,1.7,4,6]}/><meshLambertMaterial color="#FFF0D5"/></mesh><group ref={blades} position={[0,3.5,1.8]}>{[0,1].map(i=><mesh key={i} rotation={[0,0,i*Math.PI/2]}><boxGeometry args={[6,.45,.2]}/><meshLambertMaterial color="#B17548"/></mesh>)}</group></group>;
}
export function BrandWorld({arena,sim,quality,reducedMotion=false}) {
 const cave=arena.theme==='cave',water=arena.theme==='water',canyon=arena.theme==='canyon';
 return <>
  <color attach="background" args={[cave?'#57537B':water?'#C4EAF3':canyon?'#F2D5B8':'#CFEBD6']}/>
  <ambientLight intensity={1.1}/><hemisphereLight args={['#FFFEED','#65839C',1.7]}/>
  <directionalLight position={[-8,20,15]} intensity={2.3} color="#FFF3BC"/>
  {!cave&&<mesh position={[arena.width*.7,arena.height*.6,-20]}><circleGeometry args={[3,32]}/><meshBasicMaterial color="#F2E500"/></mesh>}
  {!cave&&<Instances items={Array.from({length:9},(_,i)=>({position:[i*8-8,2,-15-(i%2)*3],scale:[8,4+i%3*2,3],color:i%2?'#82BDA2':'#ABD6B3'}))}><icosahedronGeometry args={[1,1]}/></Instances>}
  {!cave&&<><Instances items={Array.from({length:Math.ceil(arena.width/4)},(_,i)=>({position:[i*4-3,3.4,-4-i%3],color:'#AD8048'}))}><cylinderGeometry args={[.12,.18,1.8,5]}/></Instances>
   <Instances items={Array.from({length:Math.ceil(arena.width/4)},(_,i)=>({position:[i*4-3,4.7,-4-i%3],scale:[.9,1.4,.8],color:i%3?'#41A783':'#73C693'}))}><icosahedronGeometry args={[1,0]}/></Instances></>}
  {arena.theme==='mill'?<Mill x={25} y={26} sim={reducedMotion?null:sim}/>:!cave&&<Castle position={[arena.width*.78,2.5,-6]} scale={arena.theme==='fortress'?2.8:1.6}/>}
  {water&&<mesh position={[arena.width/2,-.8,-2]}><boxGeometry args={[arena.width,1,8]}/><meshLambertMaterial color="#28B5C4"/></mesh>}
  {cave&&<Instances items={Array.from({length:12},(_,i)=>({position:[i*5+3,2.7,-2.5],rotation:[0,0,(i%3-1)*.3],color:i%2?'#00D6D8':'#BD93EE'}))}><coneGeometry args={[.6,2,5]}/></Instances>}
  {!cave&&Array.from({length:5},(_,i)=><group key={'cloud'+i} position={[i*12,12+i%2*4,-12]}>
   {[0,1,2].map(j=><mesh key={j} position={[j*.8,j===1?.3:0,0]} scale={[1.2,.6,.7]}><icosahedronGeometry args={[1,1]}/><meshBasicMaterial color="#F8F7F3"/></mesh>)}
  </group>)}
 </>;
}
