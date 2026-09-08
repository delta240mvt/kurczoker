import * as T from 'three';

/** Original DELTA240MVT models. Y up, +X forward; articulated local pivots. */
export function createBrandCharacter(role){
 const root=new T.Group();root.name=role;const rig=new T.Group();rig.name='rig';root.add(rig);
 const boss=role==='boss',hero=role==='hero',palette={feather:hero?'#FFFEFA':boss?'#392E56':'#D95359',shade:hero?'#E9DBC3':boss?'#62517E':'#B83C50',beak:'#F3B32E',ink:'#020304',metal:'#647F84',accent:hero?'#00D6D8':role==='grenadier'?'#77B965':role==='rusher'?'#8F5BFF':'#E5BD67',gold:'#F2E500'};
 const materials=Object.fromEntries(Object.entries(palette).map(([k,color])=>[k,new T.MeshStandardMaterial({color,roughness:.83,flatShading:true})]));
 function mesh(parent,name,geometry,color,position,scale=[1,1,1],rotation=[0,0,0]){const m=new T.Mesh(geometry,materials[color]);m.name=name;m.position.set(...position);m.scale.set(...scale);m.rotation.set(...rotation);parent.add(m);return m}
 const ball=(p,n,c,pos,scale)=>mesh(p,n,new T.SphereGeometry(1,16,10),c,pos,scale);
 const box=(p,n,c,pos,size,rotation)=>mesh(p,n,new T.BoxGeometry(...size),c,pos,[1,1,1],rotation);
 const cone=(p,n,c,pos,r,h,rotation)=>mesh(p,n,new T.ConeGeometry(r,h,10),c,pos,[1,1,1],rotation);
 ball(rig,'body','feather',[0,.51,0],[.34,.38,.29]);ball(rig,'breast','shade',[.15,.5,0],[.23,.28,.26]);
 ball(rig,'head','feather',[.13,.9,0],[.265,.25,.24]);
 cone(rig,'beak','beak',[.42,.87,0],.10,.24,[0,0,-Math.PI/2]);
 for(const side of [-1,1]){ball(rig,'eye_'+side,'ink',[.265,.98,side*.185],[.045,.06,.034]);ball(rig,'glint_'+side,'feather',[.278,1.003,side*.211],[.011,.014,.007]);}
 for(const side of [-1,1]){
  const wing=new T.Group();wing.name=side===1?'wing_L':'wing_R';wing.position.set(-.06,.66,side*.245);rig.add(wing);
  ball(wing,'wing_feathers_'+side,'shade',[0,-.10,side*.04],[.20,.22,.095]);
  for(let i=0;i<3;i++)ball(wing,'wing_tip_'+side+'_'+i,'feather',[-.11+i*.09,-.26,side*.045],[.07,.10,.05]);
  const foot=new T.Group();foot.name=side===1?'foot_L':'foot_R';foot.position.set(0,.19,side*.13);rig.add(foot);
  mesh(foot,'leg_'+side,new T.CylinderGeometry(.026,.034,.17,8),'beak',[0,-.05,0]);box(foot,'toes_'+side,'beak',[.09,-.15,0],[.23,.045,.115]);
 }
 for(let i=0;i<3;i++)ball(rig,'tail_'+i,'shade',[-.32-i*.035,.6+i*.08,0],[.16,.085,.1]);
 mesh(rig,'scarf',new T.CylinderGeometry(.22,.25,.09,12),'accent',[.1,.75,0]);
 if(hero){
  mesh(rig,'helmet_dome',new T.SphereGeometry(.285,16,8,0,Math.PI*2,0,Math.PI/2),'metal',[.10,1.03,0]);
  mesh(rig,'helmet_rim',new T.CylinderGeometry(.295,.295,.045,16),'accent',[.10,1.03,0]);
  for(let i=0;i<3;i++)ball(rig,'plume_'+i,'gold',[-.02+i*.065,1.29-Math.abs(1-i)*.025,0],[.047,.075,.04]);
  box(rig,'backpack','accent',[-.30,.54,0],[.13,.25,.31]);
 }else if(boss){
  mesh(rig,'crown_ring',new T.CylinderGeometry(.25,.27,.14,12),'gold',[.11,1.09,0]);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;cone(rig,'crown_point_'+i,'gold',[.11+Math.cos(a)*.23,1.24,Math.sin(a)*.23],.075,.22);}
  box(rig,'cape','accent',[-.28,.5,-.03],[.12,.60,.43]);
 }else{
  for(let i=0;i<3;i++)ball(rig,'comb_'+i,'gold',[.02+i*.08,1.16-Math.abs(1-i)*.025,0],[.065,.09,.045]);
  mesh(rig,'headband',new T.CylinderGeometry(.26,.26,.065,12),'accent',[.13,1.03,0]);
  if(role==='grenadier')for(const z of [-.15,0,.15])ball(rig,'grenade_'+z,'accent',[-.24,.55,z],[.08,.12,.07]);
  if(role==='rusher')box(rig,'runner_band','accent',[0,.38,0],[.62,.10,.53]);
 }
 const animations=[];
 const definitions=[['Idle',2.4,.025,.03],['Walk',.48,.05,.55],['Jump',.65,.03,.8],['Swing',1,.02,1.3],['Land',.28,-.055,.25],['Attack',.4,.035,1.6],['Hit',.32,-.02,.5],['Defeat',.8,-.1,.3]];
 for(const [name,duration,bob,amplitude] of definitions){
  const times=[0,duration*.25,duration*.5,duration*.75,duration],curve=name==='Defeat'?[0,.3,.7,1,1]:name==='Jump'?[0,.7,1,.7,0]:[0,1,0,-.5,0];
  const positions=curve.flatMap(v=>[name==='Defeat'?v*.12:0,bob*v,0]);
  const quats=(axis,values)=>values.flatMap(a=>new T.Quaternion().setFromAxisAngle(axis,a).toArray());
  const z=new T.Vector3(0,0,1),x=new T.Vector3(1,0,0);
  const tracks=[new T.VectorKeyframeTrack('rig.position',times,positions),new T.QuaternionKeyframeTrack('rig.quaternion',times,quats(z,curve.map(v=>v*(name==='Defeat'?-1.45:name==='Hit'?.3:name==='Attack'?-.12:0))))];
  for(const side of ['L','R']){
   const sign=side==='L'?1:-1;
   tracks.push(new T.QuaternionKeyframeTrack('wing_'+side+'.quaternion',times,quats(name==='Attack'?z:x,curve.map(v=>v*amplitude*sign))));
   tracks.push(new T.QuaternionKeyframeTrack('foot_'+side+'.quaternion',times,quats(z,curve.map(v=>v*(name==='Walk'?.55:name==='Jump'?.7:.025)*sign))));
  }
  animations.push(new T.AnimationClip(name,duration,tracks));
 }
 root.updateMatrixWorld(true);return {scene:root,animations};
}
