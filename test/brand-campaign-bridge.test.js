import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrandStore} from '../src/engine/store/useGameStore.js';
import {createBattleSimulation} from '../src/engine/tactical/simulation.js';
import {decodeCheckpoint,encodeCheckpoint} from '../src/engine/tactical/checkpoint.js';
const memory=()=>{let latest=null,previous=null;return {read:async()=>({latest,previous}),write:async text=>{previous=latest;latest=text}}};
test('quick preserves expedition and its persistent checkpoint',async()=>{
 const storage=memory(),store=createBrandStore(1,{storage});
 store.getState().startExpedition(1);await store.getState().flush();
 const game=structuredClone(store.getState().game),saved=await storage.read();
 store.getState().startQuick('caves',2);
 assert.equal(store.getState().mode,'quick');assert.deepEqual(store.getState().game,game);assert.deepEqual(await storage.read(),saved);
});
test('runtime checkpoint resumes terrain and inventory; retry is persisted before control returns',async()=>{
 const storage=memory(),store=createBrandStore(2,{storage});store.getState().startExpedition(2);store.getState().enterEncounter();
 const sim=await createBattleSimulation(store.getState().request.options);
 try{
  store.getState().checkpoint(sim.snapshot());await store.getState().flush();
  const fresh=createBrandStore(9,{storage});assert.equal(await fresh.getState().resume(),true);
  assert.deepEqual(fresh.getState().request.restore,sim.snapshot());
  // Reducer bridge unit: a result fixture, not a browser victory shortcut.
  store.getState().finishEncounter({...sim.snapshot(),outcome:'lost',player:{health:0}});
  assert.equal(store.getState().game.scene,'retry');await store.getState().retryEncounter();
  assert.equal(store.getState().game.secondChanceUsed,true);
  const decoded=await decodeCheckpoint((await storage.read()).latest);
  assert.equal(decoded.value.game.secondChanceUsed,true);assert.equal(decoded.value.game.scene,'battle');
  store.getState().finishEncounter({...sim.snapshot(),outcome:'lost',player:{health:0}});
  assert.equal(store.getState().game.scene,'result');assert.equal(await store.getState().retryEncounter(),false);
 }finally{sim.dispose()}
});
test('failed save keeps playable memory state and reports error; previous valid copy can resume',async()=>{
 const storage=memory(),store=createBrandStore(4,{storage});store.getState().startExpedition(4);await store.getState().flush();
 await storage.write('broken');const restored=createBrandStore(8,{storage});assert.equal(await restored.getState().resume(),true);
 assert.match(restored.getState().saveError,/poprzedni/);
 storage.write=async()=>{throw new DOMException('full','QuotaExceededError')};
 restored.getState().startExpedition(10);await restored.getState().flush();
 assert.equal(restored.getState().game.seed,10);assert.match(restored.getState().saveError,/miejsca/);assert.equal(restored.getState().saving,false);
});

test('completed latest expedition does not advertise an older active save',async()=>{
 const storage=memory(),store=createBrandStore(4,{storage});store.getState().startExpedition(4);await store.getState().flush();
 const decoded=await decodeCheckpoint((await storage.read()).latest);
 decoded.value.game.status='lost';decoded.value.game.scene='result';decoded.value.game.health=0;
 await storage.write(await encodeCheckpoint(decoded.value));
 const fresh=createBrandStore(9,{storage});await fresh.getState().inspectSave();assert.equal(fresh.getState().savedAvailable,false);
});
