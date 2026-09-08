import test from "node:test";
import assert from "node:assert/strict";
const { createBattleSimulation } = await import(
  "../src/engine/tactical/simulation.js"
).catch(() => ({}));

async function battle(options = {}) {
  assert.equal(
    typeof createBattleSimulation,
    "function",
    "real battle runtime must exist",
  );
  return createBattleSimulation({ health: 6, maxHealth: 6, ...options });
}
function advance(sim, seconds) {
  for (let i = 0; i < seconds * 60; i++) sim.advance(1 / 60);
}

test("aiming left changes launch direction and the same preview without phantom damage", async () => {
  const sim = await battle();
  try {
    sim.aim(40, 9, -1);
    const origin = sim.origin(),
      points = sim.trajectory();
    assert.ok(points[10].x < origin.x);
    sim.fire();
    advance(sim, 0.2);
    assert.ok(sim.snapshot().projectile.x < origin.x);
    advance(sim, 5);
    assert.equal(sim.enemy.health, 2);
  } finally {
    sim.dispose();
  }
});

test("a real egg follows its preview and can only spend one action", async () => {
  const sim = await battle();
  try {
    sim.aim(45, 10);
    const predicted = sim.trajectory();
    assert.ok(predicted.length > 20);
    assert.equal(sim.fire("egg-bomb"), true);
    assert.equal(sim.fire("egg-bomb"), false);
    advance(sim, 0.25);
    const actual = sim.snapshot().projectile;
    assert.ok(actual, "egg must remain in flight long enough to see");
    assert.ok(Math.abs(actual.x - predicted[15].x) < 0.08);
    assert.ok(Math.abs(actual.y - predicted[15].y) < 0.08);
    assert.ok(actual.x < -1, "launch must not cross the arena in one frame");
  } finally {
    sim.dispose();
  }
});

test("a miss does not damage an enemy and its answer is a visible projectile", async () => {
  const sim = await battle();
  try {
    sim.aim(80, 6);
    sim.fire("egg-bomb");
    let enemyShot = false;
    for (let i = 0; i < 600; i++) {
      sim.advance(1 / 60);
      const state = sim.snapshot();
      if (state.projectile?.team === "enemy") enemyShot = true;
      if (state.turn > 1) break;
    }
    assert.equal(sim.snapshot().enemy.health, 2);
    assert.equal(enemyShot, true);
    assert.ok(sim.snapshot().turn > 1);
  } finally {
    sim.dispose();
  }
});

test("a shot aimed through real physics can win a battle", async () => {
  const sim = await battle();
  try {
    sim.aim(40, 9);
    sim.fire("egg-bomb");
    advance(sim, 4);
    assert.equal(sim.snapshot().outcome, "won");
    const impacts = sim.drainEvents().filter((e) => e.type === "impact");
    assert.equal(impacts.length, 1);
  } finally {
    sim.dispose();
  }
});

test("pause freezes time and input, resume does not catch up a background tab", async () => {
  const sim = await battle();
  try {
    sim.setPaused(true);
    const before = sim.snapshot();
    sim.move(1);
    sim.jump();
    sim.advance(90);
    assert.equal(sim.fire("egg-bomb"), false);
    assert.deepEqual(sim.snapshot(), before);
    sim.setPaused(false);
    sim.advance(90);
    assert.ok(sim.snapshot().time < 0.3);
  } finally {
    sim.dispose();
  }
});

test("movement collides with arena bounds and jump returns to the same floor", async () => {
  const sim = await battle();
  try {
    sim.move(-1);
    advance(sim, 3);
    sim.move(0);
    assert.ok(sim.snapshot().player.x >= -6.6);
    const ground = sim.snapshot().player.y;
    sim.jump();
    advance(sim, 0.2);
    assert.ok(sim.snapshot().player.y > ground + 0.3);
    advance(sim, 2);
    assert.ok(Math.abs(sim.snapshot().player.y - ground) < 0.05);
  } finally {
    sim.dispose();
  }
});
