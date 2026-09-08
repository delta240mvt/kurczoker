import R from "@dimforge/rapier3d-compat";
import {
  STEP,
  GRAVITY,
  arenaFor,
  addTerrain,
  getMap,
} from "./arena.js";
import { clamp, launchVelocity } from "./ballistics.js";
import {createCharacter,findSafeReturn,isSafePosition} from './character.js';
import {createTerrain} from './terrain/mask.js';
import {syncTerrainColliders} from './terrain/collisions.js';
import {createRope} from './rope.js';
import {createSegmentCaster,stepProjectile,predictTrajectory,spawnClusterFragments,tickMines} from './projectiles.js';
import {WEAPONS,projectileDefinition,nextRandom} from './config.js';
import {explode,useTool,executeWeapon,coneRays,performKick} from './weapons.js';
import {nextPhase as resolveTurn} from './turns.js';
import {validateBattleSnapshot} from './checkpointValidation.js';
import {planEnemyAction} from './enemyAI.js';
import {announceBoss,startBossAction,stepBossCharge,resolveBossChargeHit} from './boss.js';

let initialization;
export async function createBattleSimulation(options = {}) {
  initialization ??= R.init();
  await initialization;
  return new BattleSimulation(options);
}

export async function restoreBattleSimulation(snapshot,{map}={}){
 const reason=validateBattleSnapshot(snapshot,map);if(reason)throw new Error('Niepoprawna walka: '+reason);
 initialization??=R.init();await initialization;
 const hero=snapshot.actors.find(a=>a.team==='player'),options={map:map??getMap(snapshot.mapId),mode:snapshot.mode,seed:snapshot.seed,encounterId:snapshot.encounterId,
  player:{health:hero.health,maxHealth:hero.maxHealth,inventory:snapshot.inventory,upgrades:snapshot.upgrades},enemies:snapshot.actors.filter(a=>a.team==='enemy')};
 const sim=new BattleSimulation(options,snapshot.terrain);
 try{
  for(const saved of snapshot.actors){const actor=sim.actors.find(a=>a.id===saved.id);if(!actor)throw new Error('Unknown actor');
   actor.body.setTranslation({x:saved.x,y:saved.y,z:0},true);actor.body.setLinvel({x:saved.vx,y:saved.vy,z:0},true);actor.body.setEnabled(saved.health>0);
   actor.health=saved.health;actor.maxHealth=saved.maxHealth;actor.grounded=saved.grounded;actor.hitAt=saved.hitAt;actor.lastSafe=saved.lastSafe?{...saved.lastSafe}:null;actor.guardAvailable=saved.guardAvailable;
  }
  sim.world.propagateModifiedBodyPositionsToColliders();
  for(const key of ['time','turn','phase','phaseTime','accumulator','paused','outcome','toolUsed','activeEnemyId','selectedWeaponId','facing','guard','boost','rngState'])sim[key]=snapshot[key];
  sim.inventory=structuredClone(snapshot.inventory);sim.enemyQueue=[...snapshot.enemyQueue];sim.enemyPlan=structuredClone(snapshot.enemyPlan);sim.boss=structuredClone(snapshot.boss);
  sim.projectiles=structuredClone(snapshot.projectiles);sim.projectile=sim.projectiles[0]??null;sim.mines=structuredClone(snapshot.mines);sim.shotId=snapshot.nextEntityId;sim.resolvedExplosions=new Set(snapshot.resolvedExplosions);
  sim.angle=snapshot.aim.angleDeg;sim.power=snapshot.aim.power;sim.direction=0;
  sim.rope.restore(snapshot.rope);if(sim.phase==='player')sim.rope.reel(0);
  sim.events=[];sim.trajectoryCache=null;return sim;
 }catch(e){sim.dispose();throw e}
}

class BattleSimulation {
  constructor(options,savedTerrain=null) {
    this.options = options;
    this.arena = options.map ?? arenaFor(options.type, options.encounterId);
    this.world = new R.World({ x: 0, y: GRAVITY, z: 0 });
    this.world.timestep = STEP;
    this.queue = new R.EventQueue(true);
    this.terrain=options.map?createTerrain(this.arena,savedTerrain):null;
    this.terrainRegistry=new Map();
    if(this.terrain) syncTerrainColliders({R,world:this.world,terrain:this.terrain,registry:this.terrainRegistry});
    else addTerrain(R, this.world, this.arena);
    const playerSpawn=this.arena.spawns?.find(s=>s.team==='player') ?? {id:'player',team:'player',role:'hero',x:-4.5,y:.57};
    this.player=createCharacter({R,world:this.world,spawn:playerSpawn,
      health:options.player?.health??options.health??3,maxHealth:options.player?.maxHealth??options.maxHealth??3});
    this.player.guardAvailable=(options.player?.upgrades??[]).includes('shell');
    const hp = options.type === "boss" ? 8 : options.type === "elite" ? 4 : 2;
    const enemySpawns=options.enemies?.map(e=>({...e,team:'enemy'})) ?? this.arena.spawns?.filter(s=>s.team==='enemy') ?? [{id:'enemy-1',team:'enemy',role:'shooter',x:3.5,y:.57}];
    this.enemies=enemySpawns.map(spawn=>createCharacter({R,world:this.world,spawn,
      health:spawn.health??(options.map?45:hp),maxHealth:spawn.maxHealth??(options.map?45:hp)}));
    this.enemy=this.enemies[0];
    this.actors=[this.player,...this.enemies];
    this.rope=createRope({world:this.world,playerBody:this.player.body,terrain:this.terrain,onRelease:reason=>{
      if(!this.disposed)this.events.push({id:`rope-${this.time}-${this.events.length}`,type:'rope-release',time:this.time,payload:{reason}});
    }});
    this.projectiles=[];
    this.mines=[];
    this.rngState=options.seed??1;
    this.resolvedExplosions=new Set();
    this.inventory=structuredClone(options.player?.inventory??{owned:['jajooka'],ammo:{},tools:{pickaxe:0,drill:0}});
    this.selectedWeaponId='jajooka';
    this.toolUsed=false;
    this.castSegment=createSegmentCaster(this.world,this.actors);
    this.phase = "player";
    this.enemyQueue=[];
    this.activeEnemyId=null;
    this.enemyPlan=null;
    this.turn = 1;
    this.time = 0;
    this.remaining = null;
    this.angle = 40;
    this.power = 9;
    this.direction = 0;
    this.facing = 1;
    this.accumulator = 0;
    this.paused = false;
    this.disposed = false;
    this.events = [];
    this.projectile = null;
    this.outcome = null;
    this.phaseTime = 0;
    this.guard = (options.temporarySummons?.length ?? 0) > 0 ? 1 : 0;
    this.boost = 0;
    this.shellUsed = false;
    this.shotId = 0;
    this.trajectoryCache = null;
    this.world.step(this.queue);
    this.actors.forEach(a=>a.updateGrounded());
    this.boss=this.terrain?announceBoss(this):null;
  }
  dispatch(command) {
    if(!command || typeof command!=='object') return {accepted:false,reason:'invalid'};
    if(!this.canAct()) return {accepted:false,reason:this.paused?'paused':'phase'};
    if(command.type==='move' && [-1,0,1].includes(command.direction)) {
      this.move(command.direction);return {accepted:true};
    }
    if(command.type==='aim' && Number.isFinite(command.angleDeg) && Number.isFinite(command.power)) {
      this.angle=clamp(command.angleDeg,-180,180);this.power=clamp(command.power,2,18);
      this.facing=Math.cos(this.angle*Math.PI/180)>=0?1:-1;return {accepted:true};
    }
    if(command.type==='pass'){this.direction=0;this.beginEnemyResponses();return {accepted:true};}
    if(command.type==='tool') return useTool(command,this);
    if(command.type==='select') {
      if(!WEAPONS[command.weaponId]||!this.inventory.owned.includes(command.weaponId))return {accepted:false,reason:'locked'};
      this.selectedWeaponId=command.weaponId;this.trajectoryCache=null;return {accepted:true};
    }
    if(command.type==='attack') return this.terrain?executeWeapon({weaponId:this.selectedWeaponId,actor:this.player,aim:{angleDeg:this.angle,power:this.power},battle:this}):{accepted:this.fire()};
    if(command.type==='jump') return {accepted:this.jump()};
    if(command.type==='rope.attach') return this.rope.attach(command.point);
    if(command.type==='rope.reel') return this.rope.reel(command.rate);
    if(command.type==='rope.release') {this.rope.release();return {accepted:true};}
    return {accepted:false,reason:'invalid'};
  }
  canAct() {
    return (
      !this.disposed && !this.paused && !this.outcome && this.phase === "player"
    );
  }
  move(value) {
    if (this.canAct() || value === 0) {
      this.direction=Math.sign(value);
      if(this.direction && this.direction!==this.facing){
        this.facing=this.direction;this.angle=this.angle>=0?180-this.angle:-180-this.angle;
        this.trajectoryCache=null;
      }
    }
  }
  jump() {
    if (!this.canAct() || !this.player.grounded) return false;
    return this.player.jump();
  }
  aim(angle, power = this.power, facing = this.facing) {
    if (!this.canAct()) return;
    if (Number.isFinite(angle)) this.angle = facing<0?180-clamp(angle,-180,180):clamp(angle,-180,180);
    if (Number.isFinite(power)) this.power = clamp(power, 2, 18);
    if (facing === 1 || facing === -1) this.facing = facing;
  }
  setPaused(value) {
    if (!this.disposed) {
      this.paused = !!value;
      this.direction = 0;
      this.rope?.reel(0);
      this.accumulator = 0;
    }
  }
  terrainTarget(point) {
    if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
    const p=this.player.body.translation(),dx=point.x-p.x,dy=point.y-p.y,d=Math.hypot(dx,dy);
    if(d<.01)return null;
    const direction={x:dx/d,y:dy/d,z:0};
    const hit=this.world.castRay(new R.Ray(p,direction),Math.min(18,d+.2),true,undefined,(2<<16)|1,this.player.collider,this.player.body);
    return hit?{x:p.x+direction.x*hit.timeOfImpact,y:p.y+direction.y*hit.timeOfImpact}:null;
  }
  origin(actor = this.player, angle = this.angle) {
    const p=actor.body.translation(),r=angle*Math.PI/180;
    return {x:p.x+Math.cos(r)*.48,y:p.y+.2+Math.sin(r)*.48,z:0};
  }
  fire(ability = "egg-bomb") {
    if(this.terrain)return executeWeapon({weaponId:this.selectedWeaponId,actor:this.player,aim:{angleDeg:this.angle,power:this.power},battle:this}).accepted;
    if (
      !this.canAct() ||
      !(this.options.abilities ?? ["egg-bomb"]).includes(ability)
    )
      return false;
    this.direction = 0;
    if (ability === "crest-jump") {
      this.player.vy = 8;
      this.player.grounded = false;
      this.guard = Math.max(this.guard, 1);
      this.events.push({ type: "ability", ability });
      this.beginEnemyResponses();
    } else if (ability === "guard-chick") {
      this.guard = 1;
      this.events.push({ type: "ability", ability });
      this.beginEnemyResponses();
    } else if (ability === "mana-grain") {
      this.player.health = Math.min(
        this.player.maxHealth,
        this.player.health + 1,
      );
      this.boost = 1;
      this.events.push({ type: "ability", ability });
      this.beginEnemyResponses();
    } else {
      this.spawnProjectile(
        "player",
        this.origin(),
        launchVelocity(this.angle, this.power),
      );
      this.nextPhase("player-shot");
    }
    return true;
  }
  spawnProjectile(team, origin, velocity, actor,weaponId='jajooka') {
    const owner=actor??(team==='player'?this.player:this.enemy);
    const shot={id:++this.shotId,ownerId:owner.id,weaponId,team,
      x:origin.x,y:origin.y,z:0,vx:velocity.x,vy:velocity.y,age:0,fuse:WEAPONS[weaponId]?.fuse??null,bounces:0};
    this.projectiles.push(shot);this.projectile=this.projectiles[0];
    this.events.push({id:'shoot-'+shot.id,type:'shoot',team,time:this.time,payload:{ownerId:owner.id,weaponId}});
    return shot;
  }
  finishResult() {
    if(this.outcome)return true;
    const result=resolveTurn({actors:this.actors,phase:'check'});
    if(!result.outcome || result.outcome==='won'&&this.projectiles.length>0)return false;
    this.outcome=result.outcome;this.direction=0;this.rope.reel(0);
    this.nextPhase('finished');this.events.push({id:'result',type:this.outcome,time:this.time});
    this.actors.filter(a=>a.health<=0).forEach(a=>a.body.setEnabled(false));
    return true;
  }
  beginEnemyResponses() {
    this.direction=0;this.rope.reel(0);
    if(this.finishResult())return;
    const result=resolveTurn({actors:this.actors,phase:'player-resolve'});
    this.enemyQueue=result.enemyQueue;
    this.startNextEnemy();
  }
  startNextEnemy() {
    if(this.finishResult())return;
    if(this.boss&&this.activeEnemyId===this.boss.actorId&&this.phase==='enemy-resolve')this.boss.actionIndex++;
    const result=resolveTurn({actors:this.actors,phase:'enemy-resolve',enemyQueue:this.enemyQueue,turn:this.turn,toolUsed:this.toolUsed});
    this.enemyQueue=result.enemyQueue;
    this.activeEnemyId=this.enemyQueue.shift()??null;
    if(!this.activeEnemyId){this.nextPhase('settle');return;}
    const actor=this.actors.find(a=>a.id===this.activeEnemyId);
    this.enemyPlan=actor.role==='boss'&&this.boss?{moveDirection:0,moveSeconds:0,weaponId:'granajko',label:this.boss.intent.label}:planEnemyAction({actor:actor.snapshot(),snapshot:this.snapshot({includeTerrain:false}),terrain:this.terrain,castSegment:this.castSegment});
    this.events.push({id:'tell-'+this.turn+'-'+actor.id,type:'telegraph',time:this.time,payload:{actorId:actor.id}});
    this.nextPhase('enemy-tell');
  }
  nextPhase(phase) {
    this.phase = phase;
    this.phaseTime = 0;
  }
  advance(seconds) {
    if (
      this.disposed ||
      this.paused ||
      this.outcome ||
      !Number.isFinite(seconds) ||
      seconds <= 0
    )
      return;
    this.accumulator += Math.min(seconds, 0.1);
    while (this.accumulator + 1e-8 >= STEP && !this.outcome) {
      this.accumulator -= STEP;
      this.step();
    }
  }
  step() {
    this.time += STEP;
    this.phaseTime += STEP;
    this.stepActor(
      this.player,
      this.phase === "player"
        ? this.direction * (4 + (this.options.stats?.moveSpeedBonus ?? 0) * 12)
        : 0,
    );
    this.enemies.forEach(a=>this.stepActor(a,this.phase==='enemy-move'&&a.id===this.activeEnemyId?(this.enemyPlan?.moveDirection??0)*3:0));
    if(this.phase==='enemy-charge')stepBossCharge(this,STEP);
    this.rope.step(STEP);
    this.world.step(this.queue);
    this.actors.forEach(a=>a.updateGrounded());
    this.resolveFalls();
    if(this.phase==='enemy-charge')resolveBossChargeHit(this);
    const mineTick=tickMines(this.mines,this.actors.map(a=>a.snapshot()),STEP,this.terrain);
    this.mines=mineTick.mines;
    for(const mine of mineTick.explosions)explode({id:mine.id,point:mine,radius:WEAPONS.mine.radius,maxDamage:WEAPONS.mine.damage,ownerId:mine.ownerId},this);
    for(const shot of [...this.projectiles]) {
      const result=stepProjectile(shot,STEP,this.castSegment);
      Object.assign(shot,result.projectile);
      const outside=shot.y < -2 || shot.x < (this.terrain?-3:-9) || shot.x > (this.terrain?this.arena.width+3:9);
      if(result.hit || outside || shot.age>8 || shot.fuse!=null&&shot.fuse<=0)this.impact(shot);
    }
    this.projectile=this.projectiles[0]??null;
    if (this.finishResult()) return;
    const active=this.enemies.find(a=>a.id===this.activeEnemyId);
    if(this.phase==='enemy-tell' && this.phaseTime>=.7) {
      if(!active || active.health<=0){this.startNextEnemy();return;}
      this.nextPhase('enemy-move');
      if(this.enemyPlan?.jump)active.jump();
    } else if(this.phase==='enemy-move' && this.phaseTime>=Math.min(1.5,this.enemyPlan?.moveSeconds??0)) {
      if(!active || active.health<=0){this.startNextEnemy();return;}
      if(active.role==='boss'&&this.boss){startBossAction(this,active);return;}
      const plan=planEnemyAction({actor:active.snapshot(),snapshot:this.snapshot({includeTerrain:false}),terrain:this.terrain,castSegment:this.castSegment,allowMove:false});
      if(!plan){this.startNextEnemy();return;}
      if(plan.weaponId==='kick'){performKick(active,Math.cos(plan.angleDeg*Math.PI/180)>=0?1:-1,this);this.nextPhase('enemy-resolve');return;}
      this.spawnProjectile('enemy',this.origin(active,plan.angleDeg),launchVelocity(plan.angleDeg,plan.power),active,plan.weaponId);
      this.nextPhase('enemy-shot');
    } else if(this.phase==='enemy-resolve' && this.phaseTime>=.3) {
      this.startNextEnemy();
    } else if(this.phase==='settle' && this.phaseTime>=.65) {
      this.turn++;this.toolUsed=false;this.activeEnemyId=null;this.enemyPlan=null;
      this.nextPhase('player');
      if(this.boss)this.boss=announceBoss(this);
    }
  }
  stepActor(actor, vx) {
    actor.step({direction:Math.sign(vx),speed:Math.abs(vx)||4},STEP);
  }
  resolveFalls() {
    if(!this.terrain) return;
    for(const actor of this.actors) {
      if(actor.health<=0) continue;
      const position=actor.body.translation();
      if(actor.grounded && isSafePosition({point:position,terrain:this.terrain,mines:this.mines})) {
        actor.lastSafe={x:position.x,y:position.y};
      }
      if(position.y>=-2 && position.x>=-2 && position.x<=this.arena.width+2) continue;
      actor.health=Math.max(0,actor.health-Math.ceil(actor.maxHealth*(actor===this.player&&(this.options.player?.upgrades??[]).includes('boots')?.1:.2)));
      this.events.push({id:`fall-${this.time}-${actor.id}`,type:'fall',time:this.time,payload:{actorId:actor.id,health:actor.health}});
      const point=findSafeReturn({terrain:this.terrain,mines:this.mines,safeZones:this.arena.safeZones,lastSafe:actor.lastSafe,
        actors:this.actors.filter(a=>a!==actor).map(a=>a.snapshot())});
      if(!point) actor.health=0;
      if(actor.health>0) {
        actor.body.setTranslation({...point,z:0},true);
        actor.body.setLinvel({x:0,y:0,z:0},true);
        actor.grounded=false;
      } else actor.body.setEnabled(false);
      if(actor===this.player) {this.direction=0;this.rope?.release();}
    }
    this.finishResult();
  }

  impact(shot = this.projectile) {
    if(!shot || this.resolvedExplosions.has(shot.id))return;
    if(shot.weaponId==='cluster'){
      this.resolvedExplosions.add(shot.id);
      this.projectiles=this.projectiles.filter(p=>p.id!==shot.id);
      const random=()=>{const next=nextRandom(this.rngState);this.rngState=next.state;return next.value;};
      this.projectiles.push(...spawnClusterFragments(shot,()=>++this.shotId,random));
      this.projectile=this.projectiles[0];
      this.events.push({id:'cluster-'+shot.id,type:'cluster',time:this.time,x:shot.x,y:shot.y,payload:{ownerId:shot.ownerId}});
      return;
    }
    const definition=projectileDefinition(shot.weaponId);
    explode({id:shot.id,point:{x:shot.x,y:shot.y},radius:definition.radius,maxDamage:definition.damage,ownerId:shot.ownerId},this);
    this.projectiles=this.projectiles.filter(p=>p.id!==shot.id);
    this.projectile=this.projectiles[0]??null;
    if(shot.team==='player')this.boost=0;
    if(this.finishResult())return;
    if(!this.projectiles.length) {
      if(shot.team==='player')this.beginEnemyResponses();
      else this.nextPhase('enemy-resolve');
    }
  }

  trajectory() {
    if(this.disposed)return [];
    const origin=this.origin();
    const key=JSON.stringify([origin,this.angle,this.power,this.selectedWeaponId,this.terrain?.revision,
      this.actors.map(a=>a.body.translation())]);
    if(this.trajectoryCache?.key===key)return this.trajectoryCache.points;
    const definition=WEAPONS[this.selectedWeaponId];
    if(['mine','contact'].includes(definition.kind))return [];
    if(definition.kind==='cone') {
      const {origin,rays}=coneRays({actor:this.player,aim:{angleDeg:this.angle},battle:this});
      return [origin,{...rays[Math.floor(rays.length/2)].point,z:0}];
    }
    const points=predictTrajectory({origin,angleDeg:this.angle,power:this.power,castSegment:this.castSegment,ownerId:this.player.id,weaponId:this.selectedWeaponId});
    this.trajectoryCache={key,points};return points;
  }
  snapshot({includeTerrain=true}={}) {
    const read = (a) => ({
      team: a.team,
      ...a.body.translation(),
      health: a.health,
      maxHealth: a.maxHealth,
      grounded: a.grounded,
      hitAt: a.hitAt,
    });
    return {
      schemaVersion:2,
      mapId:this.arena.id??null,mapVersion:this.arena.version??null,encounterId:this.options.encounterId??'legacy',mode:this.options.mode??'quick',seed:this.options.seed??1,
      phaseTime:this.phaseTime,accumulator:this.accumulator,enemyQueue:[...this.enemyQueue],nextEntityId:this.shotId,resolvedExplosions:[...this.resolvedExplosions],upgrades:[...(this.options.player?.upgrades??[])],
      boss:this.boss?structuredClone(this.boss):null,
      actors:this.actors.map(a=>a.snapshot()),
      terrain:includeTerrain?(this.terrain?.snapshot()??null):null,
      rope:this.rope.snapshot(),
      phase: this.phase,
      turn: this.turn,
      time: this.time,
      remaining: null,
      paused: this.paused,
      player: read(this.player),
      enemy: read(this.enemy),
      angle: this.angle,
      power: this.power,
      facing: this.facing,
      guard: this.guard,
      boost: this.boost,
      projectiles:this.projectiles.map(p=>({...p})),
      mines:this.mines.map(m=>({...m})),
      rngState:this.rngState,
      projectile:this.projectile?{...this.projectile}:null,
      inventory:structuredClone(this.inventory),
      selectedWeaponId:this.selectedWeaponId,
      toolUsed:this.toolUsed,
      activeEnemyId:this.activeEnemyId,
      enemyPlan:this.enemyPlan?{...this.enemyPlan}:null,
      aim:{angleDeg:this.angle,power:this.power},
      outcome: this.outcome,
    };
  }
  drainEvents() {
    return this.events.splice(0);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.rope.release();
    this.queue.free();
    this.world.free();
    this.events.length = 0;
  }
}
