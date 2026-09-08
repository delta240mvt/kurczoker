import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,fixtureMap,stepFor} from './helpers/brandBattle.js';
import * as weapons from '../src/engine/tactical/weapons.js';

test('jedno wiercenie pozwala jeszcze strzelić, drugie nie zużywa zapasu',async()=>{
 const s=await testBattle();try{
  assert.equal(s.dispatch({type:'tool',toolId:'drill',direction:1}).accepted,true);
  assert.equal(s.snapshot().inventory.tools.drill,1);
  assert.equal(s.dispatch({type:'tool',toolId:'drill',direction:1}).accepted,false);
  assert.equal(s.snapshot().inventory.tools.drill,1);
  assert.equal(s.dispatch({type:'attack'}).accepted,true);
 }finally{s.dispose();}
});
test('podgląd jest bez kosztu, a fundament i pusty zapas odrzucają użycie',async()=>{
 const s=await testBattle();try{
  const before=s.snapshot();
  assert.equal(weapons.previewTool({toolId:'drill',direction:1},before,s.terrain).allowed,true);
  assert.deepEqual(s.snapshot(),before);
  s.inventory.tools.drill=0;
  assert.equal(s.dispatch({type:'tool',toolId:'drill',direction:1}).accepted,false);
  assert.equal(s.terrain.revision,0);
 }finally{s.dispose();}
 const base=fixtureMap(),hard=await testBattle({map:fixtureMap({shapes:base.shapes.map(p=>({...p,material:3}))})});
 try{assert.equal(hard.dispatch({type:'tool',toolId:'drill',direction:1}).accepted,false);
  assert.equal(hard.inventory.tools.drill,2);assert.equal(hard.terrain.revision,0);
 }finally{hard.dispose();}
});
test('kilof przebija ścianę i aktualizuje przejście postaci oraz podgląd pocisku',async()=>{
 const base=fixtureMap(),s=await testBattle({map:fixtureMap({shapes:[...base.shapes,
  {id:'wall',kind:'rect',x:3,y:2,width:1.5,height:4,material:1}]})});
 try{
  s.dispatch({type:'aim',angleDeg:0,power:10});const blocked=s.trajectory();
  assert.equal(s.dispatch({type:'tool',toolId:'pickaxe',direction:1}).accepted,true);
  assert.notDeepEqual(s.trajectory(),blocked);
  s.dispatch({type:'move',direction:1});stepFor(s,1);
  assert.ok(s.snapshot().actors[0].x>4.5);
 }finally{s.dispose();}
});
