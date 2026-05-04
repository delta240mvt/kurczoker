import test from "node:test";
import assert from "node:assert/strict";

import { ABILITY_IDS, ARTIFACT_IDS, BATTLE_PHASES, NODE_TYPES, SCENES, TUNING } from "../src/game/constants.js";
import { createEnemy, createPlayer } from "../src/game/actors.js";
import { getNodeById } from "../src/game/map.js";
import {
  applyRunReward,
  completeCurrentNode,
  markRunDefeated,
  markRunComplete,
  selectMapNode,
  startRun
} from "../src/game/run.js";

function firstNodeOfType(state, type) {
  return state.map.nodes.find((node) => node.type === type && node.id !== "start");
}

test("selectMapNode moves to an offered battle node and starts battle scene", () => {
  const state = startRun(8);
  const nodeId = state.run.offeredNodeIds[0];
  const node = getNodeById(state.map, nodeId);
  const next = selectMapNode(state, nodeId);

  assert.equal(next.run.currentNodeId, nodeId);
  assert.equal(next.scene, SCENES.BATTLE);
  assert.equal(next.battle.nodeId, nodeId);
  assert.equal(next.battle.encounterId, node.payload.encounterId);
});

test("completeCurrentNode completes battle and offers reward choices", () => {
  const selected = selectMapNode(startRun(8), startRun(8).run.offeredNodeIds[0]);
  const next = completeCurrentNode(selected);

  assert.equal(next.scene, SCENES.REWARD);
  assert.equal(next.battle, null);
  assert.ok(next.run.completedNodeIds.includes(selected.run.currentNodeId));
  assert.ok(next.rewardChoices.length >= 1);
});

test("completeCurrentNode persists won battle player health into the run", () => {
  const selected = selectMapNode(startRun(8), startRun(8).run.offeredNodeIds[0]);
  const wonBattle = {
    ...selected,
    battle: {
      ...selected.battle,
      phase: BATTLE_PHASES.WON,
      actors: [createPlayer({ health: 1, maxHealth: TUNING.RUN_HEALTH }), createEnemy("grunt", { health: 0 })]
    }
  };

  const next = completeCurrentNode(wonBattle);

  assert.equal(next.run.health, 1);
});

test("heal rewards heal from persisted battle health without exceeding max health", () => {
  const selected = selectMapNode(startRun(8), startRun(8).run.offeredNodeIds[0]);
  const rewarded = completeCurrentNode({
    ...selected,
    battle: {
      ...selected.battle,
      phase: BATTLE_PHASES.WON,
      actors: [createPlayer({ health: 1, maxHealth: TUNING.RUN_HEALTH }), createEnemy("grunt", { health: 0 })]
    }
  });

  const next = applyRunReward(rewarded, {
    id: "heal-small",
    type: "heal",
    label: "Heal",
    value: 1
  });

  assert.equal(next.run.health, 2);
});

test("reward choice bonus increases playable reward choices", () => {
  const selected = selectMapNode(startRun(8), startRun(8).run.offeredNodeIds[0]);
  const boosted = {
    ...selected,
    run: {
      ...selected.run,
      stats: { rewardChoiceBonus: 1 }
    }
  };
  const next = completeCurrentNode(boosted);

  assert.equal(next.rewardChoices.length, 4);
});

test("applyRunReward adds reward and returns to map with next offered nodes", () => {
  const selected = selectMapNode(startRun(8), startRun(8).run.offeredNodeIds[0]);
  const rewarded = completeCurrentNode(selected);
  const next = applyRunReward(rewarded, {
    id: ARTIFACT_IDS.SHELL_SHIELD,
    type: "artifact",
    label: "Shell Shield",
    value: 1
  });

  assert.equal(next.scene, SCENES.MAP);
  assert.deepEqual(next.rewardChoices, []);
  assert.ok(next.run.artifacts.includes(ARTIFACT_IDS.SHELL_SHIELD));
  assert.ok(next.run.offeredNodeIds.length > 0);
});

test("applyRunReward supports ability, heal, and gold reward types", () => {
  const state = startRun(8);
  const damaged = { ...state, run: { ...state.run, health: 1 } };
  const withAbility = applyRunReward(damaged, {
    id: ABILITY_IDS.CREST_JUMP,
    type: "ability",
    label: "Crest Jump",
    value: 0
  });
  const healed = applyRunReward(withAbility, {
    id: "heal-small",
    type: "heal",
    label: "Heal",
    value: 2
  });
  const paid = applyRunReward(healed, {
    id: "gold-small",
    type: "gold",
    label: "Gold",
    value: 9
  });

  assert.ok(paid.run.abilities.includes(ABILITY_IDS.CREST_JUMP));
  assert.equal(paid.run.health, TUNING.RUN_HEALTH);
  assert.equal(paid.run.gold, 9);
});

test("boss completion marks the run complete", () => {
  const state = startRun(8);
  const boss = firstNodeOfType(state, NODE_TYPES.BOSS);
  const atBoss = {
    ...state,
    scene: SCENES.BATTLE,
    battle: { nodeId: boss.id, encounterId: boss.payload.encounterId },
    run: {
      ...state.run,
      currentNodeId: boss.id,
      offeredNodeIds: [boss.id],
      completedNodeIds: state.map.nodes
        .filter((node) => node.id !== boss.id)
        .map((node) => node.id)
    }
  };
  const next = completeCurrentNode(atBoss);

  assert.equal(next.scene, SCENES.RUN_COMPLETE);
  assert.equal(next.run.completed, true);
  assert.ok(next.run.completedNodeIds.includes("boss"));
});

test("markRunDefeated moves to game over and lowers health to zero", () => {
  const next = markRunDefeated(startRun(4));

  assert.equal(next.scene, SCENES.GAME_OVER);
  assert.equal(next.run.defeated, true);
  assert.equal(next.run.health, 0);
  assert.deepEqual(next.run.offeredNodeIds, []);
});

test("defeated runs cannot select new map nodes", () => {
  const defeated = markRunDefeated(startRun(4));
  const tampered = {
    ...defeated,
    run: {
      ...defeated.run,
      offeredNodeIds: ["battle-1"]
    }
  };

  const next = selectMapNode(tampered, "battle-1");

  assert.equal(next.scene, SCENES.GAME_OVER);
  assert.equal(next.run.defeated, true);
});

test("terminal runs ignore completion and reward lifecycle actions", () => {
  const defeated = markRunDefeated(startRun(4));
  const completed = markRunComplete(startRun(5));

  const afterDefeatedComplete = completeCurrentNode(defeated);
  const afterDefeatedReward = applyRunReward(defeated, { id: "heal-small", type: "heal", label: "Heal", value: 1 });
  const afterCompletedReward = applyRunReward(completed, { id: "gold-small", type: "gold", label: "Gold", value: 5 });

  assert.equal(afterDefeatedComplete.scene, SCENES.GAME_OVER);
  assert.equal(afterDefeatedReward.scene, SCENES.GAME_OVER);
  assert.equal(afterDefeatedReward.run.health, 0);
  assert.equal(afterCompletedReward.scene, SCENES.RUN_COMPLETE);
  assert.equal(afterCompletedReward.run.completed, true);
});

test("markRunComplete can complete the current run directly", () => {
  const next = markRunComplete(startRun(4));

  assert.equal(next.scene, SCENES.RUN_COMPLETE);
  assert.equal(next.run.completed, true);
});
