/** Explicit geometry helpers. Rectangles are expanded once, never randomized. */
export function stairs(x,y,count,direction=1,material=1){
 return Array.from({length:count},(_,i)=>[x+direction*i*2,y,2,(i+1)*1.25,material]);
}
export function scaffold(x,y,count,direction=1){
 return Array.from({length:count},(_,i)=>[x+direction*i*2,y+i*1.25-.25,2.5,.25,2]);
}
export function defineMap({id,name,summary,width,height=28,rows,spawns,safeZones,theme='meadow',landmarks=[]}){
 return {id,name,summary,width,height,version:1,cellSize:.125,chunkCells:32,theme,
  shapes:rows.map(([x,y,width,height,material],i)=>({id:`${id}-${i}`,kind:'rect',x,y,width,height,material})),
  spawns:spawns.map(([x,ground,role='shooter'],i)=>({id:i?`enemy-${i}`:'player',team:i?'enemy':'player',role:i?role:'hero',x,y:ground+.7})),
  safeZones,landmarks};
}
