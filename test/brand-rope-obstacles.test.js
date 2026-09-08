import test from 'node:test';
import assert from 'node:assert/strict';
import {createTerrain} from '../src/engine/tactical/terrain/mask.js';
import {fixtureMap,testBattle,stepFor} from './helpers/brandBattle.js';
const {traceRopePath}=await import('../src/engine/tactical/rope.js');

test('lina omija narożniki i prostuje się po usunięciu ściany',()=>{
  assert.equal(typeof traceRopePath,'function');
  const t=createTerrain(fixtureMap({shapes:[{id:'wall',kind:'rect',x:8,y:2,width:2,height:4,material:1}]}));
  const input={anchor:{x:3,y:4},player:{x:15,y:4},pivots:[],terrain:t};
  const pivots=traceRopePath(input);
  assert.ok(pivots.length>=2&&pivots.length<=12);
  const points=[input.anchor,...pivots,input.player];
  for(let n=1;n<points.length;n++) for(let i=1;i<100;i++) {
    const f=i/100,a=points[n-1],b=points[n];
    assert.equal(t.materialAt(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f),0);
  }
  assert.deepEqual(traceRopePath({...input,pivots}),pivots,'stabilna strona owijania');
  t.cutRect({x:8,y:2,width:2,height:4});
  assert.deepEqual(traceRopePath({...input,pivots}),[]);
});

test('zniszczenie punktu kotwiczenia puszcza kurczaka',async()=>{
  const base=fixtureMap(),map=fixtureMap({shapes:[...base.shapes,
    {id:'beam',kind:'rect',x:1,y:7,width:7,height:1,material:2}]});
  const s=await testBattle({map});
  try{
    s.dispatch({type:'rope.attach',point:{x:4,y:7}});
    assert.ok(s.snapshot().rope);
    s.terrain.cutRect({x:3,y:6.5,width:2,height:2});
    stepFor(s,1/60);assert.equal(s.snapshot().rope,null);
    assert.ok(s.drainEvents().some(e=>e.type==='rope-release'&&e.payload.reason==='anchor-destroyed'));
  }finally{s.dispose();}
});

test('prowadzenie uwzględnia przeszkodę na granicy fragmentu',()=>{
  const t=createTerrain(fixtureMap({shapes:[{id:'wall',kind:'rect',x:3.75,y:3,width:.5,height:3,material:1}]}));
  const result=traceRopePath({anchor:{x:2,y:4},player:{x:6,y:4},pivots:[],terrain:t});
  assert.ok(result.length>=2);assert.ok(result.every(p=>!t.materialAt(p.x,p.y)));
});
