import { create } from "zustand";
import { createStore } from "zustand/vanilla";
import { selectMapNode, startRun } from "../../game/run.js";
import { resetRun, setUiMessage } from "../../game/state.js";
import { projectileHitEnemy, turnEnded } from "../runtime/domainEvents.js";

export function createEngineStateInitializer(seed = 1) {
  return (set, get) => ({
    game: setUiMessage(startRun(seed), "Gotowy do wyprawy."),
    input: { aim: { x: 0, y: 0 }, firing: false },
    selectNode(nodeId) {
      set({ game: selectMapNode(get().game, nodeId) });
    },
    setAim(aim) {
      set({ input: { ...get().input, aim } });
    },
    projectileHitEnemy(payload) {
      set({ game: projectileHitEnemy(get().game, payload) });
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
