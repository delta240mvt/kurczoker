import assert from "node:assert/strict";
import test from "node:test";
import { ASSETS } from "../src/engine/assets/assetManifest.js";

const VALID_TYPES = new Set(["sprite", "model", "texture", "icon", "ui", "audio"]);
const VALID_LICENSES = new Set(["generated-owned", "CC0", "CC-BY", "commercial"]);

test("engine asset manifest has unique ids and required metadata", () => {
  const ids = new Set();
  for (const asset of ASSETS) {
    assert.ok(asset.id, "asset id is required");
    assert.equal(ids.has(asset.id), false, `duplicate asset id: ${asset.id}`);
    ids.add(asset.id);
    assert.ok(VALID_TYPES.has(asset.type), `invalid type for ${asset.id}`);
    assert.ok(asset.path.startsWith("/game/assets/"), `asset path must be static: ${asset.id}`);
    assert.ok(asset.source, `source is required: ${asset.id}`);
    assert.ok(Object.hasOwn(asset, "sourceUrl"), `sourceUrl key is required: ${asset.id}`);
    assert.ok(Object.hasOwn(asset, "author"), `author key is required: ${asset.id}`);
    assert.ok(VALID_LICENSES.has(asset.license), `invalid license: ${asset.id}`);
    assert.equal(typeof asset.attributionRequired, "boolean");
  }
});
