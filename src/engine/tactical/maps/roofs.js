import {defineMap,scaffold} from './defineMap.js';
export default defineMap({id:'roofs',name:'Dachy kurników',summary:'Drewniane dachy, zaułki i rusztowania łączące trzy budynki.',width:60,theme:'village',
 rows:[[0,0,60,2,3],[5,2,10,6,1],[22,2,10,10,1],[40,2,12,7,1],[4,8,12,.5,2],[21,12,12,.5,2],[39,9,14,.5,2],...scaffold(1,3.25,4),...scaffold(15,8.75,4),...scaffold(33,10.75,3),...scaffold(58,3.25,6,-1),[17,17,4,.5,3],[34,17,4,.5,3]],
 spawns:[[7,8.5],[28,12.5,'grenadier']],safeZones:[{x:1,y:2,width:2,height:.5},{x:54,y:2,width:3,height:.5}],landmarks:[{id:'barn',x:10,y:8.5}]});
