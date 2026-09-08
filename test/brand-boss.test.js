import test from 'node:test';
import assert from 'node:assert/strict';
import * as boss from '../src/engine/tactical/boss.js';
import R from '@dimforge/rapier3d-compat';
import {testBattle,stepFor} from './helpers/brandBattle.js';
import {syncTerrainColliders} from '../src/engine/tactical/terrain/collisions.js';
const bossBattle=health=>testBattle({enemies:[{id:'boss',role:'boss',x:12,y:2.7,health,maxHealth:140}],player:{health:500,maxHealth:500,upgrades:[],inventory:{owned:['jajooka'],ammo:{},tools:{pickaxe:2,drill:2}}}});
test('druga faza ma trzy granaty, blokada nie tworzy teleportu',()=>{
 const high=boss.bossIntent({health:140,maxHealth:140,actionIndex:0,canCharge:true}),low=boss.bossIntent({health:60,maxHealth:140,actionIndex:0,canCharge:true});
 assert.equal(high.type,'salvo');assert.equal(high.shots,2);assert.equal(low.shots,3);
 assert.equal(boss.bossIntent({health:140,maxHealth:140,actionIndex:1,canCharge:false}).type,'salvo');
 assert.equal(boss.bossIntent({health:140,maxHealth:140,actionIndex:1,canCharge:true}).type,'charge');
});
test('szarża trafia gracza najwyżej raz i ma skończony dystans',async()=>{
 const s=await bossBattle(140);try{stepFor(s,.5);s.dispatch({type:'pass'});while(s.turn===1&&!s.outcome)s.advance(1/60);
  assert.equal(s.boss.intent.type,'charge');
  for(let i=0;i<600&&s.player.body.translation().x<7;i++){s.dispatch({type:'move',direction:1});if(s.player.grounded)s.dispatch({type:'jump'});s.advance(1/60)}
  s.dispatch({type:'move',direction:0});stepFor(s,1);s.drainEvents();const x=s.enemies[0].body.translation().x;s.dispatch({type:'pass'});
  for(let i=0;i<900&&s.turn===2&&!s.outcome;i++)s.advance(1/60);
  const events=s.drainEvents();const hits=events.filter(e=>e.payload?.kind==='charge');assert.equal(hits.length,1);assert.equal(hits[0].damage,20);
  assert.ok(Math.abs(s.enemies[0].body.translation().x-x)<=8.1);assert.equal(s.turn,3);
 }finally{s.dispose()}
});
test('zapowiedź jest widoczna przed ruchem, salwa ma zapowiedzianą liczbę pocisków',async()=>{
 for(const [health,count] of [[140,2],[60,3]]){
  const s=await bossBattle(health);try{stepFor(s,.5);const intent=structuredClone(s.snapshot().boss.intent);assert.equal(intent.type,'salvo');
   s.dispatch({type:'move',direction:1});stepFor(s,.4);s.dispatch({type:'move',direction:0});assert.deepEqual(s.snapshot().boss.intent,intent);
   s.dispatch({type:'pass'});stepFor(s,.3);assert.equal(s.projectiles.length,0);let maximum=0;
   for(let i=0;i<900&&s.turn===1&&!s.outcome;i++){s.advance(1/60);maximum=Math.max(maximum,s.projectiles.filter(p=>p.ownerId==='boss').length)}
   assert.equal(maximum,count);assert.equal(s.turn,2);assert.equal(s.snapshot().boss.actionIndex,1);
  }finally{s.dispose()}
 }
});
test('utrata podłoża po zapowiedzi zatrzymuje szarżę bez ukrytej salwy',async()=>{
 const s=await bossBattle(140);try{stepFor(s,.5);s.dispatch({type:'pass'});while(s.turn===1&&!s.outcome)s.advance(1/60);
  assert.equal(s.snapshot().boss.intent.type,'charge');
  const ids=s.terrain.cutRect({x:7,y:.25,width:2,height:2});syncTerrainColliders({R,world:s.world,terrain:s.terrain,registry:s.terrainRegistry,chunkIds:ids});
  s.drainEvents();const before=s.enemies[0].body.translation().x;s.dispatch({type:'pass'});
  for(let i=0;i<900&&s.turn===2&&!s.outcome;i++)s.advance(1/60);
  const after=s.enemies[0].body.translation().x;assert.ok(before-after<=8.1);assert.ok(after>=9-.35);assert.equal(s.turn,3);
  assert.equal(s.drainEvents().filter(e=>e.type==='shoot').length,0);
 }finally{s.dispose()}
});
