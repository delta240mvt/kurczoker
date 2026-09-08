import {defineMap,stairs} from './defineMap.js';
export default defineMap({id:'islands',name:'Trzy wyspy',summary:'Trzy osobne skrawki ziemi, dwa mosty i lasso nad wodą.',width:72,height:28,theme:'water',
 rows:[[0,0,18,5,1],[28,0,16,9,1],[56,0,16,6,1],[0,0,18,.5,3],[28,0,16,.5,3],[56,0,16,.5,3],[18,5,10,.5,2],[44,6,12,.5,2],...stairs(22,5.5,3,1,2),...stairs(48,6.5,2,-1,2),[20,12,3,.5,3],[25,15,2,.5,3],[31,15,2,.5,3],[40,15,2,.5,3],[46,14,3,.5,3],[52,11,2,.5,3],[59,13,2,.5,3],[19,1,4,.5,3],[48,2,4,.5,3]],
 spawns:[[6,5],[37,9],[65,6,'grenadier']],safeZones:[{x:2,y:.5,width:6,height:5},{x:60,y:.5,width:8,height:6}],landmarks:[{id:'tree',x:10,y:5}]});
