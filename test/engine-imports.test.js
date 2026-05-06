import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const CLIENT_ROOTS = ["src/engine", "src/components", "src/pages"];
const CLIENT_FILE_PATTERN = /\.(astro|js|jsx|ts|tsx)$/;
const FORBIDDEN = [
  "@modelcontextprotocol",
  "@cloudflare/mcp-server-cloudflare",
  "cloudflare",
  "wrangler",
  "workers-sdk",
  "cloudflare/resources",
  "cloudflare/client",
  "threejs-devtools-mcp",
  "blender-mcp",
  "sketchfab",
  "hyper3d",
  "node:fs",
  "node:child_process"
];

function listClientFiles(dir) {
  return readdirSync(dir)
    .flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? listClientFiles(path) : [path];
    })
    .filter((path) => CLIENT_FILE_PATTERN.test(path));
}

test("client runtime does not import server-only MCP/API packages", () => {
  for (const root of CLIENT_ROOTS) {
    for (const file of listClientFiles(root)) {
      const source = readFileSync(file, "utf8");
      for (const forbidden of FORBIDDEN) {
        assert.equal(source.includes(forbidden), false, `${file} imports forbidden ${forbidden}`);
      }
    }
  }
});
