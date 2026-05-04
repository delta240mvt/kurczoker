export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function circleHitsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;

  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export function stepProjectile(projectile, delta = 16, world = {}) {
  const gravity = world.gravity ?? 0;
  const radius = projectile.radius ?? 0;
  const next = {
    ...projectile,
    x: projectile.x + projectile.vx * delta,
    y: projectile.y + projectile.vy * delta,
    vy: projectile.vy + gravity * delta,
    active: projectile.active ?? true,
    collision: null
  };

  if (world.groundY != null && next.y + radius >= world.groundY) {
    return {
      ...next,
      y: world.groundY - radius,
      active: false,
      collision: { type: "ground" }
    };
  }

  const hitPlatform = (world.platforms ?? []).find((platform) => circleHitsRect({ x: next.x, y: next.y, radius }, platform));
  if (hitPlatform) {
    return {
      ...next,
      active: false,
      collision: { type: "platform", id: hitPlatform.id }
    };
  }

  const hitHazard = (world.hazards ?? []).find((hazard) => circleHitsRect({ x: next.x, y: next.y, radius }, hazard));
  if (hitHazard) {
    return {
      ...next,
      active: false,
      collision: { type: "hazard", id: hitHazard.id }
    };
  }

  return next;
}

export function resolveExplosion(actors, explosion) {
  const damage = explosion.damage ?? 0;
  const knockback = explosion.knockback ?? 0;

  return actors.map((actor) => {
    if (!circleHitsRect(explosion, actor)) {
      return actor;
    }

    const centerX = actor.x + actor.width / 2;
    const centerY = actor.y + actor.height / 2;
    const dx = centerX - explosion.x;
    const dy = centerY - explosion.y;
    const length = Math.hypot(dx, dy) || 1;

    return {
      ...actor,
      health: clamp((actor.health ?? 0) - damage, 0, actor.maxHealth ?? actor.health ?? 0),
      vx: (actor.vx ?? 0) + (dx / length) * knockback,
      vy: (actor.vy ?? 0) + (dy / length) * knockback
    };
  });
}
