import { ABILITY_IDS, ACTOR_KINDS, ACTOR_TEAMS, ARTIFACT_IDS, BATTLE_PHASES, CANVAS, TUNING } from "./constants.js";
import { circleHitsRect, clamp, rectsOverlap, resolveExplosion, stepProjectile } from "./physics.js";

const DEFAULT_WIDTH = CANVAS.WIDTH;
const DEFAULT_PLAYER_DAMAGE = 1;
const DEFAULT_ENEMY_DAMAGE = 1;
const DEFAULT_SUMMON_TTL = 2500;

function cloneActor(actor) {
  return { vx: 0, vy: 0, ttl: 0, ...actor };
}

function living(actor) {
  return (actor.health ?? 0) > 0;
}

function playerActor(actors) {
  return actors.find((actor) => actor.kind === ACTOR_KINDS.PLAYER || actor.id === "player");
}

function firstLivingEnemy(actors) {
  return actors.find((actor) => actor.team === ACTOR_TEAMS.ENEMY && living(actor));
}

function firstLivingTargetForEnemy(actors) {
  return (
    actors.find((actor) => actor.kind === ACTOR_KINDS.SUMMON && actor.team === ACTOR_TEAMS.PLAYER && living(actor)) ??
    playerActor(actors)
  );
}

function actorBounds(actor) {
  return { x: actor.x, y: actor.y, width: actor.width, height: actor.height };
}

function abilityDamageBonus(battle, ability) {
  if (ability.id === ABILITY_IDS.EGG_BOMB) {
    return battle.eggBombDamageBonus ?? 0;
  }

  return 0;
}

function summonTtlMs(ability) {
  if (Number.isFinite(ability.summonTtl)) {
    return ability.summonTtl * 1000;
  }

  return ability.ttl ?? DEFAULT_SUMMON_TTL;
}

function shieldBlocksProjectile(battle, actors, projectile, impact) {
  if (projectile.team !== ACTOR_TEAMS.ENEMY || (battle.usedArtifacts ?? []).includes(ARTIFACT_IDS.SHELL_SHIELD)) {
    return false;
  }

  const player = playerActor(actors);
  if (!player || !(battle.artifacts ?? []).includes(ARTIFACT_IDS.SHELL_SHIELD)) {
    return false;
  }

  return circleHitsRect(
    { x: impact.x, y: impact.y, radius: projectile.explosionRadius ?? projectile.radius ?? 0 },
    actorBounds(player)
  );
}

function enemyProjectileVelocity(enemy, target, battle) {
  const start = {
    x: enemy.x + enemy.width / 2,
    y: enemy.y + enemy.height / 2
  };
  const end = {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2
  };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const gravity = battle.gravity ?? TUNING.GRAVITY;
  const flightTime = clamp(Math.abs(dx) / 0.9, 80, 950);

  return {
    start,
    vx: dx / flightTime,
    vy: (dy - 0.5 * gravity * flightTime * flightTime) / flightTime
  };
}

function withTerminalPhase(battle) {
  if (isBattleLost(battle)) {
    return { ...battle, phase: BATTLE_PHASES.LOST };
  }

  if (isBattleWon(battle)) {
    return { ...battle, phase: BATTLE_PHASES.WON };
  }

  return battle;
}

function updateActorsForWorld(battle, input, delta) {
  const gravity = battle.gravity ?? TUNING.GRAVITY;
  const groundY = battle.groundY ?? CANVAS.GROUND_Y;
  const platforms = battle.platforms ?? [];
  const hazards = battle.hazards ?? [];

  return battle.actors
    .map((actor) => {
      let next = { ...actor };

      if (next.kind === ACTOR_KINDS.SUMMON) {
        next.ttl = (next.ttl ?? 0) - delta;
      }

      if (next.kind === ACTOR_KINDS.PLAYER && battle.phase === BATTLE_PHASES.PLAYER_TURN) {
        const speed = battle.playerSpeed ?? TUNING.PLAYER_SPEED;
        next.vx = (input.moveX ?? 0) * speed;
        if (input.jump && Math.abs(next.vy ?? 0) < 0.001) {
          next.vy = TUNING.JUMP_VELOCITY;
        }
      }

      next.x += (next.vx ?? 0) * delta;
      next.y += (next.vy ?? 0) * delta;
      next.vy = (next.vy ?? 0) + gravity * delta;
      next.x = clamp(next.x, 0, (battle.width ?? DEFAULT_WIDTH) - next.width);

      if (next.y + next.height >= groundY) {
        next.y = groundY - next.height;
        next.vy = 0;
      }

      for (const platform of platforms) {
        if (rectsOverlap(actorBounds(next), platform) && actor.y + actor.height <= platform.y) {
          next.y = platform.y - next.height;
          next.vy = 0;
          break;
        }
      }

      for (const hazard of hazards) {
        if (rectsOverlap(actorBounds(next), hazard)) {
          next.health = clamp((next.health ?? 0) - (hazard.damage ?? 0), 0, next.maxHealth ?? next.health ?? 0);
        }
      }

      return next;
    })
    .filter((actor) => actor.kind !== ACTOR_KINDS.SUMMON || (actor.ttl ?? 0) > 0);
}

function updateProjectilePhase(battle, delta) {
  let actors = battle.actors;
  const projectiles = [];
  let resolvedTeam = null;

  for (const projectile of battle.projectiles) {
    const world = {
      gravity: battle.gravity ?? TUNING.GRAVITY,
      groundY: battle.groundY ?? CANVAS.GROUND_Y,
      platforms: projectile.ignorePlatforms ? [] : battle.platforms,
      hazards: battle.hazards
    };
    const nextProjectile = stepProjectile(projectile, delta, world);
    const projectileArea = {
      x: nextProjectile.x - (nextProjectile.explosionRadius ?? nextProjectile.radius ?? 0),
      y: nextProjectile.y - (nextProjectile.explosionRadius ?? nextProjectile.radius ?? 0),
      width: (nextProjectile.explosionRadius ?? nextProjectile.radius ?? 0) * 2,
      height: (nextProjectile.explosionRadius ?? nextProjectile.radius ?? 0) * 2
    };
    const preferredTarget = projectile.targetId
      ? actors.find((actor) => actor.id === projectile.targetId && living(actor) && rectsOverlap(actorBounds(actor), projectileArea))
      : null;
    const hitActor =
      preferredTarget ??
      actors.find((actor) => actor.team !== projectile.team && living(actor) && rectsOverlap(actorBounds(actor), projectileArea));

    if (!nextProjectile.active || hitActor) {
      resolvedTeam = projectile.team;
      if (shieldBlocksProjectile(battle, actors, projectile, nextProjectile)) {
        battle = {
          ...battle,
          usedArtifacts: [...(battle.usedArtifacts ?? []), ARTIFACT_IDS.SHELL_SHIELD]
        };
      } else if (projectile.blockedBySummon && hitActor?.kind === ACTOR_KINDS.SUMMON) {
        actors = actors.map((actor) => {
          if (actor.id !== hitActor.id) return actor;
          return {
            ...actor,
            health: clamp((actor.health ?? 0) - (projectile.damage ?? DEFAULT_ENEMY_DAMAGE), 0, actor.maxHealth ?? actor.health ?? 0)
          };
        });
      } else {
        const damageReduction = projectile.team === ACTOR_TEAMS.ENEMY ? battle.damageReduction ?? 0 : 0;
        actors = resolveExplosion(actors, {
          x: nextProjectile.x,
          y: nextProjectile.y,
          radius: projectile.explosionRadius ?? projectile.radius ?? 0,
          damage: Math.max(0, (projectile.damage ?? DEFAULT_PLAYER_DAMAGE) - damageReduction),
          knockback: projectile.knockback ?? 0
        });
      }
    } else {
      projectiles.push(nextProjectile);
    }
  }

  if (projectiles.length === 0 && resolvedTeam === ACTOR_TEAMS.ENEMY) {
    return withTerminalPhase({
      ...battle,
      actors,
      projectiles,
      phase: BATTLE_PHASES.PLAYER_TURN,
      turnTimeRemainingMs: battle.turnDurationMs,
      actionFired: false,
      turnNumber: battle.turnNumber + 1
    });
  }

  return {
    ...battle,
    actors,
    projectiles,
    phase: projectiles.length > 0 ? BATTLE_PHASES.PROJECTILE : BATTLE_PHASES.ENEMY_TURN
  };
}

export function createBattleState(config = {}) {
  return withTerminalPhase({
    encounterId: config.encounterId ?? "battle",
    actors: (config.actors ?? []).map(cloneActor),
    platforms: [...(config.platforms ?? [])],
    hazards: [...(config.hazards ?? [])],
    artifacts: [...(config.artifacts ?? [])],
    usedArtifacts: [...(config.usedArtifacts ?? [])],
    projectiles: [...(config.projectiles ?? [])],
    phase: config.phase ?? BATTLE_PHASES.PLAYER_TURN,
    turnDurationMs: config.turnDurationMs ?? TUNING.PLAYER_TURN_MS,
    turnTimeRemainingMs: config.turnTimeRemainingMs ?? config.turnDurationMs ?? TUNING.PLAYER_TURN_MS,
    actionFired: config.actionFired ?? false,
    turnNumber: config.turnNumber ?? 1,
    gravity: config.gravity ?? TUNING.GRAVITY,
    groundY: config.groundY ?? CANVAS.GROUND_Y,
    width: config.width ?? DEFAULT_WIDTH,
    playerSpeed: config.playerSpeed ?? TUNING.PLAYER_SPEED,
    eggBombDamageBonus: config.eggBombDamageBonus ?? 0,
    damageReduction: config.damageReduction ?? 0
  });
}

export function updateBattle(battle, input = {}, delta = 16) {
  if ([BATTLE_PHASES.WON, BATTLE_PHASES.LOST].includes(battle.phase)) {
    return battle;
  }

  let next = {
    ...battle,
    actors: updateActorsForWorld(battle, input, delta)
  };

  next = withTerminalPhase(next);
  if ([BATTLE_PHASES.WON, BATTLE_PHASES.LOST].includes(next.phase)) {
    return next;
  }

  if (next.phase === BATTLE_PHASES.PROJECTILE) {
    return withTerminalPhase(updateProjectilePhase(next, delta));
  }

  if (next.phase === BATTLE_PHASES.PLAYER_TURN) {
    if (input.firePressed) {
      return firePlayerAbility(next, input.ability ?? { id: input.selectedAbilityId ?? ABILITY_IDS.EGG_BOMB }, input.aim);
    }

    const remaining = Math.max(0, (next.turnTimeRemainingMs ?? next.turnDurationMs) - delta);
    return {
      ...next,
      turnTimeRemainingMs: remaining,
      phase: remaining === 0 ? BATTLE_PHASES.ENEMY_TURN : BATTLE_PHASES.PLAYER_TURN
    };
  }

  if (next.phase === BATTLE_PHASES.ENEMY_TURN) {
    return resolveEnemyTurn(next);
  }

  return next;
}

export function firePlayerAbility(battle, ability = {}, aim = { x: 1, y: 0 }) {
  if (battle.phase !== BATTLE_PHASES.PLAYER_TURN || battle.actionFired) {
    return battle;
  }

  const player = playerActor(battle.actors);
  if (!player || !living(player)) {
    return battle;
  }

  if (ability.kind === "summon" || ability.id === ABILITY_IDS.GUARD_CHICK) {
    const summon = {
      id: `summon-${battle.turnNumber}`,
      kind: ACTOR_KINDS.SUMMON,
      team: ACTOR_TEAMS.PLAYER,
      ownerId: player.id,
      x: clamp(player.x + player.width + 4, 0, (battle.width ?? DEFAULT_WIDTH) - 10),
      y: player.y,
      vx: 0,
      vy: 0,
      width: 10,
      height: 10,
      health: ability.health ?? 1,
      maxHealth: ability.health ?? 1,
      ttl: summonTtlMs(ability)
    };

    return {
      ...battle,
      actors: [...battle.actors, summon],
      actionFired: true,
      phase: BATTLE_PHASES.ENEMY_TURN
    };
  }

  if (ability.kind === "movement" || ability.id === ABILITY_IDS.CREST_JUMP) {
    return {
      ...battle,
      actors: battle.actors.map((actor) => {
        if (actor.id !== player.id) return actor;
        return {
          ...actor,
          vx: (actor.vx ?? 0) + (aim?.x >= 0 ? 0.34 : -0.34),
          vy: ability.impulse ?? TUNING.JUMP_VELOCITY
        };
      }),
      actionFired: true,
      phase: BATTLE_PHASES.ENEMY_TURN
    };
  }

  if (ability.kind === "buff" || ability.id === ABILITY_IDS.MANA_GRAIN) {
    return {
      ...battle,
      actors: battle.actors.map((actor) => {
        if (actor.id !== player.id) return actor;
        return {
          ...actor,
          health: clamp((actor.health ?? 0) + 1, 0, actor.maxHealth ?? actor.health ?? 0)
        };
      }),
      actionFired: true,
      phase: BATTLE_PHASES.ENEMY_TURN,
      buffs: [...(battle.buffs ?? []), { id: ABILITY_IDS.MANA_GRAIN, turns: 1 }]
    };
  }

  const length = Math.hypot(aim?.x ?? 1, aim?.y ?? 0) || 1;
  const speed = ability.speed ?? TUNING.PROJECTILE_SPEED;
  const manaBuff = (battle.buffs ?? []).find((buff) => buff.id === ABILITY_IDS.MANA_GRAIN);
  const damageBonus = (manaBuff ? 1 : 0) + abilityDamageBonus(battle, ability);
  const radiusBonus = manaBuff ? 10 : 0;
  const projectile = {
    id: `projectile-${battle.turnNumber}`,
    team: ACTOR_TEAMS.PLAYER,
    x: player.x + player.width,
    y: player.y + player.height / 2,
    vx: ((aim?.x ?? 1) / length) * speed,
    vy: ((aim?.y ?? 0) / length) * speed,
    radius: 4,
    explosionRadius: (ability.radius ?? 18) + radiusBonus,
    damage: (ability.damage ?? DEFAULT_PLAYER_DAMAGE) + damageBonus,
    knockback: ability.knockback ?? 1,
    active: true
  };

  return {
    ...battle,
    buffs: (battle.buffs ?? []).filter((buff) => buff.id !== ABILITY_IDS.MANA_GRAIN),
    actionFired: true,
    phase: BATTLE_PHASES.PROJECTILE,
    projectiles: [...(battle.projectiles ?? []), projectile]
  };
}

export function resolveEnemyTurn(battle) {
  const enemy = firstLivingEnemy(battle.actors);
  const target = firstLivingTargetForEnemy(battle.actors);

  if (!enemy || !target || !living(target)) {
    return withTerminalPhase(battle);
  }

  const velocity = enemyProjectileVelocity(enemy, target, battle);
  return {
    ...battle,
    phase: BATTLE_PHASES.PROJECTILE,
    actionFired: true,
    projectiles: [
      ...(battle.projectiles ?? []),
      {
        id: `enemy-projectile-${battle.turnNumber}`,
        team: ACTOR_TEAMS.ENEMY,
        targetId: target.id,
        blockedBySummon: target.kind === ACTOR_KINDS.SUMMON,
        x: velocity.start.x,
        y: velocity.start.y,
        vx: velocity.vx,
        vy: velocity.vy,
        radius: 4,
        ignorePlatforms: true,
        explosionRadius: target.kind === ACTOR_KINDS.SUMMON ? 6 : 22,
        damage: enemy.damage ?? DEFAULT_ENEMY_DAMAGE,
        knockback: 0.7,
        active: true
      }
    ]
  };
}

export function applyDamageToActor(battle, actorId, damage, options = {}) {
  const target = battle.actors.find((actor) => actor.id === actorId);
  const shieldAvailable =
    target?.kind === ACTOR_KINDS.PLAYER &&
    options.sourceTeam === ACTOR_TEAMS.ENEMY &&
    (battle.artifacts ?? []).includes(ARTIFACT_IDS.SHELL_SHIELD) &&
    !(battle.usedArtifacts ?? []).includes(ARTIFACT_IDS.SHELL_SHIELD);

  if (shieldAvailable) {
    return {
      ...battle,
      usedArtifacts: [...(battle.usedArtifacts ?? []), ARTIFACT_IDS.SHELL_SHIELD]
    };
  }

  return withTerminalPhase({
    ...battle,
    actors: battle.actors.map((actor) => {
      if (actor.id !== actorId) {
        return actor;
      }

      return {
        ...actor,
        health: clamp((actor.health ?? 0) - damage, 0, actor.maxHealth ?? actor.health ?? 0)
      };
    })
  });
}

export function isBattleWon(battle) {
  const enemies = battle.actors.filter((actor) => actor.team === ACTOR_TEAMS.ENEMY);
  return enemies.length > 0 && enemies.every((actor) => !living(actor));
}

export function isBattleLost(battle) {
  const player = playerActor(battle.actors);
  return !player || !living(player);
}
