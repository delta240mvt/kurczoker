import assert from "node:assert/strict";
import test from "node:test";
import { buildNodePositions } from "../src/engine/runtime/mapLayout.js";

test("buildNodePositions falls back for missing and non-finite depths", () => {
  const positions = buildNodePositions([
    { id: "start", depth: 0 },
    { id: "missing-depth" },
    { id: "nan-depth", depth: Number.NaN },
    { id: "deep", depth: 3 }
  ]);

  for (const id of ["start", "missing-depth", "nan-depth", "deep"]) {
    const position = positions.get(id);
    assert.equal(position.length, 3);
    assert.ok(position.every(Number.isFinite), `${id} has a non-finite position`);
  }

  assert.equal(positions.get("missing-depth")[0], positions.get("nan-depth")[0]);
});
