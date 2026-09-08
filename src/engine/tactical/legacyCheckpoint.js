import { createInitialGameState } from "../../game/state.js";
import { ABILITY_IDS, ARTIFACT_IDS } from "../../game/constants.js";
import { getAvailableNodes, getNodeById } from "../../game/map.js";

export const SAVE_KEY = "kurczoker.checkpoint.v1";
const SAFE = ["map", "reward", "shop"];
const finite = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
export function encodeCheckpoint(game) {
  if (!game || !SAFE.includes(game.scene)) return null;
  return JSON.stringify({ version: 1, game: { ...game, battle: null } });
}
export function decodeCheckpoint(text) {
  try {
    if (typeof text !== "string" || text.length > 40000) return null;
    const data = JSON.parse(text),
      g = data?.game,
      r = g?.run;
    if (
      data?.version !== 1 ||
      !g ||
      !r ||
      !SAFE.includes(g.scene) ||
      !Number.isSafeInteger(g.seed) ||
      !finite(g.seed, 0, 1e9)
    )
      return null;
    if (
      !finite(r.health, 1, 20) ||
      !finite(r.maxHealth, r.health, 20) ||
      !finite(r.gold, 0, 1e6)
    )
      return null;
    const base = createInitialGameState(g.seed),
      ids = new Set(base.map.nodes.map((n) => n.id));
    if (!ids.has(r.currentNodeId) || r.completed || r.defeated) return null;
    for (const field of ["completedNodeIds", "offeredNodeIds"]) {
      if (
        !Array.isArray(r[field]) ||
        r[field].length > 8 ||
        r[field].some((id) => !ids.has(id))
      )
        return null;
    }
    if (
      !Array.isArray(r.abilities) ||
      !r.abilities.includes("egg-bomb") ||
      r.abilities.some((id) => !Object.values(ABILITY_IDS).includes(id))
    )
      return null;
    if (
      !Array.isArray(r.artifacts) ||
      r.artifacts.some((id) => !Object.values(ARTIFACT_IDS).includes(id))
    )
      return null;
    if (
      new Set(r.abilities).size !== r.abilities.length ||
      new Set(r.artifacts).size !== r.artifacts.length
    )
      return null;
    if (
      r.temporarySummons &&
      (!Array.isArray(r.temporarySummons) ||
        r.temporarySummons.some(
          (s) => s?.type !== "grain-guard" || !finite(s.ttl, 1, 3),
        ))
    )
      return null;
    const node = getNodeById(base.map, r.currentNodeId);
    if (g.scene === "shop" && node.type !== "shop") return null;
    if (g.scene === "reward" && !r.completedNodeIds.includes(node.id))
      return null;
    if (g.scene === "map") {
      const available = getAvailableNodes(
        base.map,
        r.completedNodeIds,
        r.currentNodeId,
      ).map((n) => n.id);
      if (
        !available.length ||
        JSON.stringify([...available].sort()) !==
          JSON.stringify([...r.offeredNodeIds].sort())
      )
        return null;
    }
    if (r.stats && Object.values(r.stats).some((n) => !finite(n, 0, 20)))
      return null;
    const rewardIds = [
      ...Object.values(ABILITY_IDS),
      ...Object.values(ARTIFACT_IDS),
      "heal-small",
      "gold-small",
      "grain-guard",
    ];
    const validRewards = (list) =>
      Array.isArray(list) &&
      list.length <= 8 &&
      list.every(
        (v) =>
          v &&
          rewardIds.includes(v.id) &&
          ["artifact", "ability", "heal", "gold", "summon"].includes(v.type) &&
          finite(v.value ?? 1, 0, 100) &&
          finite(v.price ?? 0, 0, 1000),
      );
    if (!validRewards(g.rewardChoices) || !validRewards(g.shopOffers))
      return null;
    if (g.scene === "reward" && !g.rewardChoices.length) return null;
    return {
      ...base,
      ...g,
      map: base.map,
      battle: null,
      run: { ...r },
      ui: {
        ...base.ui,
        muted: !!g.ui?.muted,
        selectedAbilityId: r.abilities.includes(g.ui?.selectedAbilityId)
          ? g.ui.selectedAbilityId
          : "egg-bomb",
        message: "Czas ruszać dalej — wyprawa wznowiona.",
      },
    };
  } catch {
    return null;
  }
}
