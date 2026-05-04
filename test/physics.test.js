import test from "node:test";
import assert from "node:assert/strict";

import {
  clamp,
  circleHitsRect,
  rectsOverlap,
  resolveExplosion,
  stepProjectile
} from "../src/game/physics.js";

test("clamp keeps values inside inclusive bounds", () => {
  assert.equal(clamp(-4, 0, 10), 0);
  assert.equal(clamp(14, 0, 10), 10);
  assert.equal(clamp(6, 0, 10), 6);
});

test("rectsOverlap detects intersecting rectangles and ignores touching edges", () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 9, y: 9, width: 4, height: 4 }), true);
  assert.equal(rectsOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 4, height: 4 }), false);
});

test("circleHitsRect detects explosion radius against a rectangle", () => {
  assert.equal(circleHitsRect({ x: 8, y: 5, radius: 4 }, { x: 10, y: 2, width: 8, height: 8 }), true);
  assert.equal(circleHitsRect({ x: 0, y: 0, radius: 3 }, { x: 10, y: 10, width: 8, height: 8 }), false);
});

test("stepProjectile advances with gravity until it collides with ground", () => {
  const next = stepProjectile(
    { x: 10, y: 10, vx: 2, vy: 1, radius: 3 },
    10,
    { gravity: 0.5, groundY: 100 }
  );

  assert.deepEqual(
    { x: next.x, y: next.y, vx: next.vx, vy: next.vy, active: next.active, collision: next.collision },
    { x: 30, y: 20, vx: 2, vy: 6, active: true, collision: null }
  );

  const grounded = stepProjectile(
    { x: 10, y: 95, vx: 1, vy: 2, radius: 4 },
    10,
    { gravity: 0.5, groundY: 100 }
  );

  assert.equal(grounded.active, false);
  assert.equal(grounded.collision.type, "ground");
  assert.equal(grounded.y, 96);
});

test("stepProjectile resolves platform collision and hazard overlap", () => {
  const platformHit = stepProjectile(
    { x: 10, y: 20, vx: 3, vy: 0, radius: 4 },
    10,
    { gravity: 0, groundY: 200, platforms: [{ id: "ledge", x: 35, y: 18, width: 20, height: 10 }] }
  );

  assert.equal(platformHit.active, false);
  assert.deepEqual(platformHit.collision, { type: "platform", id: "ledge" });

  const hazardHit = stepProjectile(
    { x: 10, y: 20, vx: 3, vy: 0, radius: 4 },
    10,
    { gravity: 0, groundY: 200, hazards: [{ id: "fire", x: 35, y: 18, width: 20, height: 10 }] }
  );

  assert.equal(hazardHit.active, false);
  assert.deepEqual(hazardHit.collision, { type: "hazard", id: "fire" });
});

test("resolveExplosion damages actors in radius and applies directional knockback", () => {
  const actors = [
    { id: "near", x: 12, y: 10, width: 10, height: 10, health: 5, vx: 0, vy: 0 },
    { id: "far", x: 80, y: 80, width: 10, height: 10, health: 5, vx: 0, vy: 0 }
  ];

  const next = resolveExplosion(actors, { x: 10, y: 10, radius: 20, damage: 2, knockback: 3 });

  assert.equal(next[0].health, 3);
  assert.ok(next[0].vx > 0);
  assert.ok(next[0].vy >= 0);
  assert.deepEqual(next[1], actors[1]);
});
