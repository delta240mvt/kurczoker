import {getMap} from './arena.js';
import {WEAPONS} from './config.js';
const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
const integer=(n,min,max)=>Number.isSafeInteger(n)&&finite(n,min,max);
const text=(s,max=128)=>typeof s==='string'&&s.length>0&&s.length<=max;
const unique=a=>new Set(a).size===a.length;
const upgrades=a=>Array.isArray(a)&&a.length<=3&&unique(a)&&a.every(id=>['shell','boots','toolbelt'].includes(id));
const vec=p=>p&&finite(p.x,-100,200)&&finite(p.y,-100,200);
const roles=['hero','shooter','grenadier','rusher','boss'];
export function validInventory(i){
 return !!i&&Array.isArray(i.owned)&&i.owned.length>=1&&i.owned.length<=6&&unique(i.owned)&&i.owned.every(id=>Object.hasOwn(WEAPONS,id))&&
  i.ammo&&typeof i.ammo==='object'&&!Array.isArray(i.ammo)&&Object.entries(i.ammo).every(([id,n])=>['granajko','shotgun','mine','cluster'].includes(id)&&i.owned.includes(id)&&integer(n,0,999))&&
  i.tools&&['pickaxe','drill'].every(id=>integer(i.tools[id],0,99));
}
const ids=(a,max)=>Array.isArray(a)&&a.length<=max&&a.every(id=>text(id))&&unique(a);
export function validateBattleSnapshot(s,mapOverride){
 try{
  if(!s||s.schemaVersion!==2)return 'battle-version';
  const map=mapOverride??getMap(s.mapId);
  if(s.mapId!==map.id||s.mapVersion!==map.version||!text(s.encounterId)||!['quick','expedition'].includes(s.mode))return 'battle-map';
  if(!integer(s.seed,0,0xffffffff)||!integer(s.rngState,0,0xffffffff)||!finite(s.time,0,1e9)||!integer(s.turn,1,1e6)||!finite(s.phaseTime,0,1e9)||!finite(s.accumulator,0,.101))return 'battle-clock';
  if(!['player','player-shot','enemy-tell','enemy-move','enemy-shot','enemy-charge','enemy-resolve','settle','finished'].includes(s.phase)||typeof s.paused!=='boolean'||![null,'won','lost'].includes(s.outcome))return 'battle-phase';
  const t=s.terrain,columns=Math.ceil(map.width/map.cellSize),rows=Math.ceil(map.height/map.cellSize);
  if(!t||t.width!==map.width||t.height!==map.height||t.cellSize!==map.cellSize||t.columns!==columns||t.rows!==rows||t.chunkCells!==map.chunkCells||!integer(t.revision,0,1e7)||!Array.isArray(t.cells)||t.cells.length!==columns*rows||!t.cells.every(n=>integer(n,0,3)))return 'battle-terrain';
  if(!Array.isArray(s.actors)||s.actors.length<2||s.actors.length>8||!ids(s.actors.map(a=>a.id),8)||s.actors.filter(a=>a.team==='player').length!==1)return 'battle-actors';
  const actorIds=s.actors.map(a=>a.id),hero=s.actors.find(a=>a.team==='player');
  if(hero.id!==map.spawns.find(a=>a.team==='player').id||hero.role!=='hero')return 'battle-player';
  for(const a of s.actors)if(!['player','enemy'].includes(a.team)||!roles.includes(a.role)||!finite(a.x,-10,map.width+10)||!finite(a.y,-10,map.height+60)||!finite(a.vx,-200,200)||!finite(a.vy,-200,200)||!integer(a.maxHealth,1,1000)||!integer(a.health,0,a.maxHealth)||typeof a.grounded!=='boolean'||typeof a.guardAvailable!=='boolean'||(a.lastSafe!==null&&!vec(a.lastSafe)))return 'battle-actor';
  if(!validInventory(s.inventory)||!upgrades(s.upgrades)||!s.inventory.owned.includes(s.selectedWeaponId)||!s.aim||!finite(s.aim.angleDeg,-180,180)||!finite(s.aim.power,2,18)||typeof s.toolUsed!=='boolean'||![-1,1].includes(s.facing))return 'battle-inventory';
  if(!ids(s.enemyQueue,8)||s.enemyQueue.some(id=>!actorIds.includes(id))||s.activeEnemyId!==null&&!actorIds.includes(s.activeEnemyId)||!integer(s.nextEntityId,0,1e9))return 'battle-queue';
  if(s.enemyPlan!==null){const p=s.enemyPlan;if(!p||!Object.hasOwn(WEAPONS,p.weaponId)||![-1,0,1].includes(p.moveDirection)||!finite(p.moveSeconds,0,1.5))return 'battle-plan';
   if(p.angleDeg!==undefined&&!finite(p.angleDeg,-180,180)||p.power!==undefined&&!finite(p.power,0,18))return 'battle-plan';}
  if(!Array.isArray(s.projectiles)||s.projectiles.length>32||!Array.isArray(s.mines)||s.mines.length>16)return 'battle-projectiles';
  const entities=[...s.projectiles,...s.mines];if(!unique(entities.map(p=>p.id)))return 'battle-entities';
  for(const p of entities)if(!integer(p.id,0,s.nextEntityId)||!actorIds.includes(p.ownerId)||!['player','enemy'].includes(p.team)||!vec(p)||!finite(p.age,0,1e9))return 'battle-entity';
  for(const p of s.projectiles)if(!['jajooka','granajko','cluster','fragment'].includes(p.weaponId)||!finite(p.vx,-200,200)||!finite(p.vy,-200,200)||!(p.fuse===null||finite(p.fuse,-.1,10))||!integer(p.bounces,0,1e6))return 'battle-projectile';
  for(const p of s.mines)if(!finite(p.vy,-200,200))return 'battle-mine';
  if(!Array.isArray(s.resolvedExplosions)||s.resolvedExplosions.length>100000||!s.resolvedExplosions.every(n=>integer(n,0,s.nextEntityId)))return 'battle-events';
  if(s.rope!==null){const r=s.rope;if(!r||!vec(r.anchor)||!vec(r.normal)||!Array.isArray(r.pivots)||r.pivots.length>12||!r.pivots.every(vec)||!finite(r.length,1.2,18)||![-1,0,1].includes(r.reelRate))return 'battle-rope';
   let used=0,previous=r.anchor;for(const p of r.pivots){used+=Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;}if(used+1.2>r.length+.001)return 'battle-rope-length';}
  if(s.boss!==null){const b=s.boss;if(!b||!actorIds.includes(b.actorId)||!integer(b.actionIndex,0,1e6)||!['salvo','charge'].includes(b.intent?.type)||![0,2,3].includes(b.intent.shots)||!vec(b.intent.target)||!text(b.intent.label))return 'battle-boss';
   if(b.charge!==null&&(!finite(b.charge.startX,-10,map.width+10)||![-1,1].includes(b.charge.direction)||typeof b.charge.hit!=='boolean'))return 'battle-charge';}
  return null;
 }catch{return 'battle-schema'}
}
function validOffer(o){
 if(!o||!text(o.id)||!text(o.label,200)||!text(o.description,600)||!['heal','tool','ammo','weapon','upgrade'].includes(o.kind))return false;
 if(o.price!==undefined&&(!integer(o.price,0,1000)||typeof o.purchased!=='boolean'))return false;
 if(o.kind==='upgrade')return ['shell','boots','toolbelt'].includes(o.upgradeId);
 if(!integer(o.amount,1,100))return false;
 if(o.kind==='tool')return ['drill','pickaxe'].includes(o.toolId);
 if(['weapon','ammo'].includes(o.kind))return Object.hasOwn(WEAPONS,o.weaponId);
 return true;
}
export function validateCheckpoint(value){
 try{const g=value?.game;if(!g||g.schemaVersion!==2||!text(g.runId)||!integer(g.seed,0,0xffffffff)||!integer(g.rngState,0,0xffffffff)||!integer(g.stage,0,3)||!['map','battle','reward','shop','retry','result'].includes(g.scene)||!['active','won','lost'].includes(g.status))return 'game-schema';
  if(!integer(g.maxHealth,1,1000)||!integer(g.health,0,g.maxHealth)||!integer(g.grain,0,1e6)||!validInventory(g.inventory)||!upgrades(g.upgrades)||typeof g.secondChanceUsed!=='boolean'||!ids(g.completedEncounterIds,4))return 'game-inventory';
  if(!Array.isArray(g.routes)||g.routes.length<1||g.routes.length>2||!ids(g.routes.map(r=>r.id),2)||!g.routes.some(r=>r.id===g.selectedRouteId))return 'game-routes';
  for(const r of g.routes)if(!getMap(r.mapId)||!integer(r.stage,0,3)||!roles.includes(r.role)||!integer(r.bonusGrain,0,15)||typeof r.hard!=='boolean')return 'game-route';
  if(g.encounterId!==null&&!text(g.encounterId)||!Array.isArray(g.rewardChoices)||g.rewardChoices.length>3||!g.rewardChoices.every(validOffer)||!Array.isArray(g.offers)||g.offers.length>4||!g.offers.every(validOffer))return 'game-offers';
  for(const s of [value.battle,value.battleStart,g.battleStart]){if(s!==null){const reason=validateBattleSnapshot(s);if(reason)return reason;}}
  if(g.scene==='battle'&&(!value.battle||value.battle.encounterId!==g.encounterId||!value.battleStart))return 'game-battle';
  if(value.battleStart&&value.battleStart.encounterId!==g.encounterId)return 'game-start';
  return null;
 }catch{return 'checkpoint-schema'}
}
