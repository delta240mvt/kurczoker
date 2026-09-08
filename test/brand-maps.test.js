import test from 'node:test';
import assert from 'node:assert/strict';
import * as arena from '../src/engine/tactical/arena.js';
import * as geometry from '../src/engine/tactical/terrain/geometry.js';
import {createTerrain} from '../src/engine/tactical/terrain/mask.js';
import {findSafeReturn} from '../src/engine/tactical/character.js';
import {createBattleSimulation} from '../src/engine/tactical/simulation.js';
import {stepFor,fixtureMap} from './helpers/brandBattle.js';

test('dziewięć różnych map ma wolne spawny i drogi między przeciwnikami',()=>{
 const maps=arena.listMaps();assert.equal(maps.length,9);
 assert.deepEqual(maps.map(m=>m.id),['yard','hills','roofs','ravine','mill','caves','quarry','islands','fortress']);
 assert.equal(new Set(maps.map(m=>JSON.stringify(m.shapes))).size,9);
 for(const m of maps){assert.deepEqual(arena.validateMap(m),{ok:true,errors:[]},m.id);
  const travel=arena.inspectTraversal(m);assert.deepEqual(travel.clearanceFailures,[],m.id);
  assert.ok(travel.reachableSpawnPairs.length>=m.spawns.length-1,m.id);
 }
 assert.throws(()=>arena.getMap('unknown'));
});
test('walidacja odrzuca spawn w ścianie, poza mapą i powtórzone ID',()=>{
 assert.equal(typeof arena.validateMap,'function');
 const map=structuredClone(arena.getMap('yard'));
 map.spawns[0].y=.2;map.spawns[1].x=100;map.spawns[1].id='player';
 const v=arena.validateMap(map);assert.equal(v.ok,false);assert.ok(v.errors.length>=3);
});
test('po usunięciu miękkiego terenu pozostaje bezpieczny powrót',()=>{
 for(const map of arena.listMaps()){
  const terrain=createTerrain(map);terrain.cutRect({x:0,y:0,width:map.width,height:map.height});
  assert.ok(findSafeReturn({terrain,safeZones:map.safeZones}),map.id);
 }
});
test('trawa występuje tylko nad odsłoniętą ziemią, nie wewnątrz wzgórza',()=>{
 assert.equal(typeof geometry.buildGrassCaps,'function');
 const map=fixtureMap();map.shapes.push({id:'hill',kind:'rect',x:10,y:2,width:10,height:2,material:1});
 const caps=geometry.buildGrassCaps(createTerrain(map).snapshot());
 assert.ok(caps.some(c=>c.y===2&&c.x<10));
 assert.ok(caps.some(c=>c.y===4&&c.x>10));
 assert.ok(!caps.some(c=>c.y===2&&c.x+c.width/2>10));
});
test('każda mapa fizycznie utrzymuje aktorów i przyjmuje ruch, skok oraz atak',async()=>{
 for(const map of arena.listMaps()){
  const sim=await createBattleSimulation({map,encounterId:map.id,mode:'quick',seed:1,player:{health:100,maxHealth:100,upgrades:[],inventory:{owned:['jajooka'],ammo:{},tools:{pickaxe:2,drill:2}}}});
  try{stepFor(sim,.6);assert.equal(sim.player.grounded,true,map.id);const x=sim.player.body.translation().x;
   sim.dispatch({type:'move',direction:1});stepFor(sim,.25);assert.ok(sim.player.body.translation().x>x+.1,map.id);
   assert.equal(sim.dispatch({type:'jump'}).accepted,true,map.id);stepFor(sim,.2);assert.ok(sim.player.body.linvel().y>0,map.id);
   sim.dispatch({type:'move',direction:0});stepFor(sim,1);sim.dispatch({type:'aim',angleDeg:60,power:12});
   assert.equal(sim.dispatch({type:'attack'}).accepted,true,map.id);stepFor(sim,12);
   assert.ok(sim.turn>=2||sim.outcome,map.id);assert.ok(sim.actors.every(a=>Number.isFinite(a.body.translation().y)),map.id);
  }finally{sim.dispose();}
 }
});
