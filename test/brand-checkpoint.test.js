import test from 'node:test';
import assert from 'node:assert/strict';
import * as checkpoint from '../src/engine/tactical/checkpoint.js';
import * as runtime from '../src/engine/tactical/simulation.js';
import * as expedition from '../src/game/expedition.js';
import {stepFor} from './helpers/brandBattle.js';
async function setup(){
 const g=expedition.createExpedition(1);g.inventory={owned:['jajooka','kick','mine','granajko'],ammo:{mine:1,granajko:2},tools:{pickaxe:2,drill:2}};g.upgrades=['shell','boots'];
 const {game,options}=expedition.startEncounter(g),sim=await runtime.createBattleSimulation(options);stepFor(sim,.5);
 return {game,sim,battleStart:sim.snapshot()};
}
const data=(game,sim,battleStart)=>({game:{...game,battleStart},battle:sim.snapshot(),battleStart});
test('checkpoint obejmuje krater i odrzuca naruszoną integralność',async()=>{
 const {game,sim,battleStart}=await setup();try{
  assert.equal(sim.dispatch({type:'tool',toolId:'drill',direction:1}).accepted,true);assert.ok(sim.terrain.revision>0);
  const value=data(game,sim,battleStart),text=await checkpoint.encodeCheckpoint(value),decoded=await checkpoint.decodeCheckpoint(text);
  assert.equal(decoded?.ok,true);assert.deepEqual(decoded.value,value);
  const bad=JSON.parse(text);bad.payload+=' ';assert.equal((await checkpoint.decodeCheckpoint(JSON.stringify(bad))).ok,false);
 }finally{sim.dispose()}
});
test('odtworzenie lotu zachowuje zapalnik, prędkość, fazę i PRNG',async()=>{
 assert.equal(typeof runtime.restoreBattleSimulation,'function');
 const {sim}=await setup();let restored;try{
  sim.dispatch({type:'select',weaponId:'granajko'});sim.dispatch({type:'aim',angleDeg:70,power:10});sim.dispatch({type:'attack'});stepFor(sim,.4);
  const saved=sim.snapshot();restored=await runtime.restoreBattleSimulation(saved);assert.deepEqual(restored.snapshot(),saved);
  for(let i=0;i<30;i++){sim.advance(1/60);restored.advance(1/60)}
  assert.equal(restored.phase,sim.phase);assert.equal(restored.projectiles.length,sim.projectiles.length);
  assert.ok(Math.abs(restored.projectiles[0].x-sim.projectiles[0].x)<.001);assert.ok(Math.abs(restored.projectiles[0].fuse-sim.projectiles[0].fuse)<1e-8);
 }finally{sim.dispose();restored?.dispose()}
});
test('odtworzenie zachowuje minę, linę, flagę osłony i zużyte zapasy',async()=>{
 assert.equal(typeof runtime.restoreBattleSimulation,'function');const {sim}=await setup();let restored;
 try{sim.dispatch({type:'select',weaponId:'mine'});sim.dispatch({type:'attack'});while(sim.turn===1&&!sim.outcome)sim.advance(1/60);
  assert.equal(sim.dispatch({type:'rope.attach',point:{x:8,y:7}}).accepted,true);sim.dispatch({type:'rope.reel',rate:-1});stepFor(sim,.4);sim.dispatch({type:'rope.reel',rate:0});
  const saved=sim.snapshot();restored=await runtime.restoreBattleSimulation(saved);
  assert.deepEqual(restored.snapshot(),saved);assert.equal(restored.inventory.ammo.mine,0);assert.equal(restored.mines.length,1);assert.ok(restored.rope.attached);
  stepFor(restored,.5);assert.ok(restored.actors.every(a=>Number.isFinite(a.body.translation().x)));
 }finally{sim.dispose();restored?.dispose()}
});
test('druga szansa odtwarza początek walki, flagi nie da się zużyć dwukrotnie',async()=>{
 assert.equal(typeof expedition.useSecondChance,'function');const {game,sim,battleStart}=await setup();try{
  const failed={...game,scene:'retry',health:0,battleStart};const next=expedition.useSecondChance(failed);
  assert.equal(next.scene,'battle');assert.equal(next.health,100);assert.equal(next.secondChanceUsed,true);assert.deepEqual(next.inventory,battleStart.inventory);
  assert.equal(expedition.useSecondChance(next),next);assert.equal(failed.secondChanceUsed,false);
  assert.equal(expedition.useSecondChance({...failed,secondChanceUsed:true}).scene,'retry');
 }finally{sim.dispose()}
});
test('poprawny hash nie przepuszcza błędnego schematu, mapy lub aktorów',async()=>{
 const {game,sim,battleStart}=await setup();try{const original=data(game,sim,battleStart);
  const mutations=[v=>v.battle.mapId='unknown',v=>v.battle.actors[1].id=v.battle.actors[0].id,v=>v.battle.terrain.cells.pop(),v=>v.battle.inventory.ammo.granajko=-1,v=>v.game.scene='arbitrary',v=>v.battle.actors[0].hitAt='bad',v=>v.battle.actors[0].alive=false];
  for(const mutate of mutations){const value=structuredClone(original);mutate(value);const payload=JSON.stringify(value),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
   const checksum=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   assert.equal((await checkpoint.decodeCheckpoint(JSON.stringify({version:2,payload,checksum})))?.ok,false);
  }
  assert.equal((await checkpoint.decodeCheckpoint('x'.repeat(8*1024**2+1)))?.ok,false);
 }finally{sim.dispose()}
});
