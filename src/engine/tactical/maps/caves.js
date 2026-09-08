import {defineMap,scaffold} from './defineMap.js';
export default defineMap({id:'caves',name:'Jaskinie',summary:'Komory, tunele pod ścianami i sklepienie idealne dla lassa.',width:64,height:26,theme:'cave',
 rows:[[0,0,64,2,3],[0,2,2,18,1],[62,2,2,18,1],[0,20,64,3,1],[20,5,2,15,1],[42,2,2,5,1],[42,10,2,10,1],[22,8,10,1,1],...scaffold(34,3.25,4),[10,11,4,.5,3],[29,15,3,.5,3],[50,12,5,.5,2]],
 spawns:[[6,2],[54,2,'rusher']],safeZones:[{x:3,y:2,width:5,height:.5},{x:52,y:2,width:7,height:.5}],landmarks:[{id:'crystal',x:12,y:2},{id:'crystal',x:48,y:2}]});
