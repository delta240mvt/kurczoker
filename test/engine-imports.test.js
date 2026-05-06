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
  "fs",
  "fs/promises",
  "child_process",
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

function stripComments(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function extractImportSpecifiers(source) {
  const specifiers = new Set();
  const code = stripComments(source);
  const patterns = [
    /^\s*import\s+(?:[^;]*?\s+from\s*)?["']([^"']+)["']/gm,
    /^\s*export\s+[^;]*?\s+from\s*["']([^"']+)["']/gm,
    /(?<!["'`])\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];

  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }

  return [...specifiers];
}

function isForbiddenSpecifier(specifier, forbidden) {
  return specifier === forbidden || specifier.startsWith(`${forbidden}/`);
}

function findForbiddenImportSpecifiers(source) {
  return extractImportSpecifiers(source).filter((specifier) =>
    FORBIDDEN.some((forbidden) => isForbiddenSpecifier(specifier, forbidden))
  );
}

test("import guard ignores forbidden words outside import specifiers", () => {
  const source = `
    // cloudflare stays in dev tooling notes only.
    // import cloudflare from "cloudflare";
    /* export { helper } from "wrangler"; */
    <!-- import "threejs-devtools-mcp" -->
    const label = "Open cloudflare docs before deploy";
    import { SceneLights } from "./components/SceneLights.jsx";
  `;

  assert.deepEqual(findForbiddenImportSpecifiers(source), []);
});

test("import guard blocks bare and dynamic Node builtin imports", () => {
  const source = `
    import fs from "fs";
    const promises = await import("fs/promises");
  `;

  assert.deepEqual(findForbiddenImportSpecifiers(source), ["fs", "fs/promises"]);
});

test("client runtime does not import server-only MCP/API packages", () => {
  for (const root of CLIENT_ROOTS) {
    for (const file of listClientFiles(root)) {
      const source = readFileSync(file, "utf8");
      for (const specifier of findForbiddenImportSpecifiers(source)) {
        assert.fail(`${file} imports forbidden ${specifier}`);
      }
    }
  }
});
