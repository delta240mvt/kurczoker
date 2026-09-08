import { readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { resolve, join, sep } from "node:path";
import {execFileSync} from 'node:child_process';
import {releaseFiles} from './release-integrity.mjs';
const root = resolve("dist");
// Astro copies public recursively. Source generations are kept in the repo, never in the release.
const drafts = resolve(root, "game/assets");
if (!drafts.startsWith(root + sep))
  throw new Error("Release path escaped dist");
await rm(drafts, { recursive: true, force: true });
// Superseded landing screenshots are source references, not release assets.
const oldScreens=resolve(root,'uix/screeny');
if(!oldScreens.startsWith(root+sep))throw new Error('Release path escaped dist');
await rm(oldScreens,{recursive:true,force:true});
const manifest = JSON.parse(
  await readFile("src/engine/tactical/releaseManifest.json", "utf8"),
);
const allowed = new Set(
  manifest.assets.map((m) => m.url.split("/").pop()),
);
for (const file of await readdir(join(root, "game/release"))) {
  if (!allowed.has(file)) await rm(join(root, "game/release", file));
}
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : join(dir, e.name),
      ),
    )
  ).flat();
}
const sizes = await Promise.all(
  (await files(root)).map(async (p) => ({
    file: p.slice(root.length + 1).replaceAll("\\", "/"),
    bytes: (await stat(p)).size,
  })),
);
const oversize = sizes.filter((s) => s.bytes > 25 * 1024 ** 2);
if (oversize.length)
  throw new Error(
    `Cloudflare Pages 25 MiB file limit exceeded: ${JSON.stringify(oversize)}`,
  );
const game = sizes.filter(
  (s) =>
    (s.file.startsWith("_astro/") && /\.(js|wasm|css)$/.test(s.file)) ||
    s.file.startsWith("game/release/"),
);
const budget = game.reduce((a, s) => a + s.bytes, 0);
if (budget > 10 * 1024 ** 2)
  throw new Error(`Game payload exceeds 10 MiB: ${budget}`);
const report = {
  sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),
  files:await releaseFiles(root),
  maxFileBytes:25*1024**2,
  totalBytes: sizes.reduce((a, s) => a + s.bytes, 0),
  gameUncompressedBytes: budget,
  modelsBytes: manifest.assets.filter(a=>a.kind==='model').reduce((a, m) => a + m.bytes, 0),
  largestFiles: sizes.sort((a, b) => b.bytes - a.bytes).slice(0, 8),
};
await writeFile("dist/release-report.json", JSON.stringify(report, null, 2));
const {files:integrity,...summary}=report;
console.log("Release asset budget:", JSON.stringify({...summary,verifiedFiles:integrity.length}, null, 2));
