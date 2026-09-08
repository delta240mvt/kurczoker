import test from "node:test";
import assert from "node:assert/strict";
import { createEngineStore } from "../src/engine/store/useGameStore.js";

test("the physics outcome persists HP and rejects a stale duplicate", () => {
  const store = createEngineStore();
  store.getState().selectNode("battle-1");
  const id = store.getState().game.battle.encounterId;
  assert.equal(typeof store.getState().finishEncounter, "function");
  store.getState().finishEncounter({ encounterId: id, won: true, health: 2 });
  assert.equal(store.getState().game.scene, "reward");
  assert.equal(store.getState().game.run.health, 2);
  assert.equal(store.getState().game.run.gold, 4);
  const game = store.getState().game;
  store.getState().finishEncounter({ encounterId: id, won: false, health: 0 });
  assert.equal(store.getState().game, game);
});
test("only an owned ability can be selected", () => {
  const store = createEngineStore();
  assert.equal(typeof store.getState().selectAbility, "function");
  store.getState().selectAbility("guard-chick");
  assert.equal(store.getState().game.ui.selectedAbilityId, "egg-bomb");
  store.setState({
    game: {
      ...store.getState().game,
      run: {
        ...store.getState().game.run,
        abilities: ["egg-bomb", "guard-chick"],
      },
    },
  });
  store.getState().selectAbility("guard-chick");
  assert.equal(store.getState().game.ui.selectedAbilityId, "guard-chick");
});
