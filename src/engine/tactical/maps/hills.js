import {defineMap,stairs} from './defineMap.js';
export default defineMap({id:'hills',name:'Dwa wzgórza',summary:'Dwie wysokie grzędy, otwarta dolina i schody wycięte w zboczach.',width:64,
 rows:[[0,0,64,2.5,1],[0,0,64,.5,3],[0,2.5,10,8.75,1],...stairs(22,2.5,7,-1),...stairs(40,2.5,7),[54,2.5,10,8.75,1],[25,9,5,.5,2],[34,12,5,.5,3]],
 spawns:[[6,11.25],[58,11.25]],safeZones:[{x:2,y:.5,width:6,height:11},{x:28,y:.5,width:8,height:2}],landmarks:[{id:'tree',x:5,y:11.25},{id:'tree',x:60,y:11.25}]});
