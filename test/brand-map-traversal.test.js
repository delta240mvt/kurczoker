import test from 'node:test';
import assert from 'node:assert/strict';
import R from '@dimforge/rapier3d-compat';
import {getMap} from '../src/engine/tactical/arena.js';
import {createBattleSimulation} from '../src/engine/tactical/simulation.js';
import {syncTerrainColliders} from '../src/engine/tactical/terrain/collisions.js';
import {stepFor} from './helpers/brandBattle.js';
async function walkRoute(id,waypoints){
 const map=getMap(id),s=await createBattleSimulation({map,mode:'quick',encounterId:'walk-'+id,player:{health:100,maxHealth:100,upgrades:[],inventory:{owned:['jajooka'],ammo:{},tools:{pickaxe:2,drill:2}}}});
 try{stepFor(s,.5);for(const waypoint of waypoints){
  let arrived=false;
  for(let i=0;i<3600;i++){
   const p=s.player.body.translation();if(Math.abs(p.x-waypoint.x)<1.1&&Math.abs(p.y-waypoint.y)<.6&&s.player.grounded){arrived=true;break;}
   s.dispatch({type:'move',direction:Math.sign(waypoint.x-p.x)});
   if(waypoint.jump!==false&&s.player.grounded)s.dispatch({type:'jump'});s.advance(1/60);
  }
  assert.ok(arrived,JSON.stringify({id,waypoint,actor:s.player.snapshot()}));
  s.dispatch({type:'move',direction:0});stepFor(s,1);
 }
 assert.ok(s.player.health>0,id);
 }finally{s.dispose()}
}
test('sześć map ma fizyczne dojście do przeciwnika przez pełną topografię',async()=>{
 for(const id of ['yard','hills','roofs','ravine','caves','quarry']){
  const enemy=getMap(id).spawns.at(-1);await walkRoute(id,[{...enemy,x:enemy.x-1.5}]);
 }
});
test('młyn ma dostęp przez przejście pod wieżą i prawe rusztowanie',async()=>{
 await walkRoute('mill',[{x:29,y:2.7,jump:false},{x:38.5,y:8.95}]);
});
test('twierdza pozwala podejść do wroga pod rusztowaniem bez skoku',async()=>{
 await walkRoute('fortress',[{x:40,y:5.7,jump:false}]);
});
test('wąwóz po utracie całego mostu: rzeczywiste lasso przenosi na drugi brzeg',async()=>{
 const s=await createBattleSimulation({map:getMap('ravine'),mode:'quick',encounterId:'crossing',player:{health:100,maxHealth:100,upgrades:[],inventory:{owned:['jajooka'],ammo:{},tools:{pickaxe:2,drill:2}}}});
 try{stepFor(s,.5);const chunkIds=s.terrain.cutRect({x:18,y:8,width:20,height:.5});
  syncTerrainColliders({R,world:s.world,terrain:s.terrain,registry:s.terrainRegistry,chunkIds});
  for(const point of [{x:22,y:13},{x:32,y:13},{x:42,y:13}]){
   assert.equal(s.dispatch({type:'rope.attach',point:s.terrainTarget(point)??point}).accepted,true,JSON.stringify(point));
   s.dispatch({type:'rope.reel',rate:-1});s.dispatch({type:'move',direction:1});stepFor(s,3);
  }
  s.dispatch({type:'rope.release'});s.dispatch({type:'move',direction:0});stepFor(s,1);
  assert.ok(s.player.body.translation().x>38);assert.ok(s.player.health>0);assert.equal(s.player.grounded,true);
 }finally{s.dispose()}
});
test('wyspy po utracie mostów: lasso łączy wszystkie trzy brzegi',async()=>{
 const s=await createBattleSimulation({map:getMap('islands'),mode:'quick',encounterId:'island-crossing',player:{health:100,maxHealth:100,upgrades:[],inventory:{owned:['jajooka'],ammo:{},tools:{pickaxe:2,drill:2}}}});
 try{stepFor(s,.5);const dirty=new Set();for(const area of [{x:18,y:0,width:10,height:10},{x:44,y:0,width:12,height:10}])for(const id of s.terrain.cutRect(area))dirty.add(id);
  syncTerrainColliders({R,world:s.world,terrain:s.terrain,registry:s.terrainRegistry,chunkIds:[...dirty]});
  for(const point of [{x:21,y:12},{x:26,y:15},{x:32,y:15},{x:41,y:15},{x:47,y:14},{x:53,y:11},{x:60,y:13}]){
   assert.equal(s.dispatch({type:'rope.attach',point:s.terrainTarget(point)??point}).accepted,true,JSON.stringify({point,actor:s.player.snapshot()}));
   s.dispatch({type:'rope.reel',rate:-1});s.dispatch({type:'move',direction:1});stepFor(s,4);
  }
  s.dispatch({type:'rope.release'});s.dispatch({type:'move',direction:0});stepFor(s,1.5);
  assert.ok(s.player.body.translation().x>56);assert.ok(s.player.health>0);assert.equal(s.player.grounded,true);
 }finally{s.dispose()}
});
