import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition,chooseRoute,startEncounter,finishEncounter,prepareNextStage} from '../src/game/expedition.js';
const win=(game)=>finishEncounter(game,{encounterId:game.encounterId,outcome:'won',health:75,inventory:game.inventory,upgrades:game.upgrades,battleStart:null});
test('nowa wyprawa ma podstawowy arsenał i ignoruje obcy lub powtórzony wynik',()=>{
 const initial=createExpedition(7);assert.deepEqual(initial.inventory.owned,['jajooka','kick']);assert.equal(initial.stage,0);
 const {game,options}=startEncounter(initial);assert.equal(options.map.id,'yard');assert.equal(initial.scene,'map');
 assert.equal(finishEncounter(game,{encounterId:'foreign',outcome:'won',health:100}),game);
 const won=win(game);assert.equal(won.grain,30);assert.equal(won.scene,'reward');assert.equal(won.stage,0);
 assert.equal(win(won),won);assert.equal(won.health,75);assert.equal(startEncounter(won).options,null);
});
test('cztery walki, legalne trasy, przenoszenie HP i boss w finale',()=>{
 let g=createExpedition(8);const ids=[];
 for(let i=0;i<4;i++){
  const start=startEncounter(g);assert.ok(start.options);g=start.game;ids.push(g.encounterId);assert.equal(g.stage,i);
  if(i){assert.equal(start.options.player.health,75);assert.equal(start.options.player.inventory.tools.drill,1)}
  if(i===3){assert.equal(start.options.enemies.length,1);assert.equal(start.options.enemies[0].role,'boss');assert.equal(start.options.enemies[0].health,140)}
  g=win(g);if(i<3){g=prepareNextStage({...g,inventory:{...g.inventory,tools:{...g.inventory.tools,drill:1}}});assert.equal(chooseRoute(g,'foreign'),g);g=chooseRoute(g,g.routes[0].id);}
 }
 assert.equal(new Set(ids).size,4);assert.equal(g.scene,'result');assert.equal(g.status,'won');assert.equal(g.completedEncounterIds.length,4);
});
test('porażka daje jedną ofertę drugiej szansy i nie wypłaca łupu',()=>{
 const {game}=startEncounter(createExpedition(1));const result={encounterId:game.encounterId,outcome:'lost',health:0,inventory:game.inventory,upgrades:[]};
 const first=finishEncounter(game,result);assert.equal(first.scene,'retry');assert.equal(first.grain,0);assert.equal(first.completedEncounterIds.length,0);
 const last=finishEncounter({...game,secondChanceUsed:true},result);assert.equal(last.scene,'result');assert.equal(last.status,'lost');
});
test('trudniejsza droga ma jawny dodatkowy łup i deterministyczny wybór map',()=>{
 const g=prepareNextStage(win(startEncounter(createExpedition(123)).game));
 const hard=g.routes.find(r=>r.bonusGrain===15);assert.ok(hard);
 const selected=chooseRoute(g,hard.id),battle=startEncounter(selected);assert.equal(win(battle.game).grain,75);
 assert.deepEqual(prepareNextStage(win(startEncounter(createExpedition(123)).game)),g);
});
