import {WEAPONS,nextRandom} from '../engine/tactical/config.js';
import {prepareNextStage} from './expedition.js';
const upgradeNames={shell:'Mocna skorupa',boots:'Miękkie lądowanie',toolbelt:'Pas narzędziowy'};
const upgradeDescriptions={shell:'Pierwsze trafienie w każdej walce zadaje połowę obrażeń.',boots:'Wypadnięcie z mapy kosztuje 10% zamiast 20% maksymalnego HP.',toolbelt:'Dostajesz jedno użycie kilofa i jedno wiertła.'};
const ammoAmount={granajko:3,shotgun:3,mine:2,cluster:1};
const toolReward=toolId=>({id:'tool-'+toolId,kind:'tool',toolId,amount:1,label:toolId==='drill'?'Wiertło':'Kilof',description:'Jedno dodatkowe użycie podczas wyprawy.'});
const heal={id:'heal',kind:'heal',amount:30,label:'Ziarno na zdrowie',description:'Odzyskaj 30 HP, do maksymalnego zdrowia.'};
const weaponReward=id=>({id:'weapon-'+id,kind:'weapon',weaponId:id,amount:ammoAmount[id],label:WEAPONS[id].name,description:`Nowa broń i ${ammoAmount[id]} szt. amunicji.`});
export function rewardChoices(game){
 if(game.stage===0)return [toolReward('pickaxe'),toolReward('drill')];
 const missing=['shotgun','mine','cluster'].filter(id=>!game.inventory.owned.includes(id));
 const weapon=missing[Math.floor(nextRandom(game.rngState).value*missing.length)];
 const upgrades=['shell','boots','toolbelt'].filter(id=>!game.upgrades.includes(id));
 const upgrade=upgrades[Math.floor(nextRandom(game.rngState^0x85ebca6b).value*upgrades.length)];
 return [weapon?weaponReward(weapon):{id:'ammo-granajko',kind:'ammo',weaponId:'granajko',amount:3,label:'Trzy granaty',description:'Uzupełnij zapas Granajka.'},
  upgrade?{id:'upgrade-'+upgrade,kind:'upgrade',upgradeId:upgrade,label:upgradeNames[upgrade],description:upgradeDescriptions[upgrade]}:toolReward('drill'),
  game.health<game.maxHealth?{...heal}:toolReward('pickaxe')];
}
function grant(game,item){
 const next={...game,inventory:structuredClone(game.inventory),upgrades:[...game.upgrades]};
 if(item.kind==='heal')next.health=Math.min(game.maxHealth,game.health+item.amount);
 if(item.kind==='tool')next.inventory.tools[item.toolId]=(next.inventory.tools[item.toolId]??0)+item.amount;
 if(item.kind==='weapon'||item.kind==='ammo'){
  if(!next.inventory.owned.includes(item.weaponId))next.inventory.owned.push(item.weaponId);
  next.inventory.ammo[item.weaponId]=(next.inventory.ammo[item.weaponId]??0)+item.amount;
 }
 if(item.kind==='upgrade'&&!next.upgrades.includes(item.upgradeId)){
  next.upgrades.push(item.upgradeId);
  if(item.upgradeId==='toolbelt'){next.inventory.tools.pickaxe++;next.inventory.tools.drill++;}
 }
 return next;
}
export function applyReward(game,rewardId){
 const reward=game.rewardChoices.find(r=>r.id===rewardId);
 if(game.scene!=='reward'||!reward)return game;
 let next=grant(game,reward);
 if(game.stage===0)next=grant(next,weaponReward('granajko'));
 next.rewardChoices=[];
 if(game.stage===0)return prepareNextStage(next);
 next.scene='shop';next.offers=shopOffers(next);return next;
}
export function shopOffers(game){
 const ammo=game.inventory.owned.includes('granajko')?'granajko':game.inventory.owned.find(id=>ammoAmount[id]);
 const weapon=['shotgun','mine','cluster'].find(id=>!game.inventory.owned.includes(id));
 return [{...heal,price:20,purchased:false},
  ...(ammo?[{id:'ammo-'+ammo,kind:'ammo',weaponId:ammo,amount:2,label:WEAPONS[ammo].name+' ×2',description:'Dwie dodatkowe sztuki amunicji.',price:20,purchased:false}]:[]),
  {...toolReward('drill'),price:20,purchased:false},
  ...(weapon?[{...weaponReward(weapon),price:40,purchased:false}]:[])];
}
export function buyOffer(game,offerId){
 const offer=game.offers.find(o=>o.id===offerId);
 if(game.scene!=='shop'||!offer||offer.purchased||!Number.isFinite(offer.price)||offer.price<0||game.grain<offer.price)return game;
 const next=grant(game,offer);next.grain-=offer.price;next.offers=game.offers.map(o=>o.id===offerId?{...o,purchased:true}:o);return next;
}
export function leaveShop(game){return game.scene==='shop'?prepareNextStage(game):game;}
