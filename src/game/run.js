import { ARTIFACT_IDS, NODE_TYPES, SCENES } from "./constants.js";
import { getAvailableNodes, getNodeById } from "./map.js";
import { createInitialGameState, setUiMessage } from "./state.js";

export function startRun(seed = 1) {
  return createInitialGameState(seed);
}

export function selectMapNode(state, nodeId) {
  const node = getNodeById(state.map, nodeId);

  if (!node || !state.run.offeredNodeIds.includes(nodeId)) {
    return setUiMessage(state, "Ten szlak nie jest dostepny.");
  }

  const run = {
    ...state.run,
    currentNodeId: nodeId,
    offeredNodeIds: []
  };

  if (node.type === NODE_TYPES.BATTLE || node.type === NODE_TYPES.ELITE || node.type === NODE_TYPES.BOSS) {
    return {
      ...state,
      scene: SCENES.BATTLE,
      run,
      battle: {
        nodeId,
        encounterId: node.payload.encounterId,
        type: node.type
      },
      rewardChoices: [],
      ui: {
        ...state.ui,
        message: node.type === NODE_TYPES.BOSS ? "Boss czeka." : "Bitwa rozpoczeta."
      }
    };
  }

  return completeCurrentNode({
    ...state,
    scene: SCENES.REWARD,
    run,
    rewardChoices: []
  });
}

export function completeCurrentNode(state) {
  const node = getNodeById(state.map, state.run.currentNodeId);

  if (!node) {
    return state;
  }

  const completedNodeIds = Array.from(new Set([...state.run.completedNodeIds, node.id]));
  const run = {
    ...state.run,
    completedNodeIds
  };

  if (node.type === NODE_TYPES.BOSS) {
    return markRunComplete({
      ...state,
      battle: null,
      run
    });
  }

  return {
    ...state,
    scene: SCENES.REWARD,
    battle: null,
    run,
    rewardChoices: createRewardChoices(node),
    ui: {
      ...state.ui,
      message: "Wybierz nagrode."
    }
  };
}

export function applyRunReward(state, reward) {
  if (!state.run) {
    return applyRewardToRun(state, reward);
  }

  const run = applyRewardToRun(state.run, reward);
  const offeredNodeIds = getAvailableNodes(state.map, run.completedNodeIds, run.currentNodeId).map((node) => node.id);

  return {
    ...state,
    scene: SCENES.MAP,
    run: {
      ...run,
      offeredNodeIds
    },
    rewardChoices: [],
    ui: {
      ...state.ui,
      message: offeredNodeIds.length > 0 ? "Wybierz kolejny szlak." : "Droga zamknieta."
    }
  };
}

export function markRunDefeated(state) {
  return {
    ...state,
    scene: SCENES.GAME_OVER,
    battle: null,
    rewardChoices: [],
    run: {
      ...state.run,
      health: 0,
      defeated: true
    },
    ui: {
      ...state.ui,
      message: "Koniec wyprawy."
    }
  };
}

export function markRunComplete(state) {
  return {
    ...state,
    scene: SCENES.RUN_COMPLETE,
    battle: null,
    rewardChoices: [],
    run: {
      ...state.run,
      completed: true
    },
    ui: {
      ...state.ui,
      message: "KURCZOKER pokonany."
    }
  };
}

function createRewardChoices(node) {
  const tier = node.payload.rewardTier ?? 1;

  if (node.type === NODE_TYPES.SHOP) {
    return [
      {
        id: "gold-small",
        type: "gold",
        label: "Zapas ziaren",
        value: 6 + tier
      }
    ];
  }

  if (node.type === NODE_TYPES.TREASURE) {
    return [
      {
        id: ARTIFACT_IDS.SHELL_SHIELD,
        type: "artifact",
        label: "Shell Shield",
        value: tier
      }
    ];
  }

  return [
    {
      id: "heal-small",
      type: "heal",
      label: "Rosol bojowy",
      value: tier
    },
    {
      id: "gold-small",
      type: "gold",
      label: "Ziarna zwyciestwa",
      value: 4 + tier
    }
  ];
}

function applyRewardToRun(run, reward) {
  if (!reward) {
    return run;
  }

  if (reward.type === "artifact") {
    return {
      ...run,
      artifacts: run.artifacts.includes(reward.id) ? run.artifacts : [...run.artifacts, reward.id]
    };
  }

  if (reward.type === "ability") {
    return {
      ...run,
      abilities: run.abilities.includes(reward.id) ? run.abilities : [...run.abilities, reward.id]
    };
  }

  if (reward.type === "heal") {
    return {
      ...run,
      health: Math.min(run.maxHealth, run.health + reward.value)
    };
  }

  if (reward.type === "gold") {
    return {
      ...run,
      gold: run.gold + reward.value
    };
  }

  return run;
}
