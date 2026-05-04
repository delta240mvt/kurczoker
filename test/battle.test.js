import test from "node:test";
import assert from "node:assert/strict";

import { ABILITY_IDS, ARTIFACT_IDS, BATTLE_PHASES, TUNING } from "../src/game/constants.js";
import { getAbilityById } from "../src/game/abilities.js";
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
  const battle = createBattleState({ actors: [sourcePlayer] });

  assert.equal(battle.phase, BATTLE_PHASES.PLAYER_TURN);
  assert.equal(battle.turnTimeRemainingMs, TUNING.PLAYER_TURN_MS);
  assert.equal(battle.gravity, TUNING.GRAVITY);
  assert.equal(battle.playerSpeed, TUNING.PLAYER_SPEED);
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

test("updateBattle resolves egg bomb stats from selectedAbilityId", () => {
  const ability = getAbilityById(ABILITY_IDS.EGG_BOMB);
  const battle = createBattleState({ actors: [player(), enemy()] });

  const fired = updateBattle(
    battle,
    { firePressed: true, selectedAbilityId: ABILITY_IDS.EGG_BOMB, aim: { x: 1, y: 0 } },
    16
  );

  assert.equal(fired.projectiles.length, 1);
  assert.equal(fired.projectiles[0].damage, ability.damage);
  assert.equal(fired.projectiles[0].explosionRadius, ability.radius);
});

test("updateBattle resolves guard chick stats from selectedAbilityId", () => {
  const ability = getAbilityById(ABILITY_IDS.GUARD_CHICK);
  const battle = createBattleState({ actors: [player(), enemy()] });

  const fired = updateBattle(
    battle,
    { firePressed: true, selectedAbilityId: ABILITY_IDS.GUARD_CHICK, aim: { x: 1, y: 0 } },
    16
  );
  const summon = fired.actors.find((actor) => actor.kind === "summon");

  assert.equal(fired.phase, BATTLE_PHASES.ENEMY_TURN);
  assert.equal(summon.health, ability.health ?? 1);
  assert.equal(summon.ttl, ability.summonTtl * 1000);
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

  assert.equal(resolved.phase, BATTLE_PHASES.PROJECTILE);
  assert.equal(resolved.projectiles.length, 1);
  assert.equal(resolved.projectiles[0].team, "enemy");
});

test("updateBattle resolves enemy turn without external orchestration", () => {
  const battle = createBattleState({
    actors: [player({ x: 10 }), enemy({ x: 24 })],
    phase: BATTLE_PHASES.ENEMY_TURN,
    gravity: 0
  });

  const fired = updateBattle(battle, {}, 16);
  const resolved = updateBattle(fired, {}, 30);
  const damagedPlayer = resolved.actors.find((actor) => actor.id === "player");

  assert.equal(resolved.phase, BATTLE_PHASES.PLAYER_TURN);
  assert.equal(damagedPlayer.health, 9);
});

test("enemy projectile reaches the player in default encounters", () => {
  let battle = createBattleState({
    actors: [player(), enemy()],
    phase: BATTLE_PHASES.ENEMY_TURN,
    platforms: [
      { id: "ledge-left", x: 92, y: 330, width: 190, height: 20 },
      { id: "ledge-right", x: 620, y: 300, width: 180, height: 20 }
    ]
  });

  battle = updateBattle(battle, {}, 16);
  for (let i = 0; i < 40 && battle.phase === BATTLE_PHASES.PROJECTILE; i += 1) {
    battle = updateBattle(battle, {}, 34);
  }

  const damagedPlayer = battle.actors.find((actor) => actor.id === "player");

  assert.equal(battle.phase, BATTLE_PHASES.PLAYER_TURN);
  assert.equal(damagedPlayer.health, 9);
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
    { ...getAbilityById(ABILITY_IDS.GUARD_CHICK), summonTtl: 0.025, health: 2 }
  );

  assert.equal(battle.actors.some((actor) => actor.kind === "summon"), true);

  const next = updateBattle(battle, {}, 30);

  assert.equal(next.actors.some((actor) => actor.kind === "summon"), false);
});

test("battle tuning applies artifact stats to default rules", () => {
  const faster = updateBattle(
    createBattleState({
      actors: [player({ x: 20 }), enemy()],
      playerSpeed: TUNING.PLAYER_SPEED + 0.06
    }),
    { moveX: 1 },
    100
  );
  const movedPlayer = faster.actors.find((actor) => actor.id === "player");
  assert.equal(movedPlayer.x, 20 + (TUNING.PLAYER_SPEED + 0.06) * 100);

  const empowered = firePlayerAbility(
    createBattleState({ actors: [player(), enemy()], eggBombDamageBonus: 1 }),
    getAbilityById(ABILITY_IDS.EGG_BOMB),
    { x: 1, y: 0 }
  );
  assert.equal(empowered.projectiles[0].damage, getAbilityById(ABILITY_IDS.EGG_BOMB).damage + 1);

  const reduced = updateBattle(
    {
      ...createBattleState({ actors: [player({ x: 10 }), enemy({ x: 24 })], damageReduction: 1, gravity: 0 }),
      phase: BATTLE_PHASES.ENEMY_TURN
    },
    {},
    16
  );
  const resolved = updateBattle(reduced, {}, 30);
  const reducedPlayer = resolved.actors.find((actor) => actor.id === "player");
  assert.equal(reducedPlayer.health, 9);
});

test("guard chick blocks the next enemy projectile", () => {
  const battle = createBattleState({
    actors: [
      player({ x: 10 }),
      { id: "summon-1", kind: "summon", team: "player", x: 20, y: 70, vx: 0, vy: 0, width: 10, height: 10, health: 1, maxHealth: 1, ttl: 1000 },
      enemy({ x: 35 })
    ],
    phase: BATTLE_PHASES.ENEMY_TURN,
    gravity: 0
  });

  const fired = updateBattle(battle, {}, 16);
  const resolved = updateBattle(fired, {}, 35);
  const blockedPlayer = resolved.actors.find((actor) => actor.id === "player");
  const summon = resolved.actors.find((actor) => actor.id === "summon-1");

  assert.equal(blockedPlayer.health, 10);
  assert.equal(summon.health, 0);
});

test("crest jump and mana grain resolve as movement and buff actions", () => {
  const wounded = player({ health: 8, maxHealth: 10 });
  const battle = createBattleState({ actors: [wounded, enemy()] });

  const jumped = firePlayerAbility(
    battle,
    { id: ABILITY_IDS.CREST_JUMP, kind: "movement", impulse: -0.5 },
    { x: 1, y: -1 }
  );
  const jumpPlayer = jumped.actors.find((actor) => actor.id === "player");

  assert.equal(jumped.phase, BATTLE_PHASES.ENEMY_TURN);
  assert.equal(jumped.projectiles.length, 0);
  assert.equal(jumpPlayer.vy, -0.5);
  assert.ok(jumpPlayer.vx > 0);

  const healed = firePlayerAbility(createBattleState({ actors: [wounded, enemy()] }), {
    id: ABILITY_IDS.MANA_GRAIN,
    kind: "buff"
  });
  const healedPlayer = healed.actors.find((actor) => actor.id === "player");

  assert.equal(healed.projectiles.length, 0);
  assert.equal(healedPlayer.health, 9);
  assert.deepEqual(healed.buffs, [{ id: ABILITY_IDS.MANA_GRAIN, turns: 1 }]);

  const empowered = firePlayerAbility(
    { ...healed, phase: BATTLE_PHASES.PLAYER_TURN, actionFired: false },
    { id: ABILITY_IDS.EGG_BOMB, kind: "projectile", damage: 2, radius: 18 },
    { x: 1, y: 0 }
  );

  assert.equal(empowered.projectiles[0].damage, 3);
  assert.equal(empowered.projectiles[0].explosionRadius, 28);
  assert.deepEqual(empowered.buffs, []);
});

test("shell shield artifact absorbs one enemy hit per battle", () => {
  const battle = createBattleState({
    actors: [player({ x: 10 }), enemy({ x: 24 })],
    artifacts: [ARTIFACT_IDS.SHELL_SHIELD],
    phase: BATTLE_PHASES.ENEMY_TURN,
    gravity: 0
  });

  const fired = resolveEnemyTurn(battle);
  const shielded = updateBattle(fired, {}, 30);
  const firstPlayer = shielded.actors.find((actor) => actor.id === "player");
  const firedAgain = resolveEnemyTurn({ ...shielded, phase: BATTLE_PHASES.ENEMY_TURN });
  const damaged = updateBattle(firedAgain, {}, 30);
  const secondPlayer = damaged.actors.find((actor) => actor.id === "player");

  assert.equal(firstPlayer.health, 10);
  assert.equal(shielded.usedArtifacts.includes(ARTIFACT_IDS.SHELL_SHIELD), true);
  assert.equal(secondPlayer.health, 9);
});

test("damage reduction does not permanently absorb positive enemy projectile damage", () => {
  let battle = createBattleState({
    actors: [player({ x: 10 }), enemy({ x: 24 })],
    damageReduction: 1,
    phase: BATTLE_PHASES.ENEMY_TURN,
    gravity: 0
  });

  battle = updateBattle(battle, {}, 16);
  battle = updateBattle(battle, {}, 30);
  battle = updateBattle({ ...battle, phase: BATTLE_PHASES.ENEMY_TURN }, {}, 16);
  battle = updateBattle(battle, {}, 30);

  const reducedPlayer = battle.actors.find((actor) => actor.id === "player");

  assert.equal(reducedPlayer.health, 8);
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
