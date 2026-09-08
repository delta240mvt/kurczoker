import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,stepFor,fixtureMap} from './helpers/brandBattle.js';

test('namysł nie kończy tury, pass daje widoczny atak wroga i nową turę',async()=>{
 const s=await testBattle();try{
  stepFor(s,30);assert.equal(s.snapshot().turn,1);assert.equal(s.snapshot().phase,'player');
  assert.equal(s.dispatch({type:'pass'}).accepted,true);let visible=false;
  for(let i=0;i<900&&s.turn===1;i++){s.advance(1/60);visible ||= s.projectiles.some(p=>p.ownerId==='enemy-1');}
  assert.ok(visible);assert.equal(s.turn,2);
 }finally{s.dispose();}
});
test('kolejka pomija zmarłego wroga, każdy żywy atakuje raz, pauza zatrzymuje telegraph',async()=>{
 const base=fixtureMap(),s=await testBattle({map:fixtureMap({spawns:[...base.spawns,
  {id:'enemy-2',team:'enemy',role:'shooter',x:12,y:2.7},
  {id:'enemy-3',team:'enemy',role:'shooter',x:9,y:2.7}]})});
 try{
  s.dispatch({type:'tool',toolId:'drill',direction:1});s.dispatch({type:'pass'});
  s.enemies[1].health=0;s.enemies[1].body.setEnabled(false);
  s.setPaused(true);const before=s.snapshot();stepFor(s,5);assert.deepEqual(s.snapshot(),before);s.setPaused(false);
  for(let i=0;i<1800&&s.turn===1&&!s.outcome;i++)s.advance(1/60);
  const shots=s.drainEvents().filter(e=>e.type==='shoot').map(e=>e.payload.ownerId);
  assert.deepEqual(shots,['enemy-1','enemy-3']);assert.equal(s.turn,2);assert.equal(s.toolUsed,false);
 }finally{s.dispose();}
});
test('jednoczesna śmierć daje jeden wynik lost i nigdy nową turę',async()=>{
 const s=await testBattle();try{
  s.player.health=0;s.enemies.forEach(a=>a.health=0);stepFor(s,1);stepFor(s,1);
  assert.equal(s.outcome,'lost');assert.equal(s.phase,'finished');assert.equal(s.turn,1);
  assert.equal(s.drainEvents().filter(e=>['lost','won'].includes(e.type)).length,1);
  assert.equal(s.dispatch({type:'pass'}).accepted,false);
 }finally{s.dispose();}
});

test('odpowiedź wroga kończy się również gdy kurczak wisi na linie',async()=>{
 const base=fixtureMap(),s=await testBattle({map:fixtureMap({shapes:[...base.shapes,
  {id:'beam',kind:'rect',x:1,y:7,width:7,height:.5,material:3}]})});
 try{
  assert.equal(s.dispatch({type:'rope.attach',point:{x:4,y:7}}).accepted,true);
  s.dispatch({type:'rope.reel',rate:-1});stepFor(s,.4);s.dispatch({type:'rope.reel',rate:0});
  s.dispatch({type:'pass'});
  for(let i=0;i<900&&s.turn===1&&!s.outcome;i++)s.advance(1/60);
  assert.equal(s.turn,2);assert.equal(s.phase,'player');
 }finally{s.dispose();}
});
