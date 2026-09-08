import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuickBattle} from '../src/game/quickBattle.js';
test('potyczka ma sześć broni, jedną kasetową i niezależne zapasy',()=>{
 const a=createQuickBattle('yard',1),b=createQuickBattle('yard',1);
 assert.equal(a.player.inventory.owned.length,6);assert.equal(a.player.inventory.ammo.cluster,1);
 a.player.inventory.tools.drill=0;assert.equal(b.player.inventory.tools.drill,2);
 assert.equal(a.encounterId,b.encounterId);assert.equal(a.mode,'quick');
 assert.equal(createQuickBattle('caves',1).map.id,'caves');assert.notEqual(createQuickBattle('caves',1).encounterId,a.encounterId);
 assert.throws(()=>createQuickBattle('unknown',1));
});
