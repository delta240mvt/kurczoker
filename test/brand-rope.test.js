import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,fixtureMap,stepFor} from './helpers/brandBattle.js';

function beamMap(){const base=fixtureMap();return fixtureMap({shapes:[...base.shapes,
  {id:'beam',kind:'rect',x:1,y:7,width:7,height:1,material:2}]});}

test('lasso unosi kurczaka i puszcza z zachowaniem pędu',async()=>{
  const s=await testBattle({map:beamMap()});
  try{
    assert.equal(s.dispatch({type:'rope.attach',point:{x:4,y:7}}).accepted,true);
    const initial=s.snapshot().rope.length;
    s.dispatch({type:'rope.reel',rate:-1});stepFor(s,.7);
    s.dispatch({type:'rope.reel',rate:0});
    s.dispatch({type:'move',direction:1});stepFor(s,.4);
    const before=s.snapshot().actors[0];
    assert.ok(s.snapshot().rope.length<initial-2);
    assert.ok(before.y>3,'zwijanie faktycznie unosi ciało');
    assert.ok(Math.abs(before.vx)>.1,'huśtanie daje pęd');
    assert.equal(s.dispatch({type:'rope.release'}).accepted,true);
    assert.equal(s.snapshot().rope,null);
    assert.equal(s.snapshot().actors[0].vx,before.vx);
    assert.equal(s.snapshot().actors[0].vy,before.vy);
  }finally{s.dispose();}
});

test('puste, przesłonięte i odległe zaczepy są odrzucane',async()=>{
  const map=beamMap();map.shapes.push({id:'wall',kind:'rect',x:3,y:2,width:.5,height:4,material:3});
  const s=await testBattle({map});
  try{
    assert.equal(s.dispatch({type:'rope.attach',point:{x:4,y:7}}).accepted,false);
    assert.equal(s.dispatch({type:'rope.attach',point:{x:2,y:5}}).accepted,false);
    assert.equal(s.dispatch({type:'rope.attach',point:{x:50,y:7}}).accepted,false);
    assert.equal(s.dispatch({type:'rope.attach',point:{x:NaN,y:7}}).accepted,false);
    assert.equal(s.snapshot().rope,null);
  }finally{s.dispose();}
});

test('długość ma granice a napięta lina nie teleportuje przez podłoże',async()=>{
  const s=await testBattle({map:beamMap()});
  try{
    s.dispatch({type:'rope.attach',point:{x:4,y:7}});
    s.dispatch({type:'rope.reel',rate:-1});stepFor(s,4);
    assert.equal(s.snapshot().rope.length,1.2);
    const p=s.snapshot().actors[0];
    assert.ok(p.y<7-.5 && p.y>2);
    assert.ok(Math.hypot(p.x-4,p.y-7)<1.4);
  }finally{s.dispose();}
});
