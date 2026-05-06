import assert from "node:assert/strict";
import test from "node:test";

import astroConfig from "../astro.config.mjs";

const manualChunks = astroConfig.vite?.build?.rollupOptions?.output?.manualChunks;

test("vite manualChunks splits stable React and R3F vendors without eager Rapier", () => {
  assert.equal(typeof manualChunks, "function", "Astro config should define a manualChunks function");

  const reactId = "C:/repo/node_modules/react-dom/client.js";
  const fiberId = "C:/repo/node_modules/@react-three/fiber/dist/react-three-fiber.esm.js";
  const dreiId = "C:/repo/node_modules/@react-three/drei/index.js";
  const threeId = "C:/repo/node_modules/three/build/three.module.js";
  const schedulerId = "C:/repo/node_modules/scheduler/index.js";
  const rapierId = "C:/repo/node_modules/@react-three/rapier/dist/react-three-rapier.esm.js";

  assert.equal(manualChunks(reactId), "vendor-react");
  assert.equal(manualChunks(schedulerId), "vendor-react");
  assert.equal(manualChunks(fiberId), "vendor-r3f");
  assert.equal(manualChunks(dreiId), "vendor-r3f");
  assert.equal(manualChunks(threeId), "vendor-r3f");
  assert.equal(manualChunks(rapierId), undefined, "Rapier should stay with the lazy BattleScene chunk");
});
