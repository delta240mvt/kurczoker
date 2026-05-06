import { create } from "zustand";
import { createStore } from "zustand/vanilla";
import { BATTLE_PHASES } from "../../game/constants.js";
import { applyRunReward, completeCurrentNode, purchaseShopOffer, selectMapNode, skipShop, startRun } from "../../game/run.js";
import { resetRun, setUiMessage } from "../../game/state.js";
import { projectileHitEnemy, turnEnded } from "../runtime/domainEvents.js";

export function createEngineStateInitializer(seed = 1) {
  return (set, get) => ({
    game: setUiMessage(startRun(seed), "Gotowy do wyprawy."),
    input: { aim: { x: 0, y: 0 }, firing: false },
    selectNode(nodeId) {
      set({ game: selectMapNode(get().game, nodeId) });
    },
    chooseReward(rewardId) {
      const reward = get().game.rewardChoices?.find((entry) => entry.id === rewardId);
      set({ game: applyRunReward(get().game, reward) });
    },
    buyShopOffer(offerId) {
      set({ game: purchaseShopOffer(get().game, offerId) });
    },
    skipShop() {
      set({ game: skipShop(get().game) });
    },
    setAim(aim) {
      set({ input: { ...get().input, aim } });
    },
    projectileHitEnemy(payload) {
      const next = projectileHitEnemy(get().game, payload);
      set({ game: next.battle?.phase === BATTLE_PHASES.WON ? completeCurrentNode(next) : next });
    },
    turnEnded() {
      set({ game: turnEnded(get().game) });
    },
    reset() {
      set({ game: setUiMessage(resetRun(get().game), "Nowa wyprawa gotowa.") });
    }
  });
}

export function createEngineStore(seed = 1) {
  return createStore(createEngineStateInitializer(seed));
}

export const useGameStore = create(createEngineStateInitializer(1));
