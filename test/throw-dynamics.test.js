import assert from "node:assert/strict";
import { test } from "node:test";
import { aimToThrow, sampleTrajectory } from "../src/engine/runtime/throwDynamics.js";

test("aimToThrow derives consistent pullback power and projectile impulse", () => {
  const weak = aimToThrow({ x: 0.75, y: 0.28 });
  const strong = aimToThrow({ x: 3.15, y: 2.15 });

  assert.equal(weak.charge, 0);
  assert.equal(strong.charge, 1);
  assert.ok(strong.power > weak.power);
  assert.ok(strong.impulse.x > weak.impulse.x);
  assert.ok(strong.impulse.y > weak.impulse.y);
  assert.deepEqual(Object.keys(strong.pullback).sort(), ["x", "y"]);
});

test("sampleTrajectory uses the same impulse that is fired", () => {
  const throwState = aimToThrow({ x: 2.4, y: 1.35 });
  const points = sampleTrajectory([1, 2, 0.2], throwState.impulse, -5.8, 6);

  assert.equal(points.length, 6);
  assert.equal(points[0][0], 1);
  assert.equal(points[0][1], 2);
  assert.ok(Math.abs(points[0][2] - 0.24) < 0.000001);
  assert.ok(points.at(-1)[0] > points[0][0]);
  assert.ok(points[2][1] > points[0][1]);
});
