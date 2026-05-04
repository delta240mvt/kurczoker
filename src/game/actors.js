export function createPlayer(overrides = {}) {
  return { id: "player", ...overrides };
}

export function createEnemy(type = "grunt", overrides = {}) {
  return { id: `enemy-${type}`, type, ...overrides };
}

export function createSummon(type = "guard-chick", ownerId = "player", overrides = {}) {
  return { id: `summon-${type}`, type, ownerId, ...overrides };
}

export function getActorBounds(actor) {
  return actor;
}
