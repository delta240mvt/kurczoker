import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {deploymentTarget} from './deploy-target.mjs';
import {verifyRelease} from './release-integrity.mjs';

if (existsSync(".env")) process.loadEnvFile(".env");
const config = JSON.parse(readFileSync("tools/pages.config.json", "utf8"));
const project = process.env.CF_PAGES_PROJECT || config.projectName;
const args = process.argv.slice(2),
  production = args.includes("--production");
const explicit = args.indexOf("--branch");
const branch =
  explicit >= 0
    ? args[explicit + 1]
    : execFileSync("git", ["branch", "--show-current"], {
        encoding: "utf8",
      }).trim();
deploymentTarget({branch,production,config:{...config,projectName:project}});
if (!existsSync("dist/release-report.json"))
  throw new Error("Run npm run build first.");
const report=await verifyRelease('dist');
const dirty=!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();
if(production&&(dirty||report.dirty))throw new Error('Production requires a clean checkout and a build from a clean source.');
// Documentation commits may follow preview QA; the tested source must remain an ancestor.
execFileSync('git',['merge-base','--is-ancestor',report.sourceCommit,'HEAD']);
const result = spawnSync(
  process.execPath,
  [
    resolve("node_modules/wrangler/bin/wrangler.js"),
    "pages",
    "deploy",
    "dist",
    "--project-name",
    project,
    "--branch",
    branch,
    '--commit-hash',report.sourceCommit,
    '--commit-dirty='+String(report.dirty||dirty),
  ],
  { stdio: "inherit", env: process.env },
);
process.exit(result.status ?? 1);
