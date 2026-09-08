import {defineMap,scaffold} from './defineMap.js';
export default defineMap({id:'fortress',name:'Twierdza Jajokróla',summary:'Dziedziniec z bramami, dwie wieże i kruche drewniane blanki.',width:64,height:32,theme:'fortress',
 rows:[[0,0,64,2,3],[4,2,8,18,1],[50,2,10,20,1],[16,2,32,3,1],[16,8,3,5,1],[45,8,3,5,1],[12,13,7,.5,2],[45,13,8,.5,2],...scaffold(12,6.25,4),...scaffold(21,11.25,5,-1),...scaffold(33,6.5,8),[13,23,3,.5,3],[43,25,3,.5,3],[30,15,4,.5,2]],
 spawns:[[24,5],[40,5,'grenadier']],safeZones:[{x:23,y:2,width:5,height:3},{x:35,y:2,width:6,height:3}],landmarks:[{id:'banner',x:8,y:20},{id:'banner',x:55,y:22}]});
