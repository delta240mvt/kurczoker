import assert from "node:assert/strict";
import { parse } from "@babel/parser";
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

function extractAstroScripts(source) {
  const scripts = [];
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatter) {
    scripts.push(frontmatter[1]);
  }

  for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    scripts.push(match[1]);
  }

  return scripts;
}

function extractImportSpecifiers(source) {
  const specifiers = new Set();
  const scripts = extractAstroScripts(source);
  const parseTargets = scripts.length > 0 ? scripts : [source];

  for (const code of parseTargets) {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "dynamicImport", "importMeta", "topLevelAwait"]
    });
    collectImportSpecifiers(ast, specifiers);
  }

  return [...specifiers];
}

function collectImportSpecifiers(node, specifiers) {
  if (!node || typeof node !== "object") return;

  if (
    (node.type === "ImportDeclaration" ||
      node.type === "ExportNamedDeclaration" ||
      node.type === "ExportAllDeclaration") &&
    node.source?.type === "StringLiteral"
  ) {
    specifiers.add(node.source.value);
  }

  if (node.type === "ImportExpression" && node.source?.type === "StringLiteral") {
    specifiers.add(node.source.value);
  }

  if (
    node.type === "CallExpression" &&
    node.callee?.type === "Import" &&
    node.arguments[0]?.type === "StringLiteral"
  ) {
    specifiers.add(node.arguments[0].value);
  }

  for (const [key, value] of Object.entries(node)) {
    if (
      key === "loc" ||
      key === "start" ||
      key === "end" ||
      key === "comments" ||
      key === "leadingComments" ||
      key === "trailingComments" ||
      key === "innerComments"
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        collectImportSpecifiers(child, specifiers);
      }
    } else if (value && typeof value === "object") {
      collectImportSpecifiers(value, specifiers);
    }
  }
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
    /* import "threejs-devtools-mcp"; */
    const label = "Open cloudflare docs before deploy";
    import { SceneLights } from "./components/SceneLights.jsx";
  `;

  assert.deepEqual(findForbiddenImportSpecifiers(source), []);
});

test("import guard ignores dynamic import syntax inside strings and comments", () => {
  const source = `
    // await import("fs");
    const snippet = 'await import("fs")';
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
