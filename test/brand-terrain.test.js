import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureMap} from './helpers/brandBattle.js';
import {createTerrain} from '../src/engine/tactical/terrain/mask.js';
import {nextRandom} from '../src/engine/tactical/config.js';

test('krater usuwa ziemię, chroni fundament i jest idempotentny', () => {
  assert.equal(typeof createTerrain, 'function');
  const t = createTerrain(fixtureMap());
  assert.ok(t.cutCircle({x:2,y:1,radius:1.2}).length > 0);
  assert.equal(t.materialAt(2,1),0);
  assert.equal(t.materialAt(2,.125),3);
  assert.equal(t.snapshot().revision,1);
  assert.deepEqual(t.cutCircle({x:2,y:1,radius:1.2}),[]);
  assert.equal(t.snapshot().revision,1);
});

test('tunel przekracza granicę fragmentów i pozostawia podłogę i sufit', () => {
  const t = createTerrain(fixtureMap());
  const changed = t.cutRect({x:3,y:.5,width:3,height:1});
  assert.deepEqual(changed,[0,1]);
  for (const x of [3.1,3.95,4.05,5.9]) {
    assert.equal(t.materialAt(x,1),0);
    assert.equal(t.materialAt(x,1.8),1);
    assert.equal(t.materialAt(x,.1),3);
  }
});

test('wycinanie poza mapą nie zmienia maski; snapshot jest niezależny', () => {
  const t=createTerrain(fixtureMap());
  const before=t.snapshot();
  assert.deepEqual(t.cutCircle({x:-10,y:-10,radius:1}),[]);
  assert.equal(t.materialAt(-.01,1),0);
  assert.equal(t.materialAt(20,1),0);
  t.cutRect({x:-1,y:.5,width:3,height:1});
  assert.equal(before.revision,0);
  assert.equal(before.cells[8*before.columns+8],1);
  assert.equal(t.materialAt(1,1),0);
  const mutable=t.snapshot(); mutable.cells.fill(3);
  assert.equal(t.materialAt(1,1),0);
});

test('niepoprawne lub puste wycięcie nie zatruwa stanu', () => {
  const t=createTerrain(fixtureMap());
  for (const radius of [0,-1,NaN,Infinity]) {
    assert.deepEqual(t.cutCircle({x:2,y:1,radius}),[]);
  }
  assert.deepEqual(t.cutRect({x:0,y:0,width:NaN,height:3}),[]);
  assert.equal(t.snapshot().revision,0);
});

test('generator daje powtarzalny ciąg i jawny kolejny stan', () => {
  assert.equal(typeof nextRandom,'function');
  const a=nextRandom(42),b=nextRandom(42);
  assert.deepEqual(a,b);
  assert.notEqual(nextRandom(a.state).state,a.state);
  assert.ok(a.value>=0 && a.value<1);
});
