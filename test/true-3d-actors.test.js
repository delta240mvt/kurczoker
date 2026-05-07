import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";

const battleActorSource = readFileSync("src/engine/components/BattleActor.jsx", "utf8");

test("battle actors use true mesh GLBs instead of screenshot-derived cards", () => {
  assert.match(battleActorSource, /true-3d-characters\/true-hero-chicken\.glb/);
  assert.match(battleActorSource, /true-3d-characters\/true-enemy-rooster\.glb/);
  assert.match(battleActorSource, /true-3d-characters\/true-boss-rooster\.glb/);
  assert.doesNotMatch(battleActorSource, /hyper3d-clean-characters\/clean-hero-chicken\.glb/);
  assert.match(battleActorSource, /<ModelAsset[^>]+rotation=\{\[-Math\.PI \/ 2,\s*0,\s*0\]\}/s);
});

test("true actor GLBs exist and are generated assets", () => {
  for (const file of [
    "public/game/assets/models/true-3d-characters/true-hero-chicken.glb",
    "public/game/assets/models/true-3d-characters/true-enemy-rooster.glb",
    "public/game/assets/models/true-3d-characters/true-boss-rooster.glb"
  ]) {
    assert.ok(statSync(file).size > 10_000, `${file} should be a real generated mesh asset`);
  }
});
