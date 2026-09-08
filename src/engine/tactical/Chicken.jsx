import {useEffect,useMemo,useRef,useState} from 'react';
import {AnimationMixer,LoopOnce,LoopRepeat} from 'three';
import {useFrame} from '@react-three/fiber';
import {useGameAssets} from './GameAssets.jsx';
function HeldWeapon({id}){
 if(id==='kick')return <mesh position={[.18,.11,.19]}><boxGeometry args={[.29,.12,.15]}/><meshLambertMaterial color="#8F5BFF"/></mesh>;
 if(id==='mine')return <group position={[.38,.6,.2]}><mesh><cylinderGeometry args={[.16,.18,.09,10]}/><meshLambertMaterial color="#56745C"/></mesh><mesh position={[0,.07,0]}><sphereGeometry args={[.045,8,6]}/><meshLambertMaterial color="#F2E500"/></mesh></group>;
 if(id==='granajko'||id==='cluster')return <group position={[.4,.64,.2]}>{(id==='cluster'?[-1,0,1]:[0]).map((v,i)=><mesh key={i} position={[v*.1,Math.abs(v)*.02,0]} scale={[.09,.13,.09]}><sphereGeometry args={[1,10,8]}/><meshLambertMaterial color={id==='cluster'?'#F2E500':'#FFFEFA'}/></mesh>)}</group>;
 return <group position={[.35,.61,.2]} rotation={[0,0,-Math.PI/2]}>{(id==='shotgun'?[-.05,.05]:[0]).map((y,i)=><mesh key={i} position={[y,0,0]}><cylinderGeometry args={[id==='shotgun'?.035:.075,id==='shotgun'?.04:.09,.52,10]}/><meshLambertMaterial color="#38505A"/></mesh>)}<mesh position={[0,-.22,0]}><cylinderGeometry args={[.1,.1,.075,10]}/><meshLambertMaterial color={id==='shotgun'?'#B88047':'#00D6D8'}/></mesh></group>;
}
export function Chicken({sim,actorId,side='player',boss=false,position,decorative=false}){
 const assets=useGameAssets(),actor=sim?.actors.find(a=>a.id===actorId)??sim?.[side];
 const role=actor?.role??(side==='player'?'hero':boss?'boss':'shooter');
 const {scene,animations}=assets.models[role];const clone=useMemo(()=>{const copy=scene.clone(true);copy.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return copy},[scene]);
 const mixer=useMemo(()=>new AnimationMixer(clone),[clone]);const clips=useMemo(()=>Object.fromEntries(animations.map(clip=>[clip.name,mixer.clipAction(clip)])),[mixer,animations]);
 const root=useRef(),figure=useRef(),playing=useRef(),lastTime=useRef(null),grounded=useRef(false),landAt=useRef(-10),attackUntil=useRef(-1),lastPhase=useRef('');
 const [weapon,setWeapon]=useState(side==='player'?sim?.selectedWeaponId??'jajooka':role==='grenadier'?'granajko':'jajooka');
 useEffect(()=>()=>{mixer.stopAllAction();mixer.uncacheRoot(clone)},[mixer,clone]);
 useFrame(({clock})=>{
  if(sim?.disposed)return;const t=sim?.time??clock.elapsedTime,p=actor?.body.translation(),v=actor?.body.linvel();
  if(root.current&&p)root.current.position.set(p.x,p.y-.55,0);
  if(figure.current){const left=side==='player'?sim?.facing===-1:sim?.player.body.translation().x<p?.x;figure.current.rotation.y=left?Math.PI:0;}
  if(actor?.grounded&&!grounded.current)landAt.current=t;grounded.current=actor?.grounded;
  const phase=sim?.phase,attacking=side==='player'?phase==='player-shot':sim?.activeEnemyId===actorId&&(phase==='enemy-tell'||phase==='enemy-charge');
  if(attacking&&phase!==lastPhase.current)attackUntil.current=t+.4;lastPhase.current=phase;
  const name=actor?.health<=0?'Defeat':actor&&t-actor.hitAt<.28?'Hit':side==='player'&&sim?.rope.attached?'Swing':actor&&!actor.grounded?'Jump':t-landAt.current<.28?'Land':t<attackUntil.current?'Attack':Math.abs(v?.x??0)>.15?'Walk':'Idle';
  if(name!==playing.current){clips[playing.current]?.fadeOut(.08);const action=clips[name];if(action){action.reset().setLoop(['Idle','Walk','Swing'].includes(name)?LoopRepeat:LoopOnce,Infinity);action.clampWhenFinished=true;action.fadeIn(.08).play();}playing.current=name;}
  mixer.update(lastTime.current===null?0:Math.max(0,Math.min(.1,t-lastTime.current)));lastTime.current=t;
  const id=side==='player'?sim?.selectedWeaponId:role==='grenadier'?'granajko':role==='rusher'?'kick':'jajooka';if(id&&id!==weapon)setWeapon(id);
 });
 return <group ref={root} position={position??[0,0,0]} scale={decorative?1.7:1}><group ref={figure} scale={role==='boss'?1.14:1}><primitive object={clone}/><HeldWeapon id={weapon}/></group><mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]}><circleGeometry args={[.38,16]}/><meshBasicMaterial color="#243732" transparent opacity={.13} depthWrite={false}/></mesh></group>;
}
