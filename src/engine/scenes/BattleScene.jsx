import {useFrame,useThree} from '@react-three/fiber';
import {useRef,useState} from 'react';
import {World} from '../tactical/World.jsx';
import {BrandWorld} from '../tactical/BrandWorld.jsx';
import {TerrainView} from '../tactical/TerrainView.jsx';
import {RopeVisual,ToolVisual} from '../tactical/TacticalOverlays.jsx';
import {Chicken} from '../tactical/Chicken.jsx';
import {ShotVisual,ImpactVisual,MineVisual,ConeVisual} from '../tactical/Effects.jsx';
export function BattleScene({sim,quality,onSnapshot,onEvent,onOutcome,onReady,onAim,view={mode:'move'},toolId='pickaxe',onCommand,onView}) {
 const lastPublish=useRef(-1),resolved=useRef(false),ready=useRef(false),drag=useRef(null);
 const [impacts,setImpacts]=useState([]),[cone,setCone]=useState(null),[terrain,setTerrain]=useState(()=>sim.terrain?.snapshot());
 const revision=useRef(sim.terrain?.revision),{camera}=useThree();
 useFrame((_,delta)=>{
  if(!sim||sim.disposed)return;
  if(!ready.current){ready.current=true;onReady();}
  sim.advance(delta);
  if(sim.terrain?.revision!==revision.current){revision.current=sim.terrain.revision;setTerrain(sim.terrain.snapshot());}
  if(sim.time-lastPublish.current>=.1||sim.outcome){
   lastPublish.current=sim.time;onSnapshot(sim.snapshot({includeTerrain:false}));
  }
  const incoming=[];
  for(const event of sim.drainEvents()){onEvent(event);if(event.type==='impact')incoming.push(event);if(event.type==='shotgun')setCone(event);}
  if(incoming.length)setImpacts(previous=>[...previous.filter(e=>sim.time-e.time<.8),...incoming].slice(-12));
  if(sim.outcome&&!resolved.current){resolved.current=true;onOutcome(sim.snapshot({includeTerrain:false}));}
 },-2);
 function point(e,down=false){
  if(!sim.terrain){onAim?.(e.point);return;}
  if(view.mode==='overview'||view.mode==='rope'&&view.ropeOverview) {
   if(down){drag.current={x:e.clientX,y:e.clientY,cx:view.overviewCenter?.x??sim.arena.width/2,cy:view.overviewCenter?.y??sim.arena.height/2};e.target.setPointerCapture(e.pointerId);}
   else if(drag.current && e.buttons){const d=drag.current;onView({...view,overviewCenter:{...view.overviewCenter,x:d.cx-(e.clientX-d.x)/camera.zoom,y:d.cy+(e.clientY-d.y)/camera.zoom}});}
  } else if(view.mode==='rope'&&down){
   onCommand({type:'rope.attach',point:sim.terrainTarget(e.point)??e.point});
  } else if(view.mode==='aim'&&(down||e.buttons)){
   const p=sim.player.body.translation();onCommand({type:'aim',angleDeg:Math.atan2(e.point.y-p.y-.2,e.point.x-p.x)*180/Math.PI,power:sim.power});
  }
 }
 return <>
  {terrain?<><BrandWorld arena={sim.arena}/><TerrainView terrainSnapshot={terrain}/><RopeVisual sim={sim}/><ToolVisual sim={sim} toolId={toolId} visible={view.mode==='tool'}/></>:<World arena={sim.arena} quality={quality}/>}
  {sim.actors.map(a=><Chicken key={a.id} sim={sim} actorId={a.id} side={a.team} boss={a.role==='boss'||sim.options.type==='boss'&&a.team==='enemy'}/>)}
  <ShotVisual sim={sim} showAim={!terrain||view.mode==='aim'}/>
  {impacts.map(impact=><ImpactVisual key={impact.id} event={impact} sim={sim}/>)}
  <MineVisual sim={sim}/>{cone&&<ConeVisual key={cone.id} event={cone} sim={sim}/>}
  <mesh position={terrain?[sim.arena.width/2,sim.arena.height/2,3]:[0,3,0]}
   onPointerDown={e=>{e.stopPropagation();point(e,true)}}
   onPointerMove={e=>{if(e.pointerType!=='touch'||e.buttons)point(e)}}
   onPointerUp={e=>{if(view.mode==='rope'&&view.ropeOverview&&drag.current&&Math.hypot(e.clientX-drag.current.x,e.clientY-drag.current.y)<6){const r=onCommand({type:'rope.attach',point:sim.terrainTarget(e.point)??e.point});if(r?.accepted)onView({...view,ropeOverview:false});}drag.current=null;}} onPointerCancel={()=>{drag.current=null}}>
   <planeGeometry args={terrain?[sim.arena.width+40,sim.arena.height+40]:[18,12]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/>
  </mesh>
 </>;
}
