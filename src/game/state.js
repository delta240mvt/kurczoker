import { ABILITY_IDS, SCENES, TUNING } from "./constants.js";
import { createRunMap, getAvailableNodes } from "./map.js";

export function createInitialGameState(seed = 1) {
  const map = createRunMap(seed);

  return {
    scene: SCENES.MAP,
    seed,
    run: {
      currentNodeId: "start",
      completedNodeIds: [],
      offeredNodeIds: getAvailableNodes(map, [], "start").map((node) => node.id),
      health: TUNING.RUN_HEALTH,
      maxHealth: TUNING.RUN_HEALTH,
      gold: 0,
      artifacts: [],
      abilities: [ABILITY_IDS.EGG_BOMB],
      defeated: false,
      completed: false
    },
    map,
    battle: null,
    rewardChoices: [],
    rewardMode: null,
    shopOffers: [],
    ui: {
      muted: true,
      selectedAbilityId: ABILITY_IDS.EGG_BOMB,
      message: "Wybierz pierwszy szlak."
    }
  };
}

export function resetRun(state, seed = state.seed + 1) {
  return createInitialGameState(seed);
}

export function setUiMessage(state, message) {
  return {
    ...state,
    ui: { ...state.ui, message }
  };
}

export function toggleMute(state) {
  return {
    ...state,
    ui: { ...state.ui, muted: !state.ui.muted }
  };
}
