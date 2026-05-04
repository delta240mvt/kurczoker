import { ABILITY_IDS } from "./constants.js";

export function getAbilityById(id) {
  return { id, label: id };
}

export function getArtifactById(id) {
  return { id, label: id };
}

export function getRewardChoices() {
  return [{ id: ABILITY_IDS.GUARD_CHICK, type: "ability", label: "Pisklak Straznik", value: 1 }];
}

export function applyReward(runState) {
  return runState;
}
