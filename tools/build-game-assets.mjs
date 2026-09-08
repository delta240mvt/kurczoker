import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, weld, meshopt, prune, join } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });
const manifest = {};
await mkdir("public/game/release", { recursive: true });
for (const name of ["hero-chicken", "enemy-rooster", "boss-rooster"]) {
  const doc = await io.read(
    `public/game/assets/models/true-3d-characters/true-${name}.glb`,
  );
  const root = doc.getRoot(),
    buffer = root.listBuffers()[0];
  const nodes = root
    .listNodes()
    .filter((n) => /leg_|foot_|wing/.test(n.getName()));
  for (const [clip, duration, amplitude] of [
    ["Idle", 2.4, 0.035],
    ["Walk", 0.5, 0.4],
    ["Attack", 0.4, 0.7],
  ]) {
    const animation = doc.createAnimation(clip);
    const time = doc
      .createAccessor()
      .setType("SCALAR")
      .setArray(
        new Float32Array([
          0,
          duration / 4,
          duration / 2,
          (duration * 3) / 4,
          duration,
        ]),
      )
      .setBuffer(buffer);
    nodes.forEach((node, index) => {
      const base = node.getRotation(),
        values = [];
      for (let i = 0; i < 5; i++) {
        const a =
          (Math.sin((i * Math.PI) / 2 + index * Math.PI) * amplitude) / 2;
        // Local Y quaternion multiplied by the model's original orientation.
        const s = Math.sin(a),
          c = Math.cos(a),
          [x, y, z, w] = base;
        values.push(x * c - z * s, y * c + w * s, z * c + x * s, w * c - y * s);
      }
      const output = doc
        .createAccessor()
        .setType("VEC4")
        .setArray(new Float32Array(values))
        .setBuffer(buffer);
      const sampler = doc
        .createAnimationSampler()
        .setInput(time)
        .setOutput(output)
        .setInterpolation("LINEAR");
      animation
        .addSampler(sampler)
        .addChannel(
          doc
            .createAnimationChannel()
            .setTargetNode(node)
            .setTargetPath("rotation")
            .setSampler(sampler),
        );
    });
  }
  await doc.transform(
    dedup(),
    join({ filter: (node) => !/leg_|foot_|wing/.test(node.getName()) }),
    weld(),
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: "high" }),
  );
  const bytes = await io.writeBinary(doc),
    hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const file = `${name}.${hash}.glb`;
  await writeFile(`public/game/release/${file}`, bytes);
  manifest[name] = {
    url: `/game/release/${file}`,
    bytes: bytes.length,
    animations: ["Idle", "Walk", "Attack"],
    source:
      "Original procedural mesh: tools/generate-true-3d-chicken-actors.mjs",
    compression: "EXT_meshopt_compression; material colors, no raster textures",
  };
}
await writeFile(
  "src/engine/tactical/releaseManifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(JSON.stringify(manifest, null, 2));
