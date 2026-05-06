import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("deploy script requires CF_PAGES_PROJECT instead of hard-coded project names", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const deployScript = await readFile("tools/deploy-pages.mjs", "utf8");

  assert.equal(packageJson.scripts.deploy, "npm run build && node tools/deploy-pages.mjs");
  assert.match(deployScript, /CF_PAGES_PROJECT/);
  assert.match(deployScript, /wrangler/);
  assert.doesNotMatch(packageJson.scripts.deploy, /delta240-com/);
  assert.doesNotMatch(deployScript, /delta240-com/);
});
