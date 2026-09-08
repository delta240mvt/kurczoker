import {defineMap,scaffold} from './defineMap.js';
export default defineMap({id:'ravine',name:'Wąwóz',summary:'Kruchy most nad przepaścią. Niżej czekają skalne półki i trwałe zaczepy.',width:56,theme:'canyon',
 rows:[[0,0,18,8,1],[38,0,18,8,1],[0,0,18,.5,3],[38,0,18,.5,3],[18,3,5,1,3],[28,2,5,1,3],[18,8,20,.5,2],[21,13,2,.5,3],[31,13,2,.5,3],[41,13,2,.5,3],...scaffold(17,5,3,-1),...scaffold(32,4.25,4)],
 spawns:[[7,8],[46,8]],safeZones:[{x:3,y:.5,width:5,height:8},{x:46,y:.5,width:5,height:8}],landmarks:[{id:'rock',x:25,y:0}]});
