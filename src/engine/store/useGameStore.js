import { create } from "zustand";
import { createStore } from "zustand/vanilla";
import { selectMapNode, startRun } from "../../game/run.js";
import { setUiMessage } from "../../game/state.js";

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
    reset() {
      set({ game: setUiMessage(startRun(seed + 1), "Nowa wyprawa gotowa.") });
    }
  });
}

export function createEngineStore(seed = 1) {
  return createStore(createEngineStateInitializer(seed));
}

export const useGameStore = create(createEngineStateInitializer(1));
