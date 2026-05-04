import test from "node:test";
import assert from "node:assert/strict";

import { ACTOR_KINDS, ACTOR_TEAMS, ABILITY_IDS, ARTIFACT_IDS } from "../src/game/constants.js";
import { createEnemy, createPlayer, createSummon, getActorBounds } from "../src/game/actors.js";
import {
  applyReward,
  getAbilityById,
  getArtifactById,
  getRewardChoices
} from "../src/game/abilities.js";

test("actor factories create battle-ready actors with override support", () => {
  const player = createPlayer({ x: 48, health: 5 });
  const enemy = createEnemy("snail", { x: 700 });
  const summon = createSummon("guard-chick", "player-1", { ttl: 4 });

  assert.equal(player.kind, ACTOR_KINDS.PLAYER);
  assert.equal(player.team, ACTOR_TEAMS.PLAYER);
  assert.equal(player.id, "player");
  assert.equal(player.x, 48);
  assert.equal(player.health, 5);
  assert.equal(player.maxHealth, 3);

  assert.equal(enemy.kind, ACTOR_KINDS.ENEMY);
  assert.equal(enemy.team, ACTOR_TEAMS.ENEMY);
  assert.equal(enemy.type, "snail");
  assert.equal(enemy.x, 700);
  assert.equal(enemy.health, 2);

  assert.equal(summon.kind, ACTOR_KINDS.SUMMON);
  assert.equal(summon.team, ACTOR_TEAMS.PLAYER);
  assert.equal(summon.ownerId, "player-1");
  assert.equal(summon.ttl, 4);
});

test("getActorBounds returns a rectangle derived from actor dimensions", () => {
  assert.deepEqual(getActorBounds({ x: 10, y: 20, width: 30, height: 40 }), {
    x: 10,
    y: 20,
    width: 30,
    height: 40,
    left: 10,
    top: 20,
    right: 40,
    bottom: 60
  });
});

test("ability lookup exposes the default egg bomb and all wave abilities", () => {
  const eggBomb = getAbilityById(ABILITY_IDS.EGG_BOMB);

  assert.equal(eggBomb.id, ABILITY_IDS.EGG_BOMB);
  assert.equal(eggBomb.kind, "projectile");
  assert.equal(eggBomb.damage, 2);
  assert.equal(eggBomb.radius, 42);

  assert.equal(getAbilityById(ABILITY_IDS.CREST_JUMP).kind, "movement");
  assert.equal(getAbilityById(ABILITY_IDS.GUARD_CHICK).kind, "summon");
  assert.equal(getAbilityById(ABILITY_IDS.MANA_GRAIN).kind, "buff");
  assert.equal(getAbilityById("missing"), null);
});

test("reward choices are deterministic and avoid already owned rewards", () => {
  const runState = {
    abilities: [ABILITY_IDS.EGG_BOMB, ABILITY_IDS.CREST_JUMP],
    artifacts: [ARTIFACT_IDS.WIND_BOOTS]
  };

  const first = getRewardChoices(7, runState);
  const second = getRewardChoices(7, runState);

  assert.deepEqual(first, second);
  assert.equal(first.length, 3);
  assert.ok(!first.some((reward) => reward.id === ABILITY_IDS.CREST_JUMP));
  assert.ok(!first.some((reward) => reward.id === ARTIFACT_IDS.WIND_BOOTS));
});

test("applyReward adds abilities, gold, healing, and temporary summons immutably", () => {
  const runState = {
    health: 1,
    maxHealth: 3,
    gold: 0,
    abilities: [ABILITY_IDS.EGG_BOMB],
    artifacts: [],
    temporarySummons: []
  };

  const withAbility = applyReward(runState, { type: "ability", id: ABILITY_IDS.GUARD_CHICK });
  const withGold = applyReward(runState, { type: "gold", value: 8 });
  const healed = applyReward(runState, { type: "heal", value: 9 });
  const withSummon = applyReward(runState, { type: "summon", id: "guard-chick", value: 2 });

  assert.deepEqual(runState.abilities, [ABILITY_IDS.EGG_BOMB]);
  assert.deepEqual(withAbility.abilities, [ABILITY_IDS.EGG_BOMB, ABILITY_IDS.GUARD_CHICK]);
  assert.equal(withGold.gold, 8);
  assert.equal(healed.health, 3);
  assert.deepEqual(withSummon.temporarySummons, [{ type: "guard-chick", ttl: 2 }]);
});

test("artifact rewards apply concrete run effects once", () => {
  const runState = {
    health: 2,
    maxHealth: 3,
    gold: 0,
    abilities: [ABILITY_IDS.EGG_BOMB],
    artifacts: [],
    stats: {}
  };

  const crown = applyReward(runState, { type: "artifact", id: ARTIFACT_IDS.CREST_CROWN });
  const boots = applyReward(runState, { type: "artifact", id: ARTIFACT_IDS.WIND_BOOTS });
  const chaos = applyReward(runState, { type: "artifact", id: ARTIFACT_IDS.CHAOS_EGG });
  const ring = applyReward(runState, { type: "artifact", id: ARTIFACT_IDS.GOLDEN_GRAIN_RING });
  const prophet = applyReward(runState, { type: "artifact", id: ARTIFACT_IDS.PROPHET_HEN });
  const shield = applyReward(runState, { type: "artifact", id: ARTIFACT_IDS.SHELL_SHIELD });
  const duplicate = applyReward(boots, { type: "artifact", id: ARTIFACT_IDS.WIND_BOOTS });

  assert.equal(getArtifactById(ARTIFACT_IDS.CREST_CROWN).id, ARTIFACT_IDS.CREST_CROWN);
  assert.equal(crown.maxHealth, 4);
  assert.equal(crown.health, 3);
  assert.equal(boots.stats.moveSpeedBonus, 0.06);
  assert.equal(chaos.stats.eggBombDamageBonus, 1);
  assert.equal(ring.gold, 6);
  assert.equal(prophet.stats.rewardChoiceBonus, 1);
  assert.equal(shield.stats.damageReduction, 1);
  assert.deepEqual(duplicate.artifacts, [ARTIFACT_IDS.WIND_BOOTS]);
  assert.equal(getArtifactById("missing"), null);
});
