import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,stepFor,fixtureMap} from './helpers/brandBattle.js';

test('ruch, skok i pauza wynikają z dynamicznego ciała',async()=>{
  const s=await testBattle();
  try{
    assert.equal(typeof s.dispatch,'function');
    stepFor(s,1);const start=s.snapshot().actors[0];
    assert.ok(start.grounded);
    s.dispatch({type:'move',direction:1});stepFor(s,.3);
    assert.ok(s.snapshot().actors[0].x>start.x);
    assert.equal(s.dispatch({type:'jump'}).accepted,true);stepFor(s,.1);
    assert.ok(s.snapshot().actors[0].y>start.y+.2);
    assert.equal(s.dispatch({type:'jump'}).accepted,false);
    s.dispatch({type:'move',direction:0});stepFor(s,2);
    assert.ok(s.snapshot().actors[0].grounded);
    assert.ok(s.player.body.isDynamic());
    s.setPaused(true);const saved=s.snapshot();s.advance(90);
    assert.deepEqual(s.snapshot(),saved);
    assert.equal(s.dispatch({type:'jump'}).accepted,false);
  }finally{s.dispose();}
});

test('sufit i cienka ściana blokują ciało bez przebicia',async()=>{
  const base=fixtureMap();
  const map=fixtureMap({shapes:[...base.shapes,
    {id:'wall',kind:'rect',x:4,y:2,width:.125,height:5,material:3},
    {id:'ceiling',kind:'rect',x:0,y:4,width:4,height:.25,material:3}]});
  const s=await testBattle({map});
  try{
    stepFor(s,1);s.dispatch({type:'jump'});
    let highest=0;for(let i=0;i<120;i++){s.advance(1/60);highest=Math.max(highest,s.snapshot().actors[0].y);}
    assert.ok(highest<3.6);
    s.dispatch({type:'move',direction:1});stepFor(s,2);
    assert.ok(s.snapshot().actors[0].x<3.8);
    assert.ok(Math.abs(s.player.body.translation().z)<1e-6);
  }finally{s.dispose();}
});

test('namysł trwa dowolnie długo, różne klatki nie zmieniają ruchu',async()=>{
  const a=await testBattle(),b=await testBattle();
  try{
    a.dispatch({type:'move',direction:1});b.dispatch({type:'move',direction:1});
    for(let i=0;i<60;i++)a.advance(1/60);
    for(let i=0;i<30;i++)b.advance(1/30);
    assert.ok(Math.abs(a.snapshot().actors[0].x-b.snapshot().actors[0].x)<1e-6);
    a.dispatch({type:'move',direction:0});stepFor(a,30);
    assert.equal(a.snapshot().phase,'player');assert.equal(a.snapshot().turn,1);
    const before=a.snapshot().time;a.advance(90);
    assert.ok(a.snapshot().time-before<=8/60+1e-8);
  }finally{a.dispose();b.dispose();}
});
