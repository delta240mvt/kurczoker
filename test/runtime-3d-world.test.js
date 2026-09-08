import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { arenaFor } from "../src/engine/tactical/arena.js";

test("release actors decode to real 3D geometry with idle, walk and attack animations within budget", async () => {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const manifest = JSON.parse(
    await readFile("src/engine/tactical/releaseManifest.json", "utf8"),
  );
  for (const entry of Object.values(manifest)) {
    const bytes = await readFile(`public${entry.url}`);
    assert.equal(bytes.length, entry.bytes);
    assert.ok(bytes.length < 100_000);
    const doc = await io.readBinary(bytes),
      root = doc.getRoot();
    assert.deepEqual(
      root.listAnimations().map((a) => a.getName()),
      ["Idle", "Walk", "Attack"],
    );
    const primitives = root.listMeshes().flatMap((m) => m.listPrimitives());
    assert.ok(
      primitives.length > 0 && primitives.length < 30,
      "merged render budget",
    );
    assert.ok(
      primitives.reduce(
        (n, p) => n + p.getAttribute("POSITION").getCount(),
        0,
      ) > 2000,
      "volumetric geometry remains after merging",
    );
    assert.equal(root.listTextures().length, 0);
    for (const animation of root.listAnimations())
      assert.ok(animation.listChannels().length > 2);
  }
});
test("each encounter has usable ground and elevated cover fits within it", () => {
  for (const type of ["battle", "elite", "boss"]) {
    const arena = arenaFor(type);
    const ground = arena.platforms[0];
    assert.ok(ground.width >= 13 && ground.height > 0);
    for (const p of arena.platforms.slice(1))
      assert.ok(Math.abs(p.x) <= ground.width / 2 && p.height > 0);
  }
});
