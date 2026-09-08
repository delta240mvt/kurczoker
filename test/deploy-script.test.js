import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {deploymentTarget} from '../tools/deploy-target.mjs';

test('preview and production cannot be confused',()=>{
 const config={projectName:'kurczoker-makeover',productionBranch:'main'};
 assert.throws(()=>deploymentTarget({branch:'main',production:false,config}));
 assert.throws(()=>deploymentTarget({branch:'baza080926-makeover',production:true,config}));
 assert.deepEqual(deploymentTarget({branch:'baza080926-makeover',production:false,config}),{branch:'baza080926-makeover',project:'kurczoker-makeover'});
 assert.deepEqual(deploymentTarget({branch:'main',production:true,config}),{branch:'main',project:'kurczoker-makeover'});
});

test("deploy script requires CF_PAGES_PROJECT instead of hard-coded project names", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const deployScript = await readFile("tools/deploy-pages.mjs", "utf8");

  assert.equal(packageJson.scripts.deploy, "npm run build && node tools/deploy-pages.mjs");
  assert.match(deployScript, /CF_PAGES_PROJECT/);
  assert.match(deployScript, /wrangler/);
  assert.doesNotMatch(packageJson.scripts.deploy, /delta240-com/);
  assert.doesNotMatch(deployScript, /delta240-com/);
});

test('deploy verifies the release manifest and reports actual commit state',async()=>{
 const source=await readFile('tools/deploy-pages.mjs','utf8');assert.match(source,/verifyRelease/);assert.doesNotMatch(source,/--commit-dirty=true/);assert.match(source,/sourceCommit/);
});
