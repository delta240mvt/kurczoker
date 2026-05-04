import { createInitialGameState } from "./state.js";

export function startRun(seed = 1) {
  return createInitialGameState(seed);
}

export function selectMapNode(state) {
  return state;
}

export function completeCurrentNode(state) {
  return state;
}

export function applyRunReward(runState) {
  return runState;
}

export function markRunDefeated(state) {
  return state;
}

export function markRunComplete(state) {
  return state;
}
