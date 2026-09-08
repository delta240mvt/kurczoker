import test from "node:test";
import assert from "node:assert/strict";
import { createBattleSimulation } from "../src/engine/tactical/simulation.js";
import { createEngineStore } from "../src/engine/store/useGameStore.js";
import { applyReward } from "../src/game/abilities.js";

function tick(sim, seconds) {
  for (let i = 0; i < seconds * 60; i++) sim.advance(1 / 60);
}
function nextTurn(sim) {
  for (let i = 0; i < 600 && sim.phase !== "player" && !sim.outcome; i++)
    sim.advance(1 / 60);
}
test("full expedition uses real shots, persists damage and reaches the boss ending", async () => {
  const store = createEngineStore(2);
  for (const id of [
    "battle-1",
    "treasure-1",
    "battle-2",
    "elite-1",
    "battle-3",
    "boss",
  ]) {
    store.getState().selectNode(id);
    let game = store.getState().game;
    if (game.scene === "battle") {
      const sim = await createBattleSimulation({
        ...game.run,
        type: game.battle.type,
        encounterId: game.battle.encounterId,
      });
      try {
        for (let turns = 0; turns < 10 && !sim.outcome; turns++) {
          sim.aim(40, 9);
          assert.equal(sim.fire(), true);
          nextTurn(sim);
        }
        assert.equal(
          sim.outcome,
          "won",
          `${id}: ${JSON.stringify(sim.snapshot())}`,
        );
        store
          .getState()
          .finishEncounter({
            encounterId: game.battle.encounterId,
            won: true,
            health: sim.player.health,
          });
      } finally {
        sim.dispose();
      }
    }
    game = store.getState().game;
    if (game.scene === "reward") {
      const reward =
        game.rewardChoices.find((r) => r.id === "chaos-egg") ??
        game.rewardChoices.find((r) => r.id === "crest-crown") ??
        game.rewardChoices.find((r) => r.type === "heal") ??
        game.rewardChoices[0];
      store.getState().chooseReward(reward.id);
    }
  }
  assert.equal(store.getState().game.scene, "run-complete");
  assert.ok(store.getState().game.run.health > 0);
});
test("all support abilities and equipment affect the actual simulation", async () => {
  let run = {
    health: 2,
    maxHealth: 3,
    abilities: ["egg-bomb", "guard-chick", "mana-grain", "crest-jump"],
    artifacts: [],
    stats: {},
  };
  for (const id of [
    "crest-crown",
    "wind-boots",
    "chaos-egg",
    "golden-grain-ring",
    "prophet-hen",
    "shell-shield",
  ])
    run = applyReward(run, { type: "artifact", id });
  assert.equal(run.maxHealth, 4);
  assert.equal(run.health, 3);
  assert.equal(run.gold, 6);
  assert.equal(run.stats.rewardChoiceBonus, 1);
  const sim = await createBattleSimulation({ ...run, type: "boss" });
  try {
    sim.move(1);
    tick(sim, 0.5);
    sim.move(0);
    assert.ok(sim.snapshot().player.x > -2.8);
    assert.equal(sim.fire("guard-chick"), true);
    nextTurn(sim);
    assert.equal(sim.player.health, 3);
    assert.equal(sim.fire("mana-grain"), true);
    assert.equal(sim.player.health, 4);
    assert.equal(sim.boost, 1);
    nextTurn(sim);
    assert.equal(sim.player.health, 4); // shell blocks answer
    assert.equal(sim.fire("crest-jump"), true);
    tick(sim, 0.5);
    assert.ok(sim.snapshot().player.y > 2);
    nextTurn(sim);
  } finally {
    sim.dispose();
  }
});
test("deliberate pass allows an enemy answer and defeat, idle time does not", async () => {
  const sim = await createBattleSimulation({ health: 1, maxHealth: 3 });
  try {
    tick(sim, 26);
    assert.equal(sim.outcome, null);
    assert.equal(sim.turn, 1);
    sim.dispatch({type:"pass"});
    tick(sim, 8);
    assert.equal(sim.outcome, "lost");
    assert.equal(sim.player.health, 0);
  } finally {
    sim.dispose();
  }
});
test("identical inputs at 30, 60 and 120 Hz give identical outcomes", async () => {
  const states = [];
  for (const hz of [30, 60, 120]) {
    const sim = await createBattleSimulation({ type: "boss" });
    try {
      sim.fire();
      for (let i = 0; i < hz * 5; i++) sim.advance(1 / hz);
      states.push(sim.snapshot());
    } finally {
      sim.dispose();
    }
  }
  assert.deepEqual(states[0], states[1]);
  assert.deepEqual(states[1], states[2]);
});
