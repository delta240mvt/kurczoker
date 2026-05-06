import assert from "node:assert/strict";
import test from "node:test";
import { projectileHitEnemy, turnEnded } from "../src/engine/runtime/domainEvents.js";
import { createBattleState } from "../src/game/battle.js";
import { createEnemy, createPlayer } from "../src/game/actors.js";
import { BATTLE_PHASES, SCENES } from "../src/game/constants.js";

test("projectileHitEnemy returns updated domain state without importing Rapier", () => {
  const enemy = createEnemy("grunt", { id: "enemy-1" });
  const game = {
    scene: SCENES.BATTLE,
    battle: createBattleState({ actors: [createPlayer(), enemy] }),
    ui: { message: "" }
  };

  const next = projectileHitEnemy(game, { actorId: "enemy-1", damage: 1 });
  const nextEnemy = next.battle.actors.find((actor) => actor.id === "enemy-1");

  assert.equal(next.scene, SCENES.BATTLE);
  assert.equal(nextEnemy.health, enemy.health - 1);
  assert.equal(next.battle.phase, BATTLE_PHASES.ENEMY_TURN);
  assert.match(next.ui.message, /Trafienie/);
});

test("projectileHitEnemy derives default Egg Bomb damage when R3F omits damage", () => {
  const enemy = createEnemy("grunt", { id: "enemy-1", health: 5, maxHealth: 5 });
  const game = {
    scene: SCENES.BATTLE,
    battle: createBattleState({ actors: [createPlayer(), enemy] }),
    run: { abilities: ["egg-bomb"] },
    ui: { message: "", selectedAbilityId: "egg-bomb" }
  };

  const next = projectileHitEnemy(game, { actorId: "enemy-1" });
  const nextEnemy = next.battle.actors.find((actor) => actor.id === "enemy-1");

  assert.equal(nextEnemy.health, 3);
  assert.match(next.ui.message, /Trafienie za 2/);
});

test("projectileHitEnemy applies Chaos Egg eggBombDamageBonus when deriving R3F hit damage", () => {
  const enemy = createEnemy("grunt", { id: "enemy-1", health: 5, maxHealth: 5 });
  const game = {
    scene: SCENES.BATTLE,
    battle: createBattleState({ actors: [createPlayer(), enemy], eggBombDamageBonus: 1 }),
    run: { abilities: ["egg-bomb"], stats: { eggBombDamageBonus: 1 } },
    ui: { message: "", selectedAbilityId: "missing-ability" }
  };

  const next = projectileHitEnemy(game, { actorId: "enemy-1" });
  const nextEnemy = next.battle.actors.find((actor) => actor.id === "enemy-1");

  assert.equal(nextEnemy.health, 2);
  assert.match(next.ui.message, /Trafienie za 3/);
});

test("turnEnded can hand off battle phase through domain state", () => {
  const game = {
    scene: SCENES.BATTLE,
    battle: { phase: BATTLE_PHASES.PLAYER_TURN },
    ui: { message: "" }
  };

  const next = turnEnded(game);

  assert.equal(next.battle.phase, BATTLE_PHASES.ENEMY_TURN);
});
