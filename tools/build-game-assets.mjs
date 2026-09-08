import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,weld,meshopt,prune,join} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createBrandCharacter} from './create-brand-character.mjs';
globalThis.FileReader=class{async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.()}};
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const manifest={schemaVersion:2,assets:[],decoders:{meshopt:'bundled:three/addons/libs/meshopt_decoder.module.js',ktx2:null}};
await mkdir('public/game/release',{recursive:true});
for(const id of ['hero','shooter','grenadier','rusher','boss']){
 const {scene,animations}=createBrandCharacter(id);
 const raw=await new GLTFExporter().parseAsync(scene,{binary:true,animations});
 const doc=await io.readBinary(new Uint8Array(raw));
 await doc.transform(join(),dedup(),weld(),prune(),meshopt({encoder:MeshoptEncoder,level:'high'}));
 const bytes=await io.writeBinary(doc),sha256=createHash('sha256').update(bytes).digest('hex'),file=id+'.'+sha256.slice(0,12)+'.glb';
 await writeFile('public/game/release/'+file,bytes);
 manifest.assets.push({id,url:'/game/release/'+file,bytes:bytes.length,sha256,kind:'model',clips:doc.getRoot().listAnimations().map(a=>a.getName()),provenance:'Original procedural DELTA240MVT model and motion: tools/create-brand-character.mjs; generated-owned',compression:'EXT_meshopt_compression; material colors; no raster textures'});
}
await writeFile('src/engine/tactical/releaseManifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
