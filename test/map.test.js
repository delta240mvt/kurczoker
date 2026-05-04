import test from "node:test";
import assert from "node:assert/strict";

import { NODE_TYPES } from "../src/game/constants.js";
import { createRunMap, getAvailableNodes, getNodeById } from "../src/game/map.js";

function findBossPath(map) {
  const queue = [["start"]];

  while (queue.length > 0) {
    const path = queue.shift();
    const current = getNodeById(map, path.at(-1));

    if (current?.type === NODE_TYPES.BOSS) {
      return path;
    }

    for (const nextNodeId of current?.nextNodeIds ?? []) {
      if (!path.includes(nextNodeId)) {
        queue.push([...path, nextNodeId]);
      }
    }
  }

  return null;
}

test("createRunMap returns the same graph for the same seed", () => {
  assert.deepEqual(createRunMap(11), createRunMap(11));
});

test("createRunMap contains required node types and valid edges", () => {
  const map = createRunMap(11);
  const nodesById = new Map(map.nodes.map((node) => [node.id, node]));
  const typeCounts = map.nodes.reduce((counts, node) => {
    counts[node.type] = (counts[node.type] ?? 0) + 1;
    return counts;
  }, {});
  const nonStartTypes = new Set(
    map.nodes
      .filter((node) => node.type !== NODE_TYPES.START)
      .map((node) => node.type)
  );

  assert.equal(typeCounts[NODE_TYPES.START], 1);
  assert.equal(typeCounts[NODE_TYPES.BOSS], 1);
  assert.ok(typeCounts[NODE_TYPES.BATTLE] >= 3);
  assert.ok(nonStartTypes.size >= 3);
  assert.ok(typeCounts[NODE_TYPES.TREASURE] >= 1 || typeCounts[NODE_TYPES.SHOP] >= 1);

  for (const edge of map.edges) {
    assert.ok(nodesById.has(edge.from), `missing edge source ${edge.from}`);
    assert.ok(nodesById.has(edge.to), `missing edge target ${edge.to}`);
    assert.ok(nodesById.get(edge.from).nextNodeIds.includes(edge.to));
  }
});

test("createRunMap has a complete 5-7 node path ending at boss", () => {
  const path = findBossPath(createRunMap(5));

  assert.ok(path, "expected a path to boss");
  assert.ok(path.length >= 5);
  assert.ok(path.length <= 7);
  assert.equal(path.at(-1), "boss");
});

test("getAvailableNodes returns uncompleted next nodes from current node", () => {
  const map = createRunMap(2);
  const firstChoices = getAvailableNodes(map, [], "start");
  const firstChoice = firstChoices[0];
  const afterChoice = getAvailableNodes(map, ["start", firstChoice.id], firstChoice.id);

  assert.ok(firstChoices.length >= 1);
  assert.ok(firstChoices.every((node) => node.depth === 1));
  assert.ok(afterChoice.every((node) => node.id !== firstChoice.id));
});
