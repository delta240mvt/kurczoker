import { spawnSync } from "node:child_process";

const projectName = process.env.CF_PAGES_PROJECT;

if (!projectName) {
  console.error("CF_PAGES_PROJECT is required, for example: CF_PAGES_PROJECT=your-pages-project npm run deploy");
  process.exit(1);
}

const result = spawnSync("wrangler", ["pages", "deploy", "dist", "--project-name", projectName], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

process.exit(result.status ?? 1);
