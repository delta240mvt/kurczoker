import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSettings,readSettings,writeSettings,cameraShake} from '../src/engine/tactical/settings.js';
test('preferences are normalized without accepting unknown fields or invalid numeric values',()=>{
 const s=normalizeSettings({musicVolume:4,effectsVolume:-1,hudScale:99,quality:'ultra',leftHanded:'yes',extra:true});
 assert.equal(s.musicVolume,1);assert.equal(s.effectsVolume,0);assert.equal(s.hudScale,1);assert.equal(s.quality,'auto');assert.equal(s.leftHanded,false);assert.equal('extra' in s,false);
 assert.equal(normalizeSettings({musicVolume:NaN}).musicVolume,.2);
});
test('motion preference is the first-start default; explicit choices survive storage roundtrip',()=>{
 let value=null;const storage={getItem:()=>value,setItem:(_,text)=>{value=text}};
 assert.equal(readSettings(storage,true).reducedMotion,true);
 const settings=normalizeSettings({hudScale:1.25,leftHanded:true,musicVolume:.4,effectsVolume:.7,reducedMotion:false,shake:false,quality:'low'});
 assert.equal(writeSettings(storage,settings),true);assert.deepEqual(readSettings(storage,true),settings);
 value='broken';assert.equal(readSettings(storage,true).reducedMotion,true);
 assert.equal(writeSettings({setItem(){throw new Error('blocked')}},settings),false);
});
test('disabled motion and disabled shake suppress camera offsets, including at impact',()=>{
 assert.deepEqual(cameraShake({time:2,hitAt:undefined,shake:true,reducedMotion:false}),{x:0,y:0});
 assert.deepEqual(cameraShake({time:2.05,hitAt:2,shake:false,reducedMotion:false}),{x:0,y:0});
 assert.deepEqual(cameraShake({time:2.05,hitAt:2,shake:true,reducedMotion:true}),{x:0,y:0});
 const active=cameraShake({time:2.05,hitAt:2,shake:true,reducedMotion:false});assert.ok(Math.abs(active.x)+Math.abs(active.y)>0);
 assert.deepEqual(cameraShake({time:3,hitAt:2,shake:true,reducedMotion:false}),{x:0,y:0});
});
