/** @typedef {{x:number,y:number}} Vec2 */
/** @typedef {{id:string,kind:'rect',x:number,y:number,width:number,height:number,material:number}} TerrainShape */
/** @typedef {{id:string,name:string,summary:string,version:number,width:number,height:number,cellSize:number,chunkCells:number,shapes:TerrainShape[],spawns:Array<{id:string,team:string,role:string,x:number,y:number}>,safeZones:Array<{x:number,y:number,width:number,height:number}>,landmarks:object[]}} MapDef */
/** @typedef {{owned:string[],ammo:Record<string,number>,tools:{pickaxe:number,drill:number}}} Inventory */
/** @typedef {{id:string,team:string,role:string,x:number,y:number,vx:number,vy:number,health:number,maxHealth:number,grounded:boolean,alive:boolean,lastSafe:Vec2|null,guardAvailable:boolean}} ActorSnapshot */
/** @typedef {{anchor:Vec2,normal:Vec2,pivots:Vec2[],length:number,reelRate:number}|null} RopeState */
/** @typedef {{mapId?:string,map?:MapDef,encounterId:string,mode:'quick'|'expedition',seed:number,player:{health:number,maxHealth:number,inventory:Inventory,upgrades:string[]},enemies?:Array<{id:string,role:string,health:number,maxHealth:number,x:number,y:number}>}} BattleOptions */
/** @typedef {{accepted:boolean,reason?:'phase'|'paused'|'blocked'|'range'|'empty'|'used'|'invalid'}} Receipt */
/** @typedef {{type:'move',direction:number}|{type:'jump'}|{type:'aim',angleDeg:number,power:number}|{type:'select',weaponId:string}|{type:'attack'}|{type:'pass'}|{type:'rope.attach',point:Vec2}|{type:'rope.release'}|{type:'rope.reel',rate:number}|{type:'tool',toolId:'pickaxe'|'drill',direction:number}} Command */

// Runtime: dispatch(Command):Receipt; advance(seconds); setPaused(boolean);
// snapshot() returns serializable independent state; trajectory():Vec2[];
// drainEvents():{id,type,time,payload}[]; dispose(). No renderer owns physics.
export {};
