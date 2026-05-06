import assert from "node:assert/strict";
import test from "node:test";
import { createEngineStore } from "../src/engine/store/useGameStore.js";
import { createBattleState } from "../src/game/battle.js";
import { createEnemy, createPlayer } from "../src/game/actors.js";
import { BATTLE_PHASES, SCENES } from "../src/game/constants.js";
import { completeCurrentNode } from "../src/game/run.js";

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

test("engine store applies reward and returns to map", () => {
  const store = createEngineStore(1);
  const nodeId = store.getState().game.run.offeredNodeIds[0];

  store.getState().selectNode(nodeId);
  store.setState({ game: completeCurrentNode(store.getState().game) });
  const reward = store.getState().game.rewardChoices[0];
  store.getState().chooseReward(reward.id);

  assert.equal(store.getState().game.scene, SCENES.MAP);
  assert.deepEqual(store.getState().game.rewardChoices, []);
});

test("engine store applies battle projectile hits and hands off surviving enemy turns", () => {
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
  assert.equal(store.getState().game.battle.phase, BATTLE_PHASES.ENEMY_TURN);
});

test("engine store advances lethal battle hits into reward scene", () => {
  const store = createEngineStore(1);
  const nodeId = store.getState().game.run.offeredNodeIds[0];
  store.getState().selectNode(nodeId);
  store.setState({
    game: {
      ...store.getState().game,
      battle: createBattleState({ actors: [createPlayer(), createEnemy("grunt", { id: "enemy-1", health: 1, maxHealth: 1 })] })
    }
  });

  store.getState().projectileHitEnemy({ actorId: "enemy-1", damage: 1 });

  assert.equal(store.getState().game.scene, SCENES.REWARD);
  assert.ok(store.getState().game.rewardChoices.length > 0);
});
