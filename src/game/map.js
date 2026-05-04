export function createRunMap() {
  return { nodes: [], edges: [] };
}

export function getAvailableNodes() {
  return [];
}

export function getNodeById(map, nodeId) {
  return map.nodes.find((node) => node.id === nodeId) ?? null;
}
