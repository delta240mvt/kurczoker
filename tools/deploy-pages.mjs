import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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
if (!branch || !/^[\w./-]+$/.test(branch))
  throw new Error("A valid named branch is required.");
if (branch === config.productionBranch && !production)
  throw new Error(
    "Use --production explicitly after preview QA to publish the production branch.",
  );
if (!existsSync("dist/release-report.json"))
  throw new Error("Run npm run build first.");
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
    "--commit-dirty=true",
  ],
  { stdio: "inherit", env: process.env },
);
process.exit(result.status ?? 1);
