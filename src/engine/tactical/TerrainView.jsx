import {useMemo} from 'react';
import {Object3D,Color} from 'three';
import {buildTerrainBoxes,buildGrassCaps} from './terrain/geometry.js';
const COLORS={1:'#9672BF',2:'#D9A348',3:'#486361'};
export function TerrainView({terrainSnapshot}) {
 const boxes=useMemo(()=>buildTerrainBoxes(terrainSnapshot),[terrainSnapshot]);
 const caps=useMemo(()=>buildGrassCaps(terrainSnapshot),[terrainSnapshot]);
 function place(mesh,items,cap=false){
  if(!mesh)return;const object=new Object3D();
  items.forEach((b,i)=>{
   object.position.set(b.x,cap?b.y+b.height/2-.04:b.y,cap?.02:0);
   object.scale.set(b.width,cap?.08:b.height,2.4);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);
   if(!cap)mesh.setColorAt(i,new Color(COLORS[b.material]));
  });mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
 }
 return <group>
  <instancedMesh key={'soil-'+terrainSnapshot.revision} args={[null,null,boxes.length]} ref={m=>place(m,boxes)} castShadow receiveShadow>
   <boxGeometry/><meshLambertMaterial flatShading/>
  </instancedMesh>
  <instancedMesh key={'grass-'+terrainSnapshot.revision} args={[null,null,caps.length]} ref={m=>place(m,caps,true)}>
   <boxGeometry/><meshLambertMaterial color="#A6D97A"/>
  </instancedMesh>
 </group>;
}
