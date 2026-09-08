import {getMap} from '../engine/tactical/arena.js';
import {WEAPONS} from '../engine/tactical/config.js';
export function createQuickBattle(mapId,seed=1){
 const map=getMap(mapId);
 return {map,mapId,seed,mode:'quick',encounterId:`quick-${mapId}-${seed}`,
  player:{health:100,maxHealth:100,upgrades:[],inventory:{owned:Object.keys(WEAPONS),ammo:{granajko:3,shotgun:3,mine:2,cluster:1},tools:{pickaxe:2,drill:2}}}};
}
