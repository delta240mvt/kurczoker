import assert from "node:assert/strict";
import test from "node:test";
import { createEngineStore } from "../src/engine/store/useGameStore.js";
import { createBattleState } from "../src/game/battle.js";
import { createEnemy, createPlayer } from "../src/game/actors.js";
import { BATTLE_PHASES, SCENES } from "../src/game/constants.js";

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

test("engine store reset advances from the active state seed", () => {
  const store = createEngineStore(1);

  store.getState().reset();
  const firstReset = store.getState().game;
  store.getState().reset();
  const secondReset = store.getState().game;

  assert.equal(firstReset.seed, 2);
  assert.equal(secondReset.seed, 3);
  assert.equal(secondReset.scene, SCENES.MAP);
  assert.equal(secondReset.ui.message, "Nowa wyprawa gotowa.");
});

test("engine store applies battle projectile events through domain helpers", () => {
  const store = createEngineStore(1);
  store.setState({
    game: {
      ...store.getState().game,
      scene: SCENES.BATTLE,
      battle: createBattleState({ actors: [createPlayer(), createEnemy("grunt", { id: "enemy-1" })] }),
      ui: { message: "" }
    }
  });

  store.getState().projectileHitEnemy({ actorId: "enemy-1", damage: 1 });
  const damagedEnemy = store.getState().game.battle.actors.find((actor) => actor.id === "enemy-1");
  assert.equal(damagedEnemy.health, 1);

  store.getState().turnEnded();
  assert.equal(store.getState().game.battle.phase, BATTLE_PHASES.ENEMY_TURN);
});
