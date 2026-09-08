import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshLambertMaterial} from 'three';
import manifest from './releaseManifest.json';
export async function loadGameAssets({renderer,manifest:catalog=manifest,onProgress=()=>{}}){
 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 let ktx2;if(catalog.decoders.ktx2){ktx2=new KTX2Loader().setTranscoderPath(catalog.decoders.ktx2);ktx2.detectSupport(renderer);loader.setKTX2Loader(ktx2)}
 const models={},resources=new Set(),materials=new Map();let disposed=false;
 function dispose(){if(disposed)return;disposed=true;for(const resource of resources)resource.dispose();ktx2?.dispose()}
 try{
  const assets=catalog.assets.filter(a=>a.kind==='model');let loaded=0;
  // Sequential loading keeps peak decoding memory predictable on phones.
  for(const asset of assets){
   const gltf=await loader.loadAsync(asset.url);models[asset.id]=gltf;
   gltf.scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const material of o.material?Array.isArray(o.material)?o.material:[o.material]:[]){resources.add(material);for(const value of Object.values(material))if(value?.isTexture)resources.add(value)}});
   // Vertex lighting suits solid-color retro models and avoids a costly PBR shader on software GPUs.
   gltf.scene.traverse(o=>{if(!o.isMesh)return;const convert=source=>{if(!materials.has(source)){const material=new MeshLambertMaterial({color:source.color,emissive:source.emissive,emissiveIntensity:source.emissiveIntensity,map:source.map,opacity:source.opacity,transparent:source.transparent,side:source.side,vertexColors:source.vertexColors,flatShading:true});materials.set(source,material);resources.add(material)}return materials.get(source)};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material)});
   const clips=new Set(gltf.animations.map(a=>a.name));if(!asset.clips.every(name=>clips.has(name)))throw new Error('Niekompletny model: '+asset.id);
   onProgress(++loaded/assets.length);
  }
  return {models,dispose};
 }catch(error){dispose();throw error}
}
