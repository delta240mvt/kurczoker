import { ACTOR_KINDS, ARTIFACT_IDS, NODE_TYPES, SCENES } from "./constants.js";
import { applyReward as applyAbilityReward, getRewardChoices } from "./abilities.js";
import { getAvailableNodes, getNodeById } from "./map.js";
import { createInitialGameState, setUiMessage } from "./state.js";

export function startRun(seed = 1) {
  return createInitialGameState(seed);
}

export function selectMapNode(state, nodeId) {
  if (state.run.defeated || state.run.completed) {
    return setUiMessage(state, "Ta wyprawa jest zakonczona. Uruchom restart.");
  }

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

  if (node.type === NODE_TYPES.SHOP) {
    return {
      ...state,
      scene: SCENES.SHOP,
      run,
      battle: null,
      rewardChoices: [],
      rewardMode: "shop",
      shopOffers: createShopOffers(node, run, state.seed),
      ui: {
        ...state.ui,
        message: "Kup wzmocnienie albo ruszaj dalej."
      }
    };
  }

  return completeCurrentNode({
    ...state,
    scene: SCENES.REWARD,
    run,
    rewardChoices: [],
    rewardMode: node.type === NODE_TYPES.TREASURE ? "treasure" : "reward"
  });
}

export function completeCurrentNode(state) {
  if (state.run.defeated || state.run.completed) {
    return setUiMessage(state, "Ta wyprawa jest zakonczona. Uruchom restart.");
  }

  const node = getNodeById(state.map, state.run.currentNodeId);

  if (!node) {
    return state;
  }

  const runAfterBattle = persistBattleHealth(state.run, state.battle);
  const completedNodeIds = Array.from(new Set([...state.run.completedNodeIds, node.id]));
  const run = {
    ...runAfterBattle,
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
    rewardChoices: createRewardChoices(node, runAfterBattle, state.seed),
    rewardMode: node.type === NODE_TYPES.TREASURE ? "treasure" : "reward",
    shopOffers: [],
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

  if (state.run.defeated || state.run.completed) {
    return setUiMessage(state, "Ta wyprawa jest zakonczona. Uruchom restart.");
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
    rewardMode: null,
    shopOffers: [],
    ui: {
      ...state.ui,
      message: offeredNodeIds.length > 0 ? "Wybierz kolejny szlak." : "Droga zamknieta."
    }
  };
}

export function purchaseShopOffer(state, offerId) {
  if (state.scene !== SCENES.SHOP || state.run?.defeated || state.run?.completed) {
    return setUiMessage(state, "Sklep nie jest dostepny.");
  }

  const offer = (state.shopOffers ?? []).find((entry) => entry.id === offerId);
  if (!offer) {
    return setUiMessage(state, "Nie ma takiej oferty.");
  }

  if ((state.run.gold ?? 0) < (offer.price ?? 0)) {
    return setUiMessage(state, "Za malo ziaren.");
  }

  const node = getNodeById(state.map, state.run.currentNodeId);
  const completedNodeIds = Array.from(new Set([...state.run.completedNodeIds, state.run.currentNodeId]));
  const purchasedRun = applyRewardToRun(
    {
      ...state.run,
      gold: (state.run.gold ?? 0) - (offer.price ?? 0),
      completedNodeIds
    },
    offer
  );
  const offeredNodeIds = getAvailableNodes(state.map, completedNodeIds, node?.id ?? state.run.currentNodeId).map(
    (nextNode) => nextNode.id
  );

  return {
    ...state,
    scene: SCENES.MAP,
    run: {
      ...purchasedRun,
      offeredNodeIds
    },
    rewardChoices: [],
    rewardMode: null,
    shopOffers: [],
    ui: {
      ...state.ui,
      message: offeredNodeIds.length > 0 ? "Zakup gotowy. Wybierz kolejny szlak." : "Zakup gotowy."
    }
  };
}

export function skipShop(state) {
  if (state.scene !== SCENES.SHOP || state.run?.defeated || state.run?.completed) {
    return setUiMessage(state, "Sklep nie jest dostepny.");
  }

  const completedNodeIds = Array.from(new Set([...state.run.completedNodeIds, state.run.currentNodeId]));
  const offeredNodeIds = getAvailableNodes(state.map, completedNodeIds, state.run.currentNodeId).map((node) => node.id);

  return {
    ...state,
    scene: SCENES.MAP,
    run: {
      ...state.run,
      completedNodeIds,
      offeredNodeIds
    },
    rewardChoices: [],
    rewardMode: null,
    shopOffers: [],
    ui: {
      ...state.ui,
      message: offeredNodeIds.length > 0 ? "Sklep ominiety. Wybierz kolejny szlak." : "Sklep ominiety."
    }
  };
}

export function markRunDefeated(state) {
  return {
    ...state,
    scene: SCENES.GAME_OVER,
    battle: null,
    rewardChoices: [],
    rewardMode: null,
    shopOffers: [],
    run: {
      ...state.run,
      health: 0,
      defeated: true,
      offeredNodeIds: []
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
    rewardMode: null,
    shopOffers: [],
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

function createRewardChoices(node, run, seed) {
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
    return getRewardChoices(seed + tier, run);
  }

  const choiceCount = 2 + (run.stats?.rewardChoiceBonus ?? 0);
  const choices = getRewardChoices(seed + tier + run.completedNodeIds.length, run).slice(0, choiceCount);
  return [
    ...choices,
    {
      id: "heal-small",
      type: "heal",
      label: "Rosol bojowy",
      value: tier
    }
  ];
}

function createShopOffers(node, run, seed) {
  const rewards = getRewardChoices(seed + (node.payload.rewardTier ?? 1) + 11, run)
    .filter((reward) => reward.type !== "gold" && reward.id !== ARTIFACT_IDS.GOLDEN_GRAIN_RING)
    .slice(0, 4);
  const fallback = [
    { id: "heal-small", type: "heal", label: "Kurze Uzdrowienie", value: 1 },
    { id: "grain-guard", type: "summon", label: "Pisklak Straznik", value: 1 }
  ];
  const offers = [...rewards, ...fallback].slice(0, 4);

  return offers.map((offer, index) => ({
    ...offer,
    price: offer.price ?? 4 + index * 2 + (offer.type === "artifact" ? 2 : 0)
  }));
}

function applyRewardToRun(run, reward) {
  if (!reward) {
    return run;
  }

  if (["artifact", "ability", "summon"].includes(reward.type)) {
    return applyAbilityReward(run, reward);
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

function persistBattleHealth(run, battle) {
  const player = battle?.actors?.find((actor) => actor.kind === ACTOR_KINDS.PLAYER || actor.id === "player");

  if (!player || !Number.isFinite(player.health)) {
    return run;
  }

  return {
    ...run,
    health: Math.min(run.maxHealth, Math.max(0, player.health))
  };
}
