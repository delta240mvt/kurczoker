import test from 'node:test';
import assert from 'node:assert/strict';
import * as cameras from '../src/engine/tactical/camera.js';
const input={viewport:{width:390,height:844},bounds:{width:72,height:26},actor:{x:30,y:5,vx:0,vy:0},projectile:null,rope:null,mode:'move',overviewCenter:null,dt:1/60,previous:null};
test('pion zachowuje czytelną wielkość bohatera na szerokiej mapie',()=>{
 const c=cameras.cameraTarget(input);assert.ok(c.visibleHeight<=12);assert.ok(c.zoom*1.1>=48);assert.ok(Math.abs(c.x-30)<1);
});
test('kamera śledzi pocisk i obejmuje całą mapę dopiero w przeglądzie',()=>{
 const shot=cameras.cameraTarget({...input,projectile:{x:50,y:15}});assert.ok(shot.x>45);
 const overview=cameras.cameraTarget({...input,mode:'overview'});
 assert.ok(overview.visibleHeight*input.viewport.width/input.viewport.height>=72);
 const edge=cameras.cameraTarget({...input,actor:{...input.actor,x:0}});assert.ok(edge.x>=0);
});
test('poziom i obrót zachowują pozycję oraz czytelność; smoothing zależy od czasu',()=>{
 const landscape=cameras.cameraTarget({...input,viewport:{width:844,height:390}});assert.ok(landscape.zoom*1.1>=48);
 const first=cameras.cameraTarget(input),target={...input,actor:{...input.actor,x:40}};
 let one=first,two=first;
 for(let i=0;i<30;i++)one=cameras.cameraTarget({...target,previous:one,dt:1/30});
 for(let i=0;i<60;i++)two=cameras.cameraTarget({...target,previous:two,dt:1/60});
 assert.ok(Math.abs(one.x-two.x)<.0001);
});

test('kurczak w kraterze pozostaje nad dolnym panelem w poziomie',()=>{
 const viewport={width:844,height:390},actor={x:12,y:1.05,vx:0,vy:0};
 const c=cameras.cameraTarget({...input,viewport,actor,mode:'aim'});
 const feet=viewport.height/2+(c.y-(actor.y-.55))*c.zoom;
 assert.ok(feet<viewport.height-144,`feet at ${feet}`);
});
