import {createStore} from 'zustand/vanilla';
import {createExpedition,chooseRoute,startEncounter,finishEncounter,useSecondChance} from '../../game/expedition.js';
import {applyReward,buyOffer,leaveShop} from '../../game/expeditionRewards.js';
import {createQuickBattle} from '../../game/quickBattle.js';
import {encodeCheckpoint,decodeCheckpoint} from '../tactical/checkpoint.js';
import {createSaveStorage} from '../tactical/saveStorage.js';

export function createBrandStore(seed=1,{storage}={}){
 let queue=Promise.resolve(),pending=0,serial=0,storagePromise;
 const disk=()=>storage?Promise.resolve(storage):(storagePromise??=createSaveStorage(globalThis.indexedDB).catch(e=>{storagePromise=null;throw e}));
 return createStore((set,get)=>{
  function persist(){
   const {game,battle}=get();if(!game)return queue;
   const value=structuredClone({game,battle,battleStart:game.battleStart});pending++;set({saving:true});
   queue=queue.then(async()=>{try{await (await disk()).write(await encodeCheckpoint(value));set({saveError:''})}
    catch(e){set({saveError:e.name==='QuotaExceededError'?'Brak miejsca na zapis. Grasz dalej w pamięci tej karty.':'Nie udało się zapisać. Grasz dalej w pamięci tej karty.'})}
    finally{pending--;set({saving:pending>0})}});return queue;
  }
  function change(reducer,...args){const before=get().game;if(!before)return;const game=reducer(before,...args);if(game===before)return;set({game,battle:game.scene==='battle'?get().battle:null});persist()}
  return {
   mode:'menu',game:null,quick:null,battle:null,request:null,saving:false,saveError:'',savedAvailable:false,loadingSave:false,
   flush:()=>queue,
   startExpedition(nextSeed=seed){const game=createExpedition(nextSeed);set({mode:'expedition',game,battle:null,request:null});persist()},
   selectRoute(id){change(chooseRoute,id)},
   enterEncounter(){const before=get().game;if(!before)return;const result=startEncounter(before);if(!result.options)return;
    set({game:result.game,battle:null,request:{serial:++serial,options:result.options,restore:null}})},
   checkpoint(snapshot){const {game,mode}=get();if(mode!=='expedition'||game?.scene!=='battle'||snapshot.encounterId!==game.encounterId)return;
    const battle=structuredClone(snapshot);set({battle,game:game.battleStart?game:{...game,battleStart:structuredClone(battle)}});persist()},
   finishEncounter(snapshot){const {game,mode}=get();if(mode!=='expedition'||!game)return;
    const next=finishEncounter(game,{encounterId:snapshot.encounterId,outcome:snapshot.outcome,health:snapshot.player.health,inventory:snapshot.inventory,upgrades:snapshot.upgrades});
    if(next!==game){set({game:next,battle:null,request:null});persist()}},
   chooseReward(id){change(applyReward,id)},buy(id){change(buyOffer,id)},leaveShop(){change(leaveShop)},
   async retryEncounter(){const before=get().game;if(!before)return false;const game=useSecondChance(before);if(game===before)return false;
    const battle=structuredClone(game.battleStart);set({game,battle,request:null});await persist();
    if(get().game===game)set({request:{serial:++serial,options:null,restore:battle}});return true},
   startQuick(mapId,quickSeed=seed){const options=createQuickBattle(mapId,quickSeed);set({mode:'quick',quick:options,request:{serial:++serial,options,restore:null}})},
   menu(){set({mode:'menu',request:null})},
   async inspectSave(){set({loadingSave:true});try{const copies=await (await disk()).read();let valid=false;
     for(const text of [copies.latest,copies.previous])if(text&&(await decodeCheckpoint(text)).ok){valid=true;break}set({savedAvailable:valid});
    }catch{set({saveError:'Zapis jest niedostępny. Możesz rozpocząć grę w tej karcie.'})}finally{set({loadingSave:false})}},
   async resume(){await queue;set({loadingSave:true});try{
     const copies=await (await disk()).read();for(const [index,text] of [copies.latest,copies.previous].entries()){
      if(!text)continue;const decoded=await decodeCheckpoint(text);if(!decoded.ok)continue;
      const {game,battle}=decoded.value;set({mode:'expedition',game,battle,savedAvailable:true,saveError:index?'Odtworzono poprzedni poprawny zapis.':'',
       request:game.scene==='battle'?{serial:++serial,options:null,restore:battle}:null});return true;
     }set({saveError:'Nie znaleźliśmy poprawnego zapisu. Możesz zacząć nową wyprawę.'});return false;
    }catch{set({saveError:'Nie udało się odczytać zapisu. Spróbuj ponownie.'});return false}finally{set({loadingSave:false})}},
  };
 });
}
