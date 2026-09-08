import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,stepFor,fixtureMap} from './helpers/brandBattle.js';

test('pocisk leci po podglądzie i nie można wydać dwóch ataków',async()=>{
  const s=await testBattle();
  try{
    s.dispatch({type:'aim',angleDeg:45,power:10});const predicted=s.trajectory();
    assert.equal(s.dispatch({type:'attack'}).accepted,true);
    assert.equal(s.dispatch({type:'attack'}).accepted,false);
    stepFor(s,10/60);const p=s.snapshot().projectiles[0];
    assert.ok(Math.hypot(p.x-predicted[10].x,p.y-predicted[10].y)<.05);
  }finally{s.dispose();}
});

test('strzał w dół tworzy krater i może zranić strzelającego',async()=>{
  const s=await testBattle();
  try{s.dispatch({type:'aim',angleDeg:-90,power:8});
    const points=s.trajectory();assert.ok(points[1].y<points[0].y);
    s.dispatch({type:'attack'});stepFor(s,.5);
    assert.ok(s.snapshot().terrain.revision>0);
    assert.ok(s.snapshot().actors[0].health<100);
    assert.equal(s.drainEvents().filter(e=>e.type==='impact').length,1);
  }finally{s.dispose();}
});

test('pocisk trafia cienką ścianę zamiast przelecieć na drugą stronę',async()=>{
  const base=fixtureMap(),map=fixtureMap({shapes:[...base.shapes,
    {id:'wall',kind:'rect',x:4,y:2,width:.125,height:5,material:3}]});
  const s=await testBattle({map});
  try{s.dispatch({type:'aim',angleDeg:0,power:18});
    const points=s.trajectory();assert.ok(points.at(-1).x<4.01);
    s.dispatch({type:'attack'});stepFor(s,.3);
    assert.equal(s.snapshot().actors[1].health,45);
    const impact=s.drainEvents().find(e=>e.type==='impact');assert.ok(impact.x<4.01);
  }finally{s.dispose();}
});

test('podgląd w lewo jest zgodny ze strzałem i nie zmienia świata',async()=>{
  const s=await testBattle();
  try{s.dispatch({type:'aim',angleDeg:150,power:9});const before=s.snapshot();
    const points=s.trajectory();assert.ok(points[1].x<points[0].x);
    assert.deepEqual(s.snapshot(),before);
    s.dispatch({type:'attack'});stepFor(s,.1);
    assert.ok(s.snapshot().projectiles[0].x<points[0].x);
  }finally{s.dispose();}
});

// Two blasts in one simulation frame must read the edited material mask.
test('osłona chroni przed pierwszym wybuchem; następny widzi już wyciętą dziurę',async()=>{
  const {explode}=await import('../src/engine/tactical/weapons.js');
  const base=fixtureMap(),map=fixtureMap({shapes:[...base.shapes,
    {id:'cover',kind:'rect',x:4,y:2,width:.25,height:3,material:1}],
    spawns:[{id:'player',team:'player',role:'hero',x:2,y:2.7},{id:'enemy-1',team:'enemy',role:'shooter',x:4.8,y:2.7}]});
  const s=await testBattle({map});
  try{
    const blast={id:'first',point:{x:3.7,y:2.7},radius:1.8,maxDamage:30,ownerId:'player'};
    explode(blast,s);assert.equal(s.enemies[0].health,45);
    const revision=s.terrain.revision;explode(blast,s);
    assert.equal(s.terrain.revision,revision);
    assert.equal(s.drainEvents().filter(e=>e.type==='impact').length,1);
    explode({...blast,id:'second'},s);assert.ok(s.enemies[0].health<45);
  }finally{s.dispose();}
});
