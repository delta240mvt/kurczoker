export default {
 id:'yard',name:'Podwórze',summary:'Miękka ziemia, drewniane belki i pierwsze wielkie skoki.',version:1,
 width:48,height:20,cellSize:.125,chunkCells:32,
 shapes:[
  {id:'soil',kind:'rect',x:0,y:0,width:48,height:2.5,material:1},
  {id:'foundation',kind:'rect',x:0,y:0,width:48,height:.5,material:3},
  {id:'step',kind:'rect',x:10,y:2.5,width:2,height:.75,material:1},
  {id:'hill',kind:'rect',x:12,y:2.5,width:6,height:1.5,material:1},
  {id:'mound',kind:'rect',x:30,y:2.5,width:5,height:3,material:1},
  {id:'beam',kind:'rect',x:5,y:7,width:6,height:.5,material:2},
  {id:'beam-2',kind:'rect',x:19,y:9,width:5,height:.5,material:2},
  {id:'tunnel-wall',kind:'rect',x:25,y:2.5,width:2,height:4,material:1},
 ],
 spawns:[{id:'player',team:'player',role:'hero',x:6,y:3.2},{id:'enemy-1',team:'enemy',role:'shooter',x:17,y:4.7}],
 safeZones:[{x:3,y:2.5,width:6,height:.5},{x:13,y:4,width:4,height:.5}],
 landmarks:[{id:'barn',x:37,y:2.5},{id:'windmill',x:25,y:2.5}],
};
