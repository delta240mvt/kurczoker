function normalizeDepth(depth) {
  return Number.isFinite(depth) ? depth : 0;
}

export function buildNodePositions(nodes) {
  if (nodes.length === 0) {
    return new Map();
  }

  const normalizedNodes = nodes.map((node) => ({
    ...node,
    depth: normalizeDepth(node.depth)
  }));
  const byDepth = new Map();

  for (const node of normalizedNodes) {
    const depthNodes = byDepth.get(node.depth) ?? [];
    depthNodes.push(node);
    byDepth.set(node.depth, depthNodes);
  }

  const maxDepth = Math.max(...normalizedNodes.map((node) => node.depth), 1);
  const xStep = 8.2 / maxDepth;
  const positions = new Map();

  for (const [depth, depthNodes] of byDepth.entries()) {
    const yStep = 1.26;
    const startY = ((depthNodes.length - 1) * yStep) / 2;
    depthNodes.forEach((node, index) => {
      const branchOffset = depth % 2 === 0 ? 0.08 : -0.08;
      positions.set(node.id, [(depth - maxDepth / 2) * xStep, startY - index * yStep + branchOffset, 0]);
    });
  }

  return positions;
}
