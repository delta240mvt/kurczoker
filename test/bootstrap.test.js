import test from "node:test";
import assert from "node:assert/strict";

import { ABILITY_IDS, ARTIFACT_IDS, NODE_TYPES, TUNING } from "../src/game/constants.js";
import { createEncounter, ownedAbilityId, rewardHitboxes } from "../src/game/bootstrap.js";

test("ownedAbilityId falls back to unlocked abilities", () => {
  const state = {
    run: {
      abilities: [ABILITY_IDS.EGG_BOMB]
    }
  };

  assert.equal(ownedAbilityId(state, ABILITY_IDS.GUARD_CHICK), ABILITY_IDS.EGG_BOMB);
  assert.equal(ownedAbilityId(state, ABILITY_IDS.EGG_BOMB), ABILITY_IDS.EGG_BOMB);
  assert.equal(
    ownedAbilityId({ run: { abilities: [ABILITY_IDS.EGG_BOMB, ABILITY_IDS.GUARD_CHICK] } }, ABILITY_IDS.GUARD_CHICK),
    ABILITY_IDS.GUARD_CHICK
  );
});

test("createEncounter applies artifact stats to battle config", () => {
  const node = {
    id: "battle-1",
    type: NODE_TYPES.BATTLE,
    payload: { encounterId: "grunt" }
  };
  const run = {
    health: 3,
    maxHealth: 3,
    artifacts: [ARTIFACT_IDS.WIND_BOOTS, ARTIFACT_IDS.CHAOS_EGG, ARTIFACT_IDS.SHELL_SHIELD],
    stats: {
      moveSpeedBonus: 0.06,
      eggBombDamageBonus: 1,
      damageReduction: 1
    }
  };

  const battle = createEncounter(node, run);

  assert.equal(battle.playerSpeed, TUNING.PLAYER_SPEED + 0.06);
  assert.equal(battle.eggBombDamageBonus, 1);
  assert.equal(battle.damageReduction, 0);
  assert.deepEqual(battle.artifacts, run.artifacts);
});

test("createEncounter applies standalone damage reduction without making shell shield permanent", () => {
  const node = {
    id: "battle-1",
    type: NODE_TYPES.BATTLE,
    payload: { encounterId: "grunt" }
  };

  const reduced = createEncounter(node, {
    health: 3,
    maxHealth: 3,
    artifacts: [],
    stats: { damageReduction: 1 }
  });

  assert.equal(reduced.damageReduction, 1);
});

test("rewardHitboxes exposes every bonus reward choice", () => {
  const rewardChoices = [
    { id: "one" },
    { id: "two" },
    { id: "three" },
    { id: "four" }
  ];

  const boxes = rewardHitboxes({ rewardChoices });

  assert.equal(boxes.length, 4);
  assert.equal(boxes[3].id, "four");
  assert.equal(boxes[3].width, 190);
});
