import { ACTOR_KINDS, ACTOR_TEAMS } from "./constants.js";

export function createPlayer(overrides = {}) {
  return {
    id: "player",
    kind: ACTOR_KINDS.PLAYER,
    team: ACTOR_TEAMS.PLAYER,
    x: 96,
    y: 376,
    vx: 0,
    vy: 0,
    width: 44,
    height: 54,
    health: 3,
    maxHealth: 3,
    ttl: Number.POSITIVE_INFINITY,
    ...overrides
  };
}

export function createEnemy(type = "grunt", overrides = {}) {
  const healthByType = {
    grunt: 2,
    snail: 2,
    elite: 4,
    boss: 7
  };
  const health = healthByType[type] ?? healthByType.grunt;

  return {
    id: `enemy-${type}`,
    kind: ACTOR_KINDS.ENEMY,
    team: ACTOR_TEAMS.ENEMY,
    type,
    x: 760,
    y: 380,
    vx: 0,
    vy: 0,
    width: 44,
    height: 50,
    health,
    maxHealth: health,
    ttl: Number.POSITIVE_INFINITY,
    ...overrides
  };
}

export function createSummon(type = "guard-chick", ownerId = "player", overrides = {}) {
  return {
    id: `summon-${type}`,
    kind: ACTOR_KINDS.SUMMON,
    team: ACTOR_TEAMS.PLAYER,
    type,
    ownerId,
    x: 152,
    y: 396,
    vx: 0,
    vy: 0,
    width: 32,
    height: 34,
    health: 1,
    maxHealth: 1,
    ttl: 3,
    ...overrides
  };
}

export function getActorBounds(actor) {
  const x = actor.x ?? 0;
  const y = actor.y ?? 0;
  const width = actor.width ?? 0;
  const height = actor.height ?? 0;

  return {
    x,
    y,
    width,
    height,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height
  };
}
