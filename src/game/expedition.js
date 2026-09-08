import {rewardChoices} from './expeditionRewards.js';
import {getMap} from '../engine/tactical/arena.js';
import {nextRandom} from '../engine/tactical/config.js';

const route=(stage,mapId,role='shooter',hard=false)=>({id:`route-${stage}-${mapId}`,stage,mapId,role,hard,bonusGrain:hard?15:0,
 label:stage===3?'Twierdza Jajokróla':hard?'Dłuższą drogą':'Spokojniejszą drogą',description:getMap(mapId).summary});
export function createExpedition(seed=1){
 seed=Number.isSafeInteger(seed)?seed>>>0:1;
 const first=route(0,'yard');
 return {schemaVersion:2,runId:`expedition-${seed}`,seed,rngState:seed,scene:'map',stage:0,health:100,maxHealth:100,grain:0,
  inventory:{owned:['jajooka','kick'],ammo:{},tools:{pickaxe:0,drill:0}},upgrades:[],routes:[first],selectedRouteId:first.id,
  encounterId:null,battleStart:null,completedEncounterIds:[],rewardChoices:[],offers:[],secondChanceUsed:false,status:'active'};
}
export function chooseRoute(game,routeId){
 if(game.scene!=='map'||game.status!=='active'||!game.routes.some(r=>r.id===routeId))return game;
 return {...game,selectedRouteId:routeId};
}
export function startEncounter(game){
 const selected=game.routes.find(r=>r.id===game.selectedRouteId);
 if(game.scene!=='map'||game.status!=='active'||!selected)return {game,options:null};
 const map=getMap(selected.mapId),encounterId=`${game.runId}-${selected.stage}-${map.id}`;
 if(game.completedEncounterIds.includes(encounterId))return {game,options:null};
 const spawns=map.spawns.filter(s=>s.team==='enemy');
 const enemies=selected.stage===3?[{...spawns[0],role:'boss',health:140,maxHealth:140}]:
  spawns.map((spawn,i)=>({...spawn,role:i?spawn.role:selected.role,health:selected.hard?60:45,maxHealth:selected.hard?60:45}));
 const next={...game,scene:'battle',stage:selected.stage,encounterId,battleStart:null,rewardChoices:[],offers:[]};
 const options={map,mapId:map.id,encounterId,mode:'expedition',seed:game.rngState,enemies,
  player:{health:game.health,maxHealth:game.maxHealth,inventory:structuredClone(game.inventory),upgrades:[...game.upgrades]}};
 return {game:next,options};
}
export function finishEncounter(game,result){
 if(game.scene!=='battle'||game.status!=='active'||result?.encounterId!==game.encounterId||game.completedEncounterIds.includes(result.encounterId)||!['won','lost'].includes(result.outcome))return game;
 if(!Number.isFinite(result.health)||!result.inventory||!Array.isArray(result.upgrades))return game;
 const next={...game,health:Math.max(0,Math.min(game.maxHealth,result.health)),inventory:structuredClone(result.inventory),upgrades:[...result.upgrades],battleStart:result.battleStart??game.battleStart};
 if(result.outcome==='lost'||next.health<=0)return {...next,scene:game.secondChanceUsed?'result':'retry',status:game.secondChanceUsed?'lost':'active'};
 const selected=game.routes.find(r=>r.id===game.selectedRouteId);
 const finished={...next,scene:game.stage===3?'result':'reward',status:game.stage===3?'won':'active',
  grain:game.grain+30+(selected?.bonusGrain??0),completedEncounterIds:[...game.completedEncounterIds,game.encounterId]};
 if(finished.scene==='reward')finished.rewardChoices=rewardChoices(finished);
 return finished;
}
/** Called only after resolving the reward / leaving its shop. Stage changes on battle entry. */
export function prepareNextStage(game){
 if(!['reward','shop'].includes(game.scene)||game.stage>=3||game.status!=='active')return game;
 let routes,rngState=game.rngState;
 if(game.stage===0)routes=[route(1,'hills'),route(1,'caves','rusher',true)];
 else if(game.stage===1){
  const roll=nextRandom(rngState);rngState=roll.state;
  const mapId=['roofs','ravine','mill','quarry','islands'][Math.floor(roll.value*5)];
  routes=[route(2,mapId,mapId==='mill'||mapId==='roofs'?'grenadier':'shooter')];
 }else routes=[route(3,'fortress','boss')];
 return {...game,scene:'map',rngState,routes,selectedRouteId:routes[0].id,encounterId:null,battleStart:null,rewardChoices:[],offers:[]};
}
