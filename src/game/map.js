import { NODE_TYPES } from "./constants.js";

const NODE_LABELS = {
  [NODE_TYPES.START]: "Kurnik startowy",
  [NODE_TYPES.BATTLE]: "Zadyma na grzedzie",
  [NODE_TYPES.ELITE]: "Elitarny kogut",
  [NODE_TYPES.TREASURE]: "Skrzynia ziaren",
  [NODE_TYPES.SHOP]: "Stragan nioski",
  [NODE_TYPES.BOSS]: "Krol kurnika"
};

function makeNode(id, type, depth, nextNodeIds, payload = {}) {
  return {
    id,
    type,
    label: NODE_LABELS[type],
    depth,
    nextNodeIds,
    payload
  };
}

function addSeededEncounter(id, seed) {
  return {
    encounterId: `${id}-seed-${seed}`,
    rewardTier: 1
  };
}

export function createRunMap(seed = 1) {
  const rewardFirst = seed % 2 === 0;
  const depthTwoNodes = rewardFirst
    ? [
        makeNode("treasure-1", NODE_TYPES.TREASURE, 2, ["battle-2"], { rewardTier: 2 }),
        makeNode("shop-1", NODE_TYPES.SHOP, 2, ["battle-2"], { rewardTier: 1 })
      ]
    : [
        makeNode("shop-1", NODE_TYPES.SHOP, 2, ["battle-2"], { rewardTier: 1 }),
        makeNode("treasure-1", NODE_TYPES.TREASURE, 2, ["battle-2"], { rewardTier: 2 })
      ];

  const nodes = [
    makeNode("start", NODE_TYPES.START, 0, ["battle-1"]),
    makeNode("battle-1", NODE_TYPES.BATTLE, 1, ["treasure-1", "shop-1"], addSeededEncounter("battle-1", seed)),
    ...depthTwoNodes,
    makeNode("battle-2", NODE_TYPES.BATTLE, 3, ["elite-1", "battle-3"], addSeededEncounter("battle-2", seed)),
    makeNode("elite-1", NODE_TYPES.ELITE, 4, ["battle-3"], { ...addSeededEncounter("elite-1", seed), rewardTier: 2 }),
    makeNode("battle-3", NODE_TYPES.BATTLE, 5, ["boss"], addSeededEncounter("battle-3", seed)),
    makeNode("boss", NODE_TYPES.BOSS, 6, [], { ...addSeededEncounter("boss", seed), rewardTier: 3 })
  ];

  return {
    nodes,
    edges: nodes.flatMap((node) =>
      node.nextNodeIds.map((nextNodeId) => ({
        from: node.id,
        to: nextNodeId
      }))
    )
  };
}

export function getAvailableNodes(map, completedNodeIds = [], currentNodeId = "start") {
  const currentNode = getNodeById(map, currentNodeId);
  const completed = new Set(completedNodeIds);

  return (currentNode?.nextNodeIds ?? [])
    .filter((nodeId) => !completed.has(nodeId))
    .map((nodeId) => getNodeById(map, nodeId))
    .filter(Boolean);
}

export function getNodeById(map, nodeId) {
  return map.nodes.find((node) => node.id === nodeId) ?? null;
}
