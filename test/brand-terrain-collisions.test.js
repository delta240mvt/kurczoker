import test from 'node:test';
import assert from 'node:assert/strict';
import R from '@dimforge/rapier3d-compat';
import {createTerrain} from '../src/engine/tactical/terrain/mask.js';
import {fixtureMap} from './helpers/brandBattle.js';
import {syncTerrainColliders} from '../src/engine/tactical/terrain/collisions.js';
import {buildTerrainBoxes} from '../src/engine/tactical/terrain/geometry.js';
await R.init();

test('tunel usuwa faktyczną kolizję, a nie tylko widoczną ziemię',()=>{
  assert.equal(typeof syncTerrainColliders,'function');
  const world=new R.World({x:0,y:-10,z:0});
  try {
    const terrain=createTerrain(fixtureMap()),registry=new Map();
    const sync=chunkIds=>syncTerrainColliders({R,world,terrain,registry,chunkIds});
    sync();world.step();
    const ray=new R.Ray({x:0,y:1,z:0},{x:1,y:0,z:0});
    assert.ok(world.castRay(ray,20,true));
    sync(terrain.cutRect({x:0,y:.5,width:20,height:1}));world.step();
    assert.equal(world.castRay(ray,20,true),null);
    assert.ok(world.castRay(new R.Ray({x:0,y:.1,z:0},{x:1,y:0,z:0}),20,true));
  }finally{world.free();}
});

test('boxy pokrywają maskę bez dziur, nakładania i zmiany materiału',()=>{
  const terrain=createTerrain(fixtureMap());
  terrain.cutCircle({x:4,y:1,radius:.75});
  const snap=terrain.snapshot(),boxes=buildTerrainBoxes(snap);
  assert.ok(boxes.length<100,'scalanie ogranicza liczbę colliderów');
  for(let row=0;row<snap.rows;row++) for(let col=0;col<snap.columns;col++) {
    const x=(col+.5)*snap.cellSize,y=(row+.5)*snap.cellSize;
    const hits=boxes.filter(b=>x>=b.x-b.width/2 && x<b.x+b.width/2 && y>=b.y-b.height/2 && y<b.y+b.height/2);
    const material=snap.cells[row*snap.columns+col];
    assert.equal(hits.length,material?1:0,`cell ${col},${row}`);
    if(material) assert.equal(hits[0].material,material);
  }
});

test('przebudowa fragmentu nie usuwa colliderów pozostałych fragmentów',()=>{
  const world=new R.World({x:0,y:-10,z:0});
  try{
    const terrain=createTerrain(fixtureMap()),registry=new Map();
    syncTerrainColliders({R,world,terrain,registry});
    const before=[...registry.entries()].filter(([id])=>id.startsWith('4:'));
    assert.ok(before.length);
    const chunkIds=terrain.cutCircle({x:1,y:1,radius:.5});
    syncTerrainColliders({R,world,terrain,registry,chunkIds});
    for(const [id,collider] of before) assert.equal(registry.get(id),collider);
  }finally{world.free();}
});
