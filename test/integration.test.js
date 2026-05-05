import test from "node:test";
import assert from "node:assert/strict";

import { BATTLE_PHASES, SCENES } from "../src/game/constants.js";
import { createEnemy, createPlayer } from "../src/game/actors.js";
import { createBattleState } from "../src/game/battle.js";
import { applyRunReward, completeCurrentNode, selectMapNode, skipShop, startRun } from "../src/game/run.js";

function winCurrentBattle(state) {
  return {
    ...state,
    battle: {
      ...state.battle,
      phase: BATTLE_PHASES.WON,
      actors: [createPlayer(), createEnemy("grunt", { health: 0 })]
    }
  };
}

test("a full run can progress from map through rewards to boss completion", () => {
  let state = startRun(1);

  while (state.scene !== SCENES.RUN_COMPLETE) {
    assert.notEqual(state.scene, SCENES.GAME_OVER);

    if (state.scene === SCENES.MAP) {
      const nextNodeId = state.run.offeredNodeIds[0];
      assert.ok(nextNodeId, "map should offer a next node");
      state = selectMapNode(state, nextNodeId);
    }

    if (state.scene === SCENES.BATTLE) {
      state = {
        ...state,
        battle: createBattleState({
          ...state.battle,
          actors: [createPlayer(), createEnemy("grunt")]
        })
      };
      state = completeCurrentNode(winCurrentBattle(state));
    }

    if (state.scene === SCENES.REWARD) {
      state = applyRunReward(state, state.rewardChoices[0]);
    }
  }

  assert.equal(state.run.completed, true);
  assert.equal(state.run.currentNodeId, "boss");
});

test("a full run can progress through an unaffordable shop by skipping it", () => {
  let state = startRun(1);
  state = selectMapNode(state, state.run.offeredNodeIds[0]);
  state = {
    ...state,
    battle: createBattleState({
      ...state.battle,
      actors: [createPlayer(), createEnemy("grunt")]
    })
  };
  state = completeCurrentNode(winCurrentBattle(state));
  state = applyRunReward(state, state.rewardChoices[0]);

  assert.ok(state.run.offeredNodeIds.includes("shop-1"));
  state = { ...state, run: { ...state.run, gold: 0 } };
  state = selectMapNode(state, "shop-1");

  assert.equal(state.scene, SCENES.SHOP);

  state = skipShop(state);

  assert.equal(state.scene, SCENES.MAP);
  assert.ok(state.run.completedNodeIds.includes("shop-1"));
  assert.ok(state.run.offeredNodeIds.length > 0);
});
