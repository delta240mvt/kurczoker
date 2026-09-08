import R from "@dimforge/rapier3d-compat";
import {
  STEP,
  GRAVITY,
  arenaFor,
  addTerrain,
} from "./arena.js";
import { clamp, launchVelocity } from "./ballistics.js";
import {createCharacter,findSafeReturn,isSafePosition} from './character.js';
import {createTerrain} from './terrain/mask.js';
import {syncTerrainColliders} from './terrain/collisions.js';
import {createRope} from './rope.js';
import {createSegmentCaster,stepProjectile,predictTrajectory} from './projectiles.js';
import {explode,useTool} from './weapons.js';

let initialization;
export async function createBattleSimulation(options = {}) {
  initialization ??= R.init();
  await initialization;
  return new BattleSimulation(options);
}

class BattleSimulation {
  constructor(options) {
    this.options = options;
    this.arena = options.map ?? arenaFor(options.type, options.encounterId);
    this.world = new R.World({ x: 0, y: GRAVITY, z: 0 });
    this.world.timestep = STEP;
    this.queue = new R.EventQueue(true);
    this.terrain=options.map?createTerrain(this.arena):null;
    this.terrainRegistry=new Map();
    if(this.terrain) syncTerrainColliders({R,world:this.world,terrain:this.terrain,registry:this.terrainRegistry});
    else addTerrain(R, this.world, this.arena);
    const playerSpawn=this.arena.spawns?.find(s=>s.team==='player') ?? {id:'player',team:'player',role:'hero',x:-4.5,y:.57};
    this.player=createCharacter({R,world:this.world,spawn:playerSpawn,
      health:options.player?.health??options.health??3,maxHealth:options.player?.maxHealth??options.maxHealth??3});
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
    this.resolvedExplosions=new Set();
    this.inventory=structuredClone(options.player?.inventory??{owned:['jajooka'],ammo:{},tools:{pickaxe:0,drill:0}});
    this.selectedWeaponId='jajooka';
    this.toolUsed=false;
    this.castSegment=createSegmentCaster(this.world,this.actors);
    this.phase = "player";
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
    if(command.type==='tool') return useTool(command,this);
    if(command.type==='attack') return {accepted:this.fire()};
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
    if (this.canAct() || value === 0) this.direction = Math.sign(value);
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
  origin(actor = this.player, angle = this.angle) {
    const p=actor.body.translation(),r=angle*Math.PI/180;
    return {x:p.x+Math.cos(r)*.48,y:p.y+.2+Math.sin(r)*.48,z:0};
  }
  fire(ability = "egg-bomb") {
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
      this.nextPhase("enemy-tell");
    } else if (ability === "guard-chick") {
      this.guard = 1;
      this.events.push({ type: "ability", ability });
      this.nextPhase("enemy-tell");
    } else if (ability === "mana-grain") {
      this.player.health = Math.min(
        this.player.maxHealth,
        this.player.health + 1,
      );
      this.boost = 1;
      this.events.push({ type: "ability", ability });
      this.nextPhase("enemy-tell");
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
  spawnProjectile(team, origin, velocity) {
    const owner=team==='player'?this.player:this.enemy;
    const shot={id:++this.shotId,ownerId:owner.id,weaponId:'jajooka',team,
      x:origin.x,y:origin.y,z:0,vx:velocity.x,vy:velocity.y,age:0,fuse:null,bounces:0};
    this.projectiles.push(shot);this.projectile=this.projectiles[0];
    this.events.push({id:'shoot-'+shot.id,type:'shoot',team,time:this.time,payload:{ownerId:owner.id}});
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
    this.enemies.forEach(a=>this.stepActor(a,0));
    this.rope.step(STEP);
    this.world.step(this.queue);
    this.actors.forEach(a=>a.updateGrounded());
    this.resolveFalls();
    for(const shot of [...this.projectiles]) {
      const result=stepProjectile(shot,STEP,this.castSegment);
      Object.assign(shot,result.projectile);
      const outside=shot.y < -2 || shot.x < (this.terrain?-3:-9) || shot.x > (this.terrain?this.arena.width+3:9);
      if(result.hit || outside || shot.age>8)this.impact(shot);
    }
    this.projectile=this.projectiles[0]??null;
    if (this.outcome) return;
    if (this.phase === "enemy-tell" && this.phaseTime >= 1.3) {
      const from = this.origin(this.enemy),
        target = this.player.body.translation();
      const flight = 1.18;
      // A visible, physically simulated attack aimed at the player's current position.
      this.spawnProjectile("enemy", from, {
        x: (target.x - from.x) / flight,
        y: (target.y - from.y - 0.5 * GRAVITY * flight ** 2) / flight,
        z: 0,
      });
      this.nextPhase("enemy-shot");
    } else if (this.phase === "settle" && this.phaseTime >= 0.65) {
      this.turn++;
      this.toolUsed=false;
      this.nextPhase("player");
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
      if(actor.grounded && isSafePosition({point:position,terrain:this.terrain})) {
        actor.lastSafe={x:position.x,y:position.y};
      }
      if(position.y>=-2 && position.x>=-2 && position.x<=this.arena.width+2) continue;
      actor.health=Math.max(0,actor.health-Math.ceil(actor.maxHealth*.2));
      this.events.push({id:`fall-${this.time}-${actor.id}`,type:'fall',time:this.time,payload:{actorId:actor.id,health:actor.health}});
      const point=findSafeReturn({terrain:this.terrain,safeZones:this.arena.safeZones,lastSafe:actor.lastSafe,
        actors:this.actors.filter(a=>a!==actor).map(a=>a.snapshot())});
      if(!point) actor.health=0;
      if(actor.health>0) {
        actor.body.setTranslation({...point,z:0},true);
        actor.body.setLinvel({x:0,y:0,z:0},true);
        actor.grounded=false;
      } else actor.body.setEnabled(false);
      if(actor===this.player) {this.direction=0;this.rope?.release();}
    }
    const outcome=this.player.health<=0?'lost':this.enemies.every(a=>a.health<=0)?'won':null;
    if(outcome && !this.outcome) {
      this.outcome=outcome;this.nextPhase('finished');this.events.push({type:outcome});
    }
  }
  impact(shot = this.projectile) {
    if(!shot || this.resolvedExplosions.has(shot.id))return;
    explode({id:shot.id,point:{x:shot.x,y:shot.y},radius:1.8,maxDamage:30,ownerId:shot.ownerId},this);
    this.projectiles=this.projectiles.filter(p=>p.id!==shot.id);
    this.projectile=this.projectiles[0]??null;
    if(shot.team==='player')this.boost=0;
    const outcome=this.player.health<=0?'lost':this.enemies.every(a=>a.health<=0)?'won':null;
    if(outcome){this.outcome=outcome;this.nextPhase('finished');this.events.push({type:outcome});}
    else if(!this.projectiles.length)this.nextPhase(shot.team==='player'?'enemy-tell':'settle');
  }
  trajectory() {
    if(this.disposed)return [];
    const origin=this.origin();
    const key=JSON.stringify([origin,this.angle,this.power,this.terrain?.revision,
      this.actors.map(a=>a.body.translation())]);
    if(this.trajectoryCache?.key===key)return this.trajectoryCache.points;
    const points=predictTrajectory({origin,angleDeg:this.angle,power:this.power,castSegment:this.castSegment,ownerId:this.player.id});
    this.trajectoryCache={key,points};return points;
  }
  snapshot() {
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
      actors:this.actors.map(a=>a.snapshot()),
      terrain:this.terrain?.snapshot()??null,
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
      projectile:this.projectile?{...this.projectile}:null,
      inventory:structuredClone(this.inventory),
      selectedWeaponId:this.selectedWeaponId,
      toolUsed:this.toolUsed,
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
