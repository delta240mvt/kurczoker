import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
const base = new URL(process.argv[2]);
if (base.protocol !== "https:")
  throw new Error("Verify the deployed HTTPS preview.");
const manifest = JSON.parse(
  await readFile("src/engine/tactical/releaseManifest.json", "utf8"),
);
async function walk(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name),
      ),
    )
  ).flat();
}
const paths = (await walk("dist"))
  .map((p) => "/" + relative("dist", p).replaceAll("\\", "/"))
  .filter((p) => p !== "/_headers");
const results = [];
const release = JSON.parse(await readFile('dist/release-report.json', 'utf8'));
const deployedRelease = await fetch(new URL('/release-report.json', base)).then(r => r.json());
if (JSON.stringify(deployedRelease) !== JSON.stringify(release))
  throw new Error('Deployed release report differs from the tested build.');
for (let offset = 0; offset < paths.length; offset += 8) {
  results.push(
    ...(await Promise.all(
      paths.slice(offset, offset + 8).map(async (path) => {
        const r = await fetch(new URL(path, base), { method: "HEAD" });
        if (r.status !== 200) throw new Error(`${r.status} ${path}`);
        const type = r.headers.get("content-type"),
          cache = r.headers.get("cache-control");
        if (path.endsWith(".glb") && !type?.includes("model/gltf-binary"))
          throw new Error(`Wrong GLB MIME: ${path}`);
        if (path.endsWith(".js") && !type?.includes("javascript"))
          throw new Error(`Wrong JS MIME: ${path}`);
        if (
          (path.startsWith("/_astro/") || path.startsWith("/game/release/")) &&
          !cache?.includes("immutable")
        )
          throw new Error(`Cache missing: ${path}`);
        const expected = release.files.find(f => '/'+f.path === path);
        if (expected) {
          const remote = Buffer.from(await fetch(new URL(path, base)).then(r => r.arrayBuffer()));
          if (createHash('sha256').update(remote).digest('hex') !== expected.sha256)
            throw new Error(`Deployed file differs from tested build: ${path}`);
        }
        return { path, status: r.status, type, cache, hashMatches: !!expected };
      }),
    )),
  );
}
for (const m of manifest.assets) {
  const response = await fetch(new URL(m.url, base)),
    remote = Buffer.from(await response.arrayBuffer()),
    local = await readFile(`public${m.url}`);
  const hash = (b) => createHash("sha256").update(b).digest("hex");
  if (hash(remote) !== hash(local))
    throw new Error(`Model differs from tested build: ${m.url}`);
}
const report = {
  base: base.href,
  checkedFiles: results.length,
  modelsMatch: true,
  sourceCommit: release.sourceCommit,
  releaseMatches: true,
  results,
};
await writeFile(
  ".superpowers/makeover-qa/cloudflare-http.json",
  JSON.stringify(report, null, 2),
);
console.log(
  `${results.length} deployed files: HTTP 200, JavaScript/GLB MIME and immutable cache PASS; release report and all served file hashes match.`,
);
