import test from 'node:test';
import assert from 'node:assert/strict';
import * as ai from '../src/engine/tactical/enemyAI.js';
import {createTerrain} from '../src/engine/tactical/terrain/mask.js';
import {fixtureMap,testBattle,stepFor} from './helpers/brandBattle.js';
test('szturmowiec ceni podejście i odrzuca samobójczy atak',()=>{
 assert.equal(typeof ai.scoreEnemyAction,'function');
 const score=(distanceAfter,selfDamage=0)=>ai.scoreEnemyAction({role:'rusher',damage:0,selfDamage,distanceAfter,opensPath:false});
 assert.ok(score(1)>score(10));assert.ok(score(1,100)<score(10));
});
test('usunięcie ściany odbudowuje drogi, nie zwraca starego grafu',()=>{
 assert.equal(typeof ai.buildWalkGraph,'function');const m=fixtureMap();m.shapes.push({id:'wall',kind:'rect',x:9,y:2,width:2,height:8,material:1});
 const terrain=createTerrain(m),a=ai.buildWalkGraph(terrain);assert.equal(ai.buildWalkGraph(terrain),a);
 const crossing=g=>g.edges.some(e=>g.nodes[e.from].x<9&&g.nodes[e.to].x>11);
 assert.equal(crossing(a),false);terrain.cutRect({x:9,y:2,width:2,height:8});
 const b=ai.buildWalkGraph(terrain);assert.notEqual(a,b);assert.equal(b.revision,1);assert.equal(crossing(b),true);
});
test('grenadier używa granatu, szturmowiec w zasięgu kopie, plan ma ograniczony koszt',async()=>{
 const s=await testBattle();try{stepFor(s,.5);const snapshot=s.snapshot();
  for(const [role,x,weaponId] of [['grenadier',16,'granajko'],['rusher',2.9,'kick'],['shooter',16,'jajooka']]){
   const p=ai.planEnemyAction({actor:{...snapshot.actors[1],role,x},snapshot,terrain:s.terrain,castSegment:s.castSegment});
   assert.equal(p.weaponId,weaponId);assert.ok(p.candidatesEvaluated<=200);
  }
 }finally{s.dispose()}
});
test('grenadier ma widoczny zapalnik, a kopnięcie AI odbiera HP po zapowiedzi',async()=>{
 for(const [role,x] of [['grenadier',12],['rusher',8.95]]){
  const map=fixtureMap();if(role==='rusher')map.spawns[0].x=8;
  const s=await testBattle({map,enemies:[{id:'enemy-1',role,x,y:2.7,health:45,maxHealth:45}]});
  try{stepFor(s,.5);s.dispatch({type:'pass'});stepFor(s,.3);assert.equal(s.player.health,100);let grenade=false;
   for(let i=0;i<900&&s.turn===1&&!s.outcome;i++){s.advance(1/60);grenade||=s.projectiles.some(p=>p.weaponId==='granajko'&&p.fuse>0)}
   if(role==='grenadier')assert.ok(grenade);else assert.equal(s.player.health,90);
   assert.equal(s.turn,2);
  }finally{s.dispose()}
 }
});
