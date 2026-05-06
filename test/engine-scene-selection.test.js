import assert from "node:assert/strict";
import test from "node:test";
import { selectEngineScene } from "../src/engine/runtime/sceneSelection.js";
import { SCENES } from "../src/game/constants.js";

test("selectEngineScene maps domain scenes to engine scenes", () => {
  assert.equal(selectEngineScene({ scene: SCENES.MAP }), "map");
  assert.equal(selectEngineScene({ scene: SCENES.BATTLE }), "battle");
  assert.equal(selectEngineScene({ scene: SCENES.REWARD }), "reward");
  assert.equal(selectEngineScene({ scene: SCENES.SHOP }), "reward");
  assert.equal(selectEngineScene({ scene: SCENES.GAME_OVER }), "end");
  assert.equal(selectEngineScene({ scene: SCENES.RUN_COMPLETE }), "end");
});
