import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition,startEncounter,finishEncounter} from '../src/game/expedition.js';
import {rewardChoices,applyReward,shopOffers,buyOffer,leaveShop} from '../src/game/expeditionRewards.js';
import {testBattle,stepFor} from './helpers/brandBattle.js';
import {explode} from '../src/engine/tactical/weapons.js';
const won=(stage=0)=>{const {game}=startEncounter(createExpedition(1));return finishEncounter({...game,stage},{encounterId:game.encounterId,outcome:'won',health:70,inventory:game.inventory,upgrades:[]})};
test('pierwszy łup daje trzy granaty i wybrane narzędzie dokładnie raz',()=>{
 let g=won();g={...g,rewardChoices:rewardChoices(g)};const id=g.rewardChoices.find(r=>r.toolId==='drill').id;
 const next=applyReward(g,id);assert.equal(next.inventory.ammo.granajko,3);assert.ok(next.inventory.owned.includes('granajko'));assert.equal(next.inventory.tools.drill,1);assert.equal(next.scene,'map');
 assert.equal(applyReward(next,id),next);assert.equal(g.inventory.owned.length,2);
});
test('leczenie w sklepie jest atomowe, ograniczone do maxHP i bez podwójnego zakupu',()=>{
 let g={...createExpedition(1),scene:'shop',grain:30,health:90};g={...g,offers:shopOffers(g)};
 const offer=g.offers.find(o=>o.kind==='heal'),next=buyOffer(g,offer.id);
 assert.equal(next.health,100);assert.equal(next.grain,10);assert.equal(buyOffer(next,offer.id),next);assert.equal(g.grain,30);
 const tool=g.offers.find(o=>o.kind==='tool');assert.equal(buyOffer({...g,grain:19},tool.id).grain,19);
 assert.equal(buyOffer(g,'foreign'),g);
});
test('nowa broń ma amunicję, nagrody nie powtarzają ulepszeń i sklep da się pominąć',()=>{
 let g=won(1);g={...g,upgrades:['shell'],rewardChoices:[]};g.rewardChoices=rewardChoices(g);
 assert.equal(g.rewardChoices.length,3);assert.ok(!g.rewardChoices.some(r=>r.upgradeId==='shell'));
 const weapon=g.rewardChoices.find(r=>r.kind==='weapon');const next=applyReward(g,weapon.id);
 assert.equal(next.scene,'shop');assert.ok(next.inventory.ammo[weapon.weaponId]>0);assert.equal(leaveShop(next).scene,'map');
});
test('pancerz osłabia tylko pierwsze faktyczne trafienie i raportuje realną stratę HP',async()=>{
 const s=await testBattle({player:{health:100,maxHealth:100,upgrades:['shell'],inventory:{owned:['jajooka'],ammo:{},tools:{pickaxe:0,drill:0}}}});
 try{stepFor(s,.5);const p=s.player.body.translation();
  explode({id:100,point:p,radius:.5,maxDamage:0,ownerId:'enemy-1'},s);assert.equal(s.player.guardAvailable,true);
  explode({id:101,point:p,radius:.5,maxDamage:30,ownerId:'enemy-1'},s);assert.equal(s.player.health,85);assert.equal(s.player.guardAvailable,false);
  assert.equal(s.drainEvents().find(e=>e.id===101).payload.hits[0].damage,15);
  explode({id:102,point:p,radius:.5,maxDamage:30,ownerId:'enemy-1'},s);assert.equal(s.player.health,55);
 }finally{s.dispose()}
});
test('buty zmniejszają koszt wypadnięcia do10% bez używania pancerza',async()=>{
 const s=await testBattle({player:{health:100,maxHealth:100,upgrades:['boots','shell'],inventory:{owned:['jajooka'],ammo:{},tools:{pickaxe:0,drill:0}}}});
 try{stepFor(s,.5);s.player.body.setTranslation({x:2,y:-3,z:0},true);stepFor(s,.1);assert.equal(s.player.health,90);assert.equal(s.player.guardAvailable,true);}finally{s.dispose()}
});
test('każde ulepszenie jest osiągalne, pas daje oba narzędzia, zakup broni daje zapas',()=>{
 const offered=new Set();let belt;
 for(let i=1;i<=32;i++){let g={...won(1),rngState:(i*0x9e3779b9)>>>0};g.rewardChoices=rewardChoices(g);
  const upgrade=g.rewardChoices.find(r=>r.kind==='upgrade');offered.add(upgrade.upgradeId);if(upgrade.upgradeId==='toolbelt')belt={g,id:upgrade.id};}
 assert.deepEqual([...offered].sort(),['boots','shell','toolbelt']);const next=applyReward(belt.g,belt.id);
 assert.equal(next.inventory.tools.pickaxe,1);assert.equal(next.inventory.tools.drill,1);assert.equal(next.upgrades.filter(u=>u==='toolbelt').length,1);
 const shop={...next,grain:40},offer=shop.offers.find(o=>o.kind==='weapon'),bought=buyOffer(shop,offer.id);
 assert.equal(bought.grain,0);assert.ok(bought.inventory.ammo[offer.weaponId]>0);assert.equal(buyOffer(bought,offer.id),bought);
});
