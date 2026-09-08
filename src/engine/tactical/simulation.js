import R from "@dimforge/rapier3d-compat";
import {
  STEP,
  GRAVITY,
  arenaFor,
  addTerrain,
} from "./arena.js";
import { clamp, launchVelocity } from "./ballistics.js";
import {createCharacter} from './character.js';
import {createTerrain} from './terrain/mask.js';
import {syncTerrainColliders} from './terrain/collisions.js';

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
    if(command.type==='jump') return {accepted:this.jump()};
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
    if (Number.isFinite(angle)) this.angle = clamp(angle, 10, 80);
    if (Number.isFinite(power)) this.power = clamp(power, 6, 14);
    if (facing === 1 || facing === -1) this.facing = facing;
  }
  setPaused(value) {
    if (!this.disposed) {
      this.paused = !!value;
      this.direction = 0;
      this.accumulator = 0;
    }
  }
  origin(actor = this.player) {
    const p = actor.body.translation();
    return {
      x: p.x + (actor.team === "player" ? 0.52 * this.facing : -0.52),
      y: p.y + 0.36,
      z: 0,
    };
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
        launchVelocity(this.angle, this.power, this.facing),
      );
      this.nextPhase("player-shot");
    }
    return true;
  }
  spawnProjectile(team, origin, velocity) {
    const body = this.world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(origin.x, origin.y, 0)
        .setCcdEnabled(true)
        .enabledTranslations(true, true, false),
    );
    const group = team === "player" ? 8 : 16;
    const collider = this.world.createCollider(
      R.ColliderDesc.ball(0.14)
        .setRestitution(0)
        .setCollisionGroups((group << 16) | (team === "player" ? 1 | 4 : 1 | 2))
        .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS),
      body,
    );
    body.setLinvel(velocity, true);
    this.projectile = { id: ++this.shotId, team, body, collider, age: 0 };
    this.events.push({ type: "shoot", team });
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
    this.world.step(this.queue);
    this.actors.forEach(a=>a.updateGrounded());
    let collided = false;
    this.queue.drainCollisionEvents((a, b, started) => {
      if (
        started &&
        this.projectile &&
        [a, b].includes(this.projectile.collider.handle)
      )
        collided = true;
    });
    if (this.projectile) {
      this.projectile.age += STEP;
      const p = this.projectile.body.translation();
      if (collided || p.y < -2 || Math.abs(p.x) > 9 || this.projectile.age > 5)
        this.impact();
    }
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
      this.nextPhase("player");
    }
  }
  stepActor(actor, vx) {
    actor.step({direction:Math.sign(vx),speed:Math.abs(vx)||4},STEP);
  }
  impact() {
    const shot = this.projectile;
    if (!shot) return;
    const position = shot.body.translation();
    const target = shot.team === "player" ? this.enemy : this.player;
    const p = target.body.translation();
    const radius = 1.05;
    let damage =
      Math.hypot(p.x - position.x, p.y - position.y) <= radius + 0.35
        ? shot.team === "player"
          ? 2 + (this.options.stats?.eggBombDamageBonus ?? 0) + this.boost
          : 1
        : 0;
    if (shot.team === "enemy" && damage) {
      if (this.guard > 0) {
        damage = 0;
        this.guard--;
      } else if (
        (this.options.artifacts ?? []).includes("shell-shield") &&
        !this.shellUsed
      ) {
        damage = 0;
        this.shellUsed = true;
      }
    }
    target.health = Math.max(0, target.health - damage);
    if (damage) target.hitAt = this.time;
    if (shot.team === "player") this.boost = 0;
    this.events.push({
      type: "impact",
      x: position.x,
      y: position.y,
      damage,
      team: shot.team,
      target: target.team,
      id: shot.id,
    });
    this.world.removeRigidBody(shot.body);
    this.projectile = null;
    if (this.enemy.health <= 0 || this.player.health <= 0) {
      this.outcome = this.enemy.health <= 0 ? "won" : "lost";
      this.nextPhase("finished");
      this.events.push({ type: this.outcome });
    } else this.nextPhase(shot.team === "player" ? "enemy-tell" : "settle");
  }
  trajectory() {
    if (this.disposed) return [];
    const origin = this.origin();
    const key = `${origin.x.toFixed(2)}:${origin.y.toFixed(2)}:${this.angle}:${this.power}:${this.facing}`;
    if (this.trajectoryCache?.key === key) return this.trajectoryCache.points;
    // Use a small isolated Rapier world, not a different analytical approximation.
    const w = new R.World({ x: 0, y: GRAVITY, z: 0 });
    w.timestep = STEP;
    const q = new R.EventQueue(true);
    addTerrain(R, w, this.arena);
    const enemy = this.enemy.body.translation();
    w.createCollider(
      R.ColliderDesc.cuboid(0.32, 0.55, 0.32).setTranslation(
        enemy.x,
        enemy.y,
        0,
      ),
    );
    const body = w.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(origin.x, origin.y, 0)
        .setCcdEnabled(true),
    );
    w.createCollider(
      R.ColliderDesc.ball(0.14)
        .setRestitution(0)
        .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS),
      body,
    );
    body.setLinvel(launchVelocity(this.angle, this.power, this.facing), true);
    const points = [{ ...origin }];
    try {
      for (let i = 0; i < 180; i++) {
        w.step(q);
        let hit = false;
        q.drainCollisionEvents((a, b, started) => {
          if (started) hit = true;
        });
        const p = body.translation();
        points.push({ x: p.x, y: p.y, z: 0 });
        if (hit || p.y < -1 || Math.abs(p.x) > 8) break;
      }
    } finally {
      q.free();
      w.free();
    }
    this.trajectoryCache = { key, points };
    return points;
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
      projectile: this.projectile
        ? {
            id: this.projectile.id,
            team: this.projectile.team,
            ...this.projectile.body.translation(),
          }
        : null,
      outcome: this.outcome,
    };
  }
  drainEvents() {
    return this.events.splice(0);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.queue.free();
    this.world.free();
    this.events.length = 0;
  }
}
