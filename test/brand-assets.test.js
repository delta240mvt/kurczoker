import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3} from 'three';
import {createBrandCharacter} from '../tools/create-brand-character.mjs';
test('five roles have real geometry and eight distinct decoded animation clips',async()=>{
 const manifest=JSON.parse(await readFile('src/engine/tactical/releaseManifest.json','utf8'));
 assert.equal(manifest.schemaVersion,2);assert.deepEqual(manifest.assets.map(a=>a.id),['hero','shooter','grenadier','rusher','boss']);
 await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
 for(const asset of manifest.assets){
  const bytes=await readFile('public'+asset.url);assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.ok(bytes.length<100000);
  const root=(await io.readBinary(bytes)).getRoot();assert.deepEqual(root.listAnimations().map(a=>a.getName()),['Idle','Walk','Jump','Swing','Land','Attack','Hit','Defeat']);assert.equal(root.listTextures().length,0);
  const animations=root.listAnimations().map(a=>JSON.stringify(a.listSamplers().map(s=>Array.from(s.getOutput().getArray()))));assert.equal(new Set(animations).size,8);
  assert.ok(root.listMeshes().length>0);assert.match(asset.provenance,/Original/);assert.ok(asset.clips.includes('Swing'));
 }
 assert.equal(manifest.decoders.ktx2,null);assert.ok(manifest.decoders.meshopt);
});

test('optimization preserves both eyes and the bounds of every material',async()=>{
 const manifest=JSON.parse(await readFile('src/engine/tactical/releaseManifest.json','utf8'));
 const bounds=scene=>{scene.updateMatrixWorld(true);const result=new Map();scene.traverse(o=>{if(!o.isMesh)return;const color=o.material.color.getHexString();if(!result.has(color))result.set(color,new Box3());result.get(color).union(new Box3().setFromObject(o))});return result};
 for(const asset of manifest.assets){
  const bytes=await readFile('public'+asset.url),gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const actual=bounds(gltf.scene),expected=bounds(createBrandCharacter(asset.id).scene);
  for(const [color,box] of expected){const got=actual.get(color);assert.ok(got,asset.id+' '+color);for(const end of ['min','max'])for(const axis of ['x','y','z'])assert.ok(Math.abs(got[end][axis]-box[end][axis])<.002,JSON.stringify({id:asset.id,color,end,axis,expected:box[end][axis],actual:got[end][axis]}));}
 }
});
