import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const gameRuntimeSource = readFileSync("src/engine/GameRuntime.jsx", "utf8");
const mapSceneSource = readFileSync("src/engine/scenes/MapScene.jsx", "utf8");
const battleSceneSource = readFileSync("src/engine/scenes/BattleScene.jsx", "utf8");

test("runtime game canvas does not render screenshot backdrops", () => {
  assert.equal(gameRuntimeSource.includes("SceneCanvasBackdrop"), false);
  assert.equal(gameRuntimeSource.includes("/uix/canvas/"), false);
});

test("map and battle scenes mount GLB world models", () => {
  assert.match(mapSceneSource, /ModelAsset/);
  assert.match(mapSceneSource, /hyper3d-clean/);
  assert.match(mapSceneSource, /clean-world-terrain\.glb/);
  assert.match(mapSceneSource, /clean-castle\.glb/);
  assert.match(battleSceneSource, /ModelAsset/);
  assert.match(battleSceneSource, /hyper3d-clean/);
  assert.match(battleSceneSource, /clean-battle-arena\.glb/);
  assert.match(battleSceneSource, /clean-platform\.glb/);
});
