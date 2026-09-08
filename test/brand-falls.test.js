import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,fixtureMap,stepFor} from './helpers/brandBattle.js';
import {createTerrain} from '../src/engine/tactical/terrain/mask.js';
const {findSafeReturn}=await import('../src/engine/tactical/character.js');

const gapMap=()=>fixtureMap({shapes:[
  {id:'safe',kind:'rect',x:0,y:0,width:4,height:2,material:3},
  {id:'far',kind:'rect',x:14,y:0,width:6,height:2,material:3},
],spawns:[{id:'player',team:'player',role:'hero',x:7,y:3},
  {id:'enemy-1',team:'enemy',role:'shooter',x:16,y:2.7}]});

test('upadek kosztuje zdrowie raz i przywraca poprawne miejsce',async()=>{
  const s=await testBattle({map:gapMap()});
  try{stepFor(s,5);const p=s.snapshot().actors[0];
    assert.equal(p.health,80);assert.ok(p.x>=1&&p.x<=3);
    assert.ok(p.grounded);assert.equal(s.drainEvents().filter(e=>e.type==='fall').length,1);
  }finally{s.dispose();}
});

test('ostatnie HP przy upadku kończy walkę porażką',async()=>{
  const s=await testBattle({map:gapMap(),player:{health:10,maxHealth:100,upgrades:[],inventory:{owned:['jajooka','kick'],ammo:{},tools:{pickaxe:0,drill:0}}}});
  try{stepFor(s,5);assert.equal(s.snapshot().outcome,'lost');assert.equal(s.snapshot().actors[0].health,0);}
  finally{s.dispose();}
});

test('upadek wroga stosuje ten sam koszt procentowy',async()=>{
  const map=gapMap();map.spawns[0].x=2;map.spawns[1].x=7;
  const s=await testBattle({map});
  try{stepFor(s,5);assert.equal(s.snapshot().actors[1].health,36);}
  finally{s.dispose();}
});

test('zniszczona półka i zajęty punkt nie są bezpiecznym powrotem',()=>{
  assert.equal(typeof findSafeReturn,'function');
  const t=createTerrain(fixtureMap());t.cutRect({x:4,y:.25,width:3,height:2});
  const p=findSafeReturn({terrain:t,lastSafe:{x:5,y:2.56},
    safeZones:[{x:1,y:2,width:2,height:1}],actors:[{x:1,y:2.56,alive:true}],actorSize:{radius:.3,halfHeight:.55}});
  assert.ok(p.x>1.6&&p.x<=3);
  assert.notEqual(p.x,5);
});
