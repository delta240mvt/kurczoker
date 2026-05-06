import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile, stat } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { extname, resolve, sep } from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { PNG } from "pngjs";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT_START = 47631;
const PORT_ATTEMPTS = 20;
const DIST_DIR = resolve(process.cwd(), "dist");
const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"]
]);

async function isPortFree(port) {
  const server = createNetServer();
  server.unref();
  server.listen({ host: HOST, port });

  try {
    await once(server, "listening");
    return true;
  } catch (error) {
    if (error.code === "EADDRINUSE" || error.code === "EACCES") {
      return false;
    }
    throw error;
  } finally {
    server.close();
  }
}

async function findDeterministicFreePort() {
  for (let offset = 0; offset < PORT_ATTEMPTS; offset += 1) {
    const port = PORT_START + offset;
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error(`No free static server port found from ${PORT_START} to ${PORT_START + PORT_ATTEMPTS - 1}`);
}

async function assertBuiltDist() {
  const indexPath = resolve(DIST_DIR, "index.html");
  try {
    const index = await stat(indexPath);
    assert.ok(index.isFile(), "dist/index.html should be a file");
  } catch (error) {
    throw new Error("Visual smoke test requires a prior static build. Run `npm run build` before `npm run test:visual`.");
  }
}

function staticFilePath(url) {
  const parsed = new URL(url, `http://${HOST}`);
  const decodedPath = decodeURIComponent(parsed.pathname);
  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const normalized = resolve(DIST_DIR, `.${requestedPath}`);
  const insideDist = normalized === DIST_DIR || normalized.startsWith(`${DIST_DIR}${sep}`);

  if (!insideDist) {
    return null;
  }

  return normalized;
}

async function sendStaticFile(response, filePath) {
  try {
    const file = await stat(filePath);
    if (!file.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": MIME_TYPES.get(extname(filePath)) ?? "application/octet-stream",
      "cache-control": "no-store"
    });
    response.end(await readFile(filePath));
  } catch (error) {
    response.writeHead(404);
    response.end("Not found");
  }
}

async function startStaticServer(port) {
  await assertBuiltDist();

  const server = createHttpServer((request, response) => {
    const filePath = staticFilePath(request.url ?? "/");
    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    void sendStaticFile(response, filePath);
  });

  server.listen({ host: HOST, port });
  await once(server, "listening");
  return server;
}

async function waitForServer(url) {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < 30000) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(250);
  }

  throw new Error(`static server was not ready after 30s: ${lastError?.message ?? "unknown error"}`);
}

async function stopStaticServer(server) {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function assertServerStopped(port) {
  assert.equal(await isPortFree(port), true, `static server port ${port} should be free after cleanup`);
}

async function getCanvasShot(page) {
  const buffer = await page.locator(".kurczoker-r3f canvas").screenshot({ animations: "disabled" });
  return PNG.sync.read(buffer);
}

async function waitForCanvasReady(page, label) {
  const canvas = page.locator(".kurczoker-r3f canvas");
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.waitForLoadState("load", { timeout: 15000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await canvas.waitFor({ state: "visible", timeout: 15000 });
      await page.waitForFunction(
        () => {
          const canvasElement = document.querySelector(".kurczoker-r3f canvas");
          const box = canvasElement?.getBoundingClientRect();
          return Boolean(box && box.width > 8 && box.height > 8);
        },
        null,
        { timeout: 15000 }
      );
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await page.reload({ waitUntil: "load" });
      }
    }
  }

  throw new Error(`${label} canvas was not ready: ${lastError?.message ?? "unknown error"}`);
}

function sampledPixels(image) {
  const pixels = [];
  const stepX = Math.max(1, Math.floor(image.width / 24));
  const stepY = Math.max(1, Math.floor(image.height / 18));

  for (let y = 0; y < image.height; y += stepY) {
    for (let x = 0; x < image.width; x += stepX) {
      const offset = (image.width * y + x) * 4;
      pixels.push([image.data[offset], image.data[offset + 1], image.data[offset + 2], image.data[offset + 3]]);
    }
  }

  return pixels;
}

function assertNonblankShot(image, label) {
  assert.ok(image.width > 0 && image.height > 0, `${label} screenshot should decode to dimensions`);
  const samples = sampledPixels(image);
  const visible = samples.filter(([red, green, blue, alpha]) => alpha > 0 && red + green + blue > 24);
  const colors = new Set(samples.map(([red, green, blue, alpha]) => `${red},${green},${blue},${alpha}`));

  assert.ok(visible.length >= Math.max(8, samples.length * 0.1), `${label} screenshot should contain visible pixels`);
  assert.ok(colors.size >= 8, `${label} screenshot should contain varied decoded pixel colors`);
}

function countChangedPixels(before, after) {
  assert.equal(before.width, after.width, "screenshots should have equal width for pixel diff");
  assert.equal(before.height, after.height, "screenshots should have equal height for pixel diff");

  let changed = 0;
  const pixelCount = before.width * before.height;

  for (let offset = 0; offset < before.data.length; offset += 4) {
    const delta =
      Math.abs(before.data[offset] - after.data[offset]) +
      Math.abs(before.data[offset + 1] - after.data[offset + 1]) +
      Math.abs(before.data[offset + 2] - after.data[offset + 2]) +
      Math.abs(before.data[offset + 3] - after.data[offset + 3]);

    if (delta > 24) {
      changed += 1;
    }
  }

  return {
    changed,
    ratio: changed / pixelCount
  };
}

function assertChangedPixels(before, after, label) {
  const diff = countChangedPixels(before, after);

  assert.ok(diff.changed >= 250 || diff.ratio >= 0.002, `${label} should change decoded pixels; changed=${diff.changed} ratio=${diff.ratio}`);
}

test("r3f game renders and advances through map and battle", { timeout: 90000 }, async () => {
  const port = await findDeterministicFreePort();
  const baseUrl = `http://${HOST}:${port}`;
  const server = await startStaticServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch();

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForCanvasReady(desktop, "desktop");
    assertNonblankShot(await getCanvasShot(desktop), "desktop map");

    const route = desktop.locator(".map-route-actions__btn").first();
    await route.waitFor({ state: "visible" });
    const beforeRoute = await getCanvasShot(desktop);
    await route.click();
    await desktop.waitForFunction(() => !document.querySelector(".map-route-actions__btn"));
    await desktop.locator("[data-game-scene]").waitFor({ state: "visible" });
    await expectText(desktop, "[data-game-scene]", /Walka/);
    await delay(500);
    const afterRoute = await getCanvasShot(desktop);
    assertChangedPixels(beforeRoute, afterRoute, "clicking a route");

    const canvasBox = await desktop.locator(".kurczoker-r3f canvas").boundingBox();
    assert.ok(canvasBox, "battle canvas should have a bounding box");
    const beforeFire = await getCanvasShot(desktop);
    await desktop.mouse.move(canvasBox.x + canvasBox.width * 0.74, canvasBox.y + canvasBox.height * 0.36, { steps: 8 });
    await desktop.mouse.click(canvasBox.x + canvasBox.width * 0.74, canvasBox.y + canvasBox.height * 0.36);
    await desktop.locator("[data-game-message]").waitFor({ state: "visible" });
    await desktop.waitForFunction(() => /Tura wroga|Trafienie/.test(document.querySelector("[data-game-message]")?.textContent ?? ""));
    const afterFire = await getCanvasShot(desktop);
    assertChangedPixels(beforeFire, afterFire, "aiming and firing");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await mobile.goto(baseUrl, { waitUntil: "load" });
    await waitForCanvasReady(mobile, "mobile");
    assertNonblankShot(await getCanvasShot(mobile), "mobile map");
  } finally {
    await browser?.close();
    await stopStaticServer(server);
    await assertServerStopped(port);
  }
});

async function expectText(page, selector, pattern) {
  await page.waitForFunction(
    ({ selector: targetSelector, source, flags }) => {
      const text = document.querySelector(targetSelector)?.textContent ?? "";
      return new RegExp(source, flags).test(text);
    },
    { selector, source: pattern.source, flags: pattern.flags }
  );
}
