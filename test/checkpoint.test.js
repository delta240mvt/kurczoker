import test from "node:test";
import assert from "node:assert/strict";
import { startRun, selectMapNode } from "../src/game/run.js";
const { encodeCheckpoint, decodeCheckpoint } = await import(
  "../src/engine/tactical/checkpoint.js"
).catch(() => ({}));
test("a safe checkpoint roundtrips and combat is not serialized", () => {
  assert.equal(typeof encodeCheckpoint, "function");
  const game = startRun(12);
  const restored = decodeCheckpoint(encodeCheckpoint(game));
  assert.equal(restored.seed, 12);
  assert.deepEqual(restored.run, game.run);
  assert.equal(encodeCheckpoint(selectMapNode(game, "battle-1")), null);
});
test("corrupt, unsupported or malformed checkpoints cannot crash startup", () => {
  assert.equal(typeof decodeCheckpoint, "function");
  for (const text of [
    "",
    "null",
    "{",
    '{"version":99}',
    JSON.stringify({ version: 1, game: { seed: 1, run: { health: -1 } } }),
  ]) {
    assert.equal(decodeCheckpoint(text), null);
  }
});
test("corrupt routes and unknown rewards are rejected rather than trapping a resumed run", () => {
  const game = startRun(2);
  const save = (g) => JSON.stringify({ version: 1, game: g });
  assert.equal(
    decodeCheckpoint(
      save({ ...game, run: { ...game.run, offeredNodeIds: [] } }),
    ),
    null,
  );
  assert.equal(decodeCheckpoint(save({ ...game, scene: "shop" })), null);
  assert.equal(
    decodeCheckpoint(
      save({ ...game, rewardChoices: [{ id: "fake", type: "artifact" }] }),
    ),
    null,
  );
});
