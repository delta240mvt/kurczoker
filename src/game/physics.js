export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rectsOverlap() {
  return false;
}

export function circleHitsRect() {
  return false;
}

export function stepProjectile(projectile) {
  return projectile;
}

export function resolveExplosion(actors) {
  return actors;
}
