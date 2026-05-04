import test from "node:test";
import assert from "node:assert/strict";

import { ABILITY_IDS, SCENES, TUNING } from "../src/game/constants.js";
import { createInitialGameState, resetRun, toggleMute } from "../src/game/state.js";

test("initial game state starts on map with deterministic run defaults", () => {
  const state = createInitialGameState(42);

  assert.equal(state.scene, SCENES.MAP);
  assert.equal(state.seed, 42);
  assert.equal(state.run.currentNodeId, "start");
  assert.deepEqual(state.run.completedNodeIds, []);
  assert.equal(state.run.health, TUNING.RUN_HEALTH);
  assert.equal(state.run.maxHealth, TUNING.RUN_HEALTH);
  assert.deepEqual(state.run.abilities, [ABILITY_IDS.EGG_BOMB]);
  assert.equal(state.ui.muted, true);
  assert.equal(state.ui.selectedAbilityId, ABILITY_IDS.EGG_BOMB);
  assert.equal(state.battle, null);
  assert.deepEqual(state.rewardChoices, []);
  assert.ok(state.run.offeredNodeIds.length > 0);
});

test("toggleMute flips the default muted state without changing run data", () => {
  const state = createInitialGameState(7);
  const next = toggleMute(state);

  assert.equal(next.ui.muted, false);
  assert.equal(next.run, state.run);
});

test("resetRun starts a fresh deterministic run with the next seed by default", () => {
  const state = createInitialGameState(3);
  const restarted = resetRun({
    ...state,
    run: {
      ...state.run,
      health: 1,
      completedNodeIds: ["start", "battle-1"],
      abilities: [ABILITY_IDS.EGG_BOMB, ABILITY_IDS.CREST_JUMP]
    }
  });

  assert.equal(restarted.seed, 4);
  assert.equal(restarted.scene, SCENES.MAP);
  assert.equal(restarted.run.health, TUNING.RUN_HEALTH);
  assert.deepEqual(restarted.run.completedNodeIds, []);
  assert.deepEqual(restarted.run.abilities, [ABILITY_IDS.EGG_BOMB]);
  assert.notDeepEqual(restarted.map, state.map);
});
