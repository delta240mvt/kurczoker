import test from 'node:test';
import assert from 'node:assert/strict';
import * as input from '../src/engine/tactical/input.js';

test('puszczenie skoku zostawia ruch; zwolnienie przycisku nigdy nie strzela',()=>{
 const events=[],r=input.createInputRouter(e=>events.push(e));
 r.press('p1','right');r.press('p2','jump');r.release('p2');
 assert.equal(events.at(-1).direction,1);assert.equal(events.some(e=>e.type==='attack'),false);
 assert.equal(events.filter(e=>e.type==='jump').length,1);
 r.clear();assert.deepEqual(events.at(-1),{type:'move',direction:0});
});
test('klawiatura i dotyk współpracują, menu czyści ruch oraz zwijanie',()=>{
 const events=[],r=input.createInputRouter(e=>events.push(e));
 r.press('p1','right');r.press('KeyA','left');assert.equal(events.at(-1).direction,0);
 r.release('KeyA');assert.equal(events.at(-1).direction,1);
 r.press('KeyW','reel-in');r.setMode('menu');
 assert.deepEqual(events.slice(-2),[{type:'rope.reel',rate:0},{type:'move',direction:0}]);
 r.press('p3','jump');assert.equal(events.some(e=>e.type==='jump'),false);
 r.setMode('move');assert.equal(events.at(-1).direction,0);
});
test('listener ignoruje edycję i repeat, znika po cleanup, obrót czyści stan',()=>{
 const events=[],r=input.createInputRouter(e=>events.push(e));
 const listeners=new Map(),target={addEventListener(k,f){listeners.set(k,f)},removeEventListener(k,f){if(listeners.get(k)===f)listeners.delete(k)}};
 const document={...target};let ropes=0;
 const clean=input.bindInput({router:r,target,document,onRope:()=>ropes++,onPause:()=>{}});
 const event=(code,extra={})=>({code,preventDefault(){},target:{tagName:'DIV'},...extra});
 listeners.get('keydown')(event('Space'));listeners.get('keydown')(event('Space',{repeat:true}));
 listeners.get('keydown')(event('KeyR'));listeners.get('keydown')(event('KeyR',{repeat:true}));
 listeners.get('keydown')(event('KeyD',{target:{tagName:'INPUT'}}));
 assert.equal(events.filter(e=>e.type==='jump').length,1);assert.equal(ropes,1);
 listeners.get('orientationchange')();assert.equal(events.at(-1).direction,0);
 clean();assert.equal(listeners.size,0);
});
