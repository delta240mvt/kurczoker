import assert from "node:assert/strict";
import test from "node:test";
import { createEngineStore } from "../src/engine/store/useGameStore.js";
import { SCENES } from "../src/game/constants.js";

test("engine store starts from existing run state and exposes map scene", () => {
  const store = createEngineStore(1);

  assert.equal(store.getState().game.scene, SCENES.MAP);
  assert.ok(store.getState().game.map.nodes.length > 0);
});

test("engine store selects an offered node into a playable scene", () => {
  const store = createEngineStore(1);
  const nodeId = store.getState().game.run.offeredNodeIds[0];

  store.getState().selectNode(nodeId);

  assert.ok([SCENES.BATTLE, SCENES.REWARD, SCENES.SHOP].includes(store.getState().game.scene));
});
