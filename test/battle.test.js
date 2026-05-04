import test from "node:test";
import assert from "node:assert/strict";

import { ABILITY_IDS, ARTIFACT_IDS, BATTLE_PHASES } from "../src/game/constants.js";
import {
  applyDamageToActor,
  createBattleState,
  firePlayerAbility,
  isBattleLost,
  isBattleWon,
  resolveEnemyTurn,
  updateBattle
} from "../src/game/battle.js";

const player = (overrides = {}) => ({
  id: "player",
  kind: "player",
  team: "player",
  x: 10,
  y: 70,
  vx: 0,
  vy: 0,
  width: 10,
  height: 10,
  health: 10,
  maxHealth: 10,
  ...overrides
});

const enemy = (overrides = {}) => ({
  id: "enemy-1",
  kind: "enemy",
  team: "enemy",
  x: 80,
  y: 70,
  vx: 0,
  vy: 0,
  width: 10,
  height: 10,
  health: 5,
  maxHealth: 5,
  ...overrides
});

test("createBattleState starts a player turn with cloned actors and timer", () => {
  const sourcePlayer = player();
  const battle = createBattleState({ actors: [sourcePlayer], turnDurationMs: 5000 });

  assert.equal(battle.phase, BATTLE_PHASES.PLAYER_TURN);
  assert.equal(battle.turnTimeRemainingMs, 5000);
  assert.equal(battle.actionFired, false);
  assert.notEqual(battle.actors[0], sourcePlayer);
});

test("updateBattle counts down the player timer and hands off to enemy turn", () => {
  const battle = createBattleState({ actors: [player(), enemy()], turnDurationMs: 100 });

  const ticking = updateBattle(battle, {}, 40);
  assert.equal(ticking.phase, BATTLE_PHASES.PLAYER_TURN);
  assert.equal(ticking.turnTimeRemainingMs, 60);

  const expired = updateBattle(ticking, {}, 80);
  assert.equal(expired.phase, BATTLE_PHASES.ENEMY_TURN);
  assert.equal(expired.turnTimeRemainingMs, 0);
});

test("firePlayerAbility allows only one fired action per player turn", () => {
  const battle = createBattleState({ actors: [player(), enemy()] });
  const fired = firePlayerAbility(battle, { id: ABILITY_IDS.EGG_BOMB, damage: 3, radius: 20 }, { x: 1, y: 0 });
  const second = firePlayerAbility(fired, { id: ABILITY_IDS.EGG_BOMB, damage: 3, radius: 20 }, { x: 1, y: 0 });

  assert.equal(fired.actionFired, true);
  assert.equal(fired.phase, BATTLE_PHASES.PROJECTILE);
  assert.equal(fired.projectiles.length, 1);
  assert.equal(second.projectiles.length, 1);
});

test("updateBattle resolves projectile explosions against enemies", () => {
  const battle = firePlayerAbility(
    createBattleState({ actors: [player(), enemy({ x: 55 })], groundY: 100, gravity: 0 }),
    { id: ABILITY_IDS.EGG_BOMB, damage: 3, radius: 18, knockback: 2, speed: 1 },
    { x: 1, y: 0 }
  );

  const resolved = updateBattle(battle, {}, 30);
  const hitEnemy = resolved.actors.find((actor) => actor.id === "enemy-1");

  assert.equal(resolved.phase, BATTLE_PHASES.ENEMY_TURN);
  assert.equal(resolved.projectiles.length, 0);
  assert.equal(hitEnemy.health, 2);
  assert.ok(hitEnemy.vx > 0);
});

test("resolveEnemyTurn deterministically damages the player and starts next player turn", () => {
  const battle = createBattleState({ actors: [player(), enemy()], turnDurationMs: 7000, phase: BATTLE_PHASES.ENEMY_TURN });

  const resolved = resolveEnemyTurn(battle);
  const damagedPlayer = resolved.actors.find((actor) => actor.id === "player");

  assert.equal(damagedPlayer.health, 9);
  assert.equal(resolved.phase, BATTLE_PHASES.PLAYER_TURN);
  assert.equal(resolved.turnTimeRemainingMs, 7000);
  assert.equal(resolved.actionFired, false);
  assert.equal(resolved.turnNumber, 2);
});

test("updateBattle applies movement constraints, platform landing, and hazard damage", () => {
  const battle = createBattleState({
    actors: [player({ y: 40, vy: 1 }), enemy()],
    groundY: 120,
    gravity: 0,
    playerSpeed: 1,
    platforms: [{ id: "bridge", x: 0, y: 60, width: 80, height: 10 }],
    hazards: [{ id: "spikes", type: "spikes", x: 5, y: 50, width: 20, height: 10, damage: 2 }]
  });

  const next = updateBattle(battle, { moveX: -1 }, 20);
  const nextPlayer = next.actors.find((actor) => actor.id === "player");

  assert.equal(nextPlayer.x, 0);
  assert.equal(nextPlayer.y, 50);
  assert.equal(nextPlayer.vy, 0);
  assert.equal(nextPlayer.health, 8);
});

test("guard chick summons expire by ttl during battle updates", () => {
  const battle = firePlayerAbility(
    createBattleState({ actors: [player(), enemy()] }),
    { id: ABILITY_IDS.GUARD_CHICK, kind: "summon", ttl: 25, health: 2 }
  );

  assert.equal(battle.actors.some((actor) => actor.kind === "summon"), true);

  const next = updateBattle(battle, {}, 30);

  assert.equal(next.actors.some((actor) => actor.kind === "summon"), false);
});

test("shell shield artifact absorbs one enemy hit per battle", () => {
  const battle = createBattleState({
    actors: [player(), enemy()],
    artifacts: [ARTIFACT_IDS.SHELL_SHIELD],
    phase: BATTLE_PHASES.ENEMY_TURN
  });

  const shielded = resolveEnemyTurn(battle);
  const firstPlayer = shielded.actors.find((actor) => actor.id === "player");
  const damaged = resolveEnemyTurn({ ...shielded, phase: BATTLE_PHASES.ENEMY_TURN });
  const secondPlayer = damaged.actors.find((actor) => actor.id === "player");

  assert.equal(firstPlayer.health, 10);
  assert.equal(shielded.usedArtifacts.includes(ARTIFACT_IDS.SHELL_SHIELD), true);
  assert.equal(secondPlayer.health, 9);
});

test("applyDamageToActor clamps health at zero", () => {
  const battle = createBattleState({ actors: [player({ health: 2 })] });

  const next = applyDamageToActor(battle, "player", 5);

  assert.equal(next.actors[0].health, 0);
});

test("battle win and loss predicates reflect living teams", () => {
  assert.equal(isBattleWon(createBattleState({ actors: [player(), enemy({ health: 0 })] })), true);
  assert.equal(isBattleLost(createBattleState({ actors: [player({ health: 0 }), enemy()] })), true);
});
