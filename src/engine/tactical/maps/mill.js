import {defineMap,scaffold,stairs} from './defineMap.js';
export default defineMap({id:'mill',name:'Stary młyn',summary:'Pionowa wspinaczka po rusztowaniach, pod skrzydłami starego młyna.',width:48,height:36,theme:'mill',
 rows:[[0,0,48,2,3],[22,4.5,6,21.5,1],...scaffold(8,3.5,6),...scaffold(20,11,6,-1),...scaffold(8,18.25,6),[20,25.75,10,.25,2],...scaffold(30,24.5,6),[38,8,6,.25,2],...stairs(30,2,4,1,2),[32,13,3,.5,3],[18,29,4,.5,3],[8,13,2,.5,3]],
 spawns:[[4,2],[40,8.25,'grenadier']],safeZones:[{x:2,y:2,width:5,height:.5},{x:42,y:2,width:4,height:.5}],landmarks:[{id:'windmill',x:25,y:26}]});
