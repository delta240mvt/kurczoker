import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,fixtureMap,stepFor} from './helpers/brandBattle.js';
const inventory=()=>({owned:['jajooka','kick','granajko','shotgun','mine','cluster'],ammo:{granajko:1,shotgun:1,mine:1,cluster:1},tools:{pickaxe:0,drill:0}});
const armed=options=>testBattle({player:{health:100,maxHealth:100,inventory:inventory()},...options});
for(const weaponId of ['granajko','shotgun','mine','cluster'])test(weaponId+' wydaje jeden ładunek i jedną akcję',async()=>{
 const s=await armed();try{stepFor(s,.3);
  assert.equal(s.dispatch({type:'select',weaponId}).accepted,true);
  assert.equal(s.dispatch({type:'attack'}).accepted,true);
  assert.equal(s.snapshot().inventory.ammo[weaponId],0);
  assert.equal(s.dispatch({type:'attack'}).accepted,false);
 }finally{s.dispose();}
});
test('Granajko odbija się; pauza zatrzymuje zapalnik; wybuch jest jeden',async()=>{
 const s=await armed();try{stepFor(s,.3);s.dispatch({type:'select',weaponId:'granajko'});s.dispatch({type:'aim',angleDeg:-90,power:8});s.dispatch({type:'attack'});
  stepFor(s,.25);assert.ok(s.snapshot().projectiles[0].bounces>0);
  s.setPaused(true);const before=s.snapshot();stepFor(s,4);assert.deepEqual(s.snapshot(),before);s.setPaused(false);
  stepFor(s,2.5);assert.equal(s.drainEvents().filter(e=>e.type==='impact'&&e.payload.ownerId==='player').length,1);
 }finally{s.dispose();}
});
test('śrut nie przechodzi przez fundament, pusty kopniak zostawia turę',async()=>{
 const b=fixtureMap(),map=fixtureMap({shapes:[...b.shapes,{id:'cover',kind:'rect',x:3,y:2,width:.5,height:4,material:3}],spawns:[b.spawns[0],{...b.spawns[1],x:4.2}]});
 const s=await armed({map});try{stepFor(s,.3);s.dispatch({type:'select',weaponId:'shotgun'});s.dispatch({type:'aim',angleDeg:0,power:9});s.dispatch({type:'attack'});assert.equal(s.enemies[0].health,45);
 }finally{s.dispose();}
 const k=await armed();try{k.dispatch({type:'select',weaponId:'kick'});assert.equal(k.dispatch({type:'attack'}).accepted,false);assert.equal(k.phase,'player');}finally{k.dispose();}
});
test('kopniak odpycha bliskiego wroga bez krateru i bez ranienia siebie',async()=>{
 const b=fixtureMap(),s=await armed({map:fixtureMap({spawns:[b.spawns[0],{...b.spawns[1],x:3}]})});
 try{stepFor(s,.3);s.dispatch({type:'select',weaponId:'kick'});assert.equal(s.dispatch({type:'attack'}).accepted,true);
  assert.equal(s.enemies[0].health,35);assert.ok(s.enemies[0].body.linvel().x>0);assert.equal(s.player.health,100);assert.equal(s.terrain.revision,0);
 }finally{s.dispose();}
});
test('własna mina uzbraja się i może zranić właściciela tylko raz',async()=>{
 const b=fixtureMap(),s=await armed({map:fixtureMap({shapes:[...b.shapes,{id:'cover',kind:'rect',x:8,y:2,width:1,height:8,material:3}]})});
 try{stepFor(s,.3);s.dispatch({type:'select',weaponId:'mine'});assert.equal(s.dispatch({type:'attack'}).accepted,true);
  stepFor(s,.4);assert.equal(s.player.health,100);
  for(let n=0;n<900&&s.turn===1;n++)s.advance(1/60);
  assert.equal(s.player.health,100,'odłożona mina nie rani automatycznie');
  s.dispatch({type:'move',direction:1});stepFor(s,.4);assert.ok(s.player.health<100);
  assert.equal(s.snapshot().mines.length,0);assert.equal(s.drainEvents().filter(e=>e.type==='impact'&&e.payload.ownerId==='player').length,1);
 }finally{s.dispose();}
});
test('Cluster daje pięć odłamków i identyczny rozrzut dla tego samego seeda',async()=>{
 const samples=[];
 for(let n=0;n<2;n++){
  const s=await armed({seed:123});try{s.dispatch({type:'select',weaponId:'cluster'});s.dispatch({type:'aim',angleDeg:70,power:10});s.dispatch({type:'attack'});
   for(let i=0;i<240&&s.projectiles.length<2;i++)s.advance(1/60);
   assert.equal(s.projectiles.length,5);samples.push(s.projectiles.map(p=>({vx:p.vx,vy:p.vy})));
  }finally{s.dispose();}
 }
 assert.deepEqual(samples[0],samples[1]);
});

test('podgląd Granajka używa tego samego odbicia co rzeczywisty lot',async()=>{
 const s=await armed();try{stepFor(s,.3);s.dispatch({type:'select',weaponId:'granajko'});s.dispatch({type:'aim',angleDeg:-60,power:8});const predicted=s.trajectory();
  s.dispatch({type:'attack'});stepFor(s,.5);const shot=s.projectiles[0];
  assert.ok(Math.hypot(shot.x-predicted[30].x,shot.y-predicted[30].y)<.06);
 }finally{s.dispose();}
});
test('śrut z bliska zadaje maksymalnie40 HP i nie rani strzelca',async()=>{
 const b=fixtureMap(),s=await armed({map:fixtureMap({spawns:[b.spawns[0],{...b.spawns[1],x:3.2}]})});
 try{stepFor(s,.3);s.dispatch({type:'select',weaponId:'shotgun'});s.dispatch({type:'aim',angleDeg:0,power:9});s.dispatch({type:'attack'});
  assert.equal(s.enemies[0].health,5);assert.equal(s.player.health,100);
 }finally{s.dispose();}
});
test('mina spada po usunięciu podparcia i zatrzymuje się na fundamencie',async()=>{
 const {tickMines}=await import('../src/engine/tactical/projectiles.js');
 const {createTerrain}=await import('../src/engine/tactical/terrain/mask.js');
 const terrain=createTerrain(fixtureMap());terrain.cutRect({x:2,y:.25,width:2,height:1.75});
 let mines=[{id:1,x:3,y:2.17,age:1,vy:0}];
 for(let n=0;n<90;n++)mines=tickMines(mines,[],1/60,terrain).mines;
 assert.equal(mines.length,1);assert.ok(Math.abs(mines[0].y-.42)<.05);
});

test('ruch w lewo obraca również broń kontaktową i kierunek odkładania miny',async()=>{
 const s=await armed();try{stepFor(s,.3);s.dispatch({type:'move',direction:-1});s.dispatch({type:'move',direction:0});
  assert.equal(s.snapshot().facing,-1);
  s.dispatch({type:'select',weaponId:'mine'});s.dispatch({type:'attack'});
  assert.ok(s.mines[0].x<s.player.body.translation().x);
 }finally{s.dispose();}
});
