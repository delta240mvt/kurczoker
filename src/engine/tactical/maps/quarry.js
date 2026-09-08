import {defineMap,stairs} from './defineMap.js';
export default defineMap({id:'quarry',name:'Kamieniołom',summary:'Schodkowe tarasy, wysokie ściany ziemi i głębokie stanowiska strzeleckie.',width:64,height:30,theme:'canyon',
 rows:[[0,0,64,3.5,1],[0,0,64,.5,3],[0,3.5,8,5,1],...stairs(14,3.5,4,-1),...stairs(18,3.5,7),[32,3.5,6,8.75,1],...stairs(50,3.5,7,-1),...stairs(50,3.5,7),[18,15,3,.5,3],[40,17,3,.5,3]],
 spawns:[[4,8.5],[35,12.25]],safeZones:[{x:2,y:.5,width:4,height:8},{x:30,y:.5,width:6,height:12}],landmarks:[{id:'rock',x:16,y:3.5}]});
