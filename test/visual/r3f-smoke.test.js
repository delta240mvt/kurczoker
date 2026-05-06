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
const EXTERNAL_BASE_URL = process.env.KURCZOKER_VISUAL_BASE_URL;
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

async function getShellShot(page) {
  const buffer = await page.locator("[data-game-shell]").screenshot({ animations: "disabled" });
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

const POST_FIRE_MESSAGE_PATTERN = /Tura wroga|Trafienie/;
const POST_FIRE_SCENE_PATTERN = /Nagroda|Skarb|Sklep|Koniec|Zwycięstwo/;

function acceptsPostFireOutcome(message, scene) {
  return POST_FIRE_MESSAGE_PATTERN.test(message) || POST_FIRE_SCENE_PATTERN.test(scene);
}

test("post-fire outcome accepts lethal battle transitions", () => {
  assert.equal(acceptsPostFireOutcome("Trafienie za 2.", "Walka"), true);
  assert.equal(acceptsPostFireOutcome("Tura wroga.", "Walka"), true);
  assert.equal(acceptsPostFireOutcome("", "Nagroda"), true);
  assert.equal(acceptsPostFireOutcome("", "Sklep"), true);
  assert.equal(acceptsPostFireOutcome("", "Koniec"), true);
  assert.equal(acceptsPostFireOutcome("", "Zwycięstwo"), true);
  assert.equal(acceptsPostFireOutcome("Wybierz szlak.", "Mapa"), false);
});

const POST_FIRE_OUTCOME_WAIT = {
  messageSource: POST_FIRE_MESSAGE_PATTERN.source,
  sceneSource: POST_FIRE_SCENE_PATTERN.source
};

async function waitForPostFireOutcome(page, timeout = 12000) {
  await page.waitForFunction(
    ({ messageSource, sceneSource }) => {
      const message = document.querySelector("[data-game-message]")?.textContent ?? "";
      const scene = document.querySelector("[data-game-scene]")?.textContent ?? "";
      return new RegExp(messageSource).test(message) || new RegExp(sceneSource).test(scene);
    },
    POST_FIRE_OUTCOME_WAIT,
    { timeout }
  );
}

async function sceneText(page) {
  return page.locator("[data-game-scene]").textContent();
}

async function messageText(page) {
  return page.locator("[data-game-message]").textContent();
}

async function waitForPlayerTurn(page, timeout = 20000) {
  await page.waitForFunction(
    ({ sceneSource, messageSource }) => {
      const scene = document.querySelector("[data-game-scene]")?.textContent ?? "";
      const phase = document.querySelector("[data-game-shell]")?.getAttribute("data-game-phase") ?? "";
      const message = document.querySelector("[data-game-message]")?.textContent ?? "";
      if (!new RegExp(sceneSource).test(scene)) return true;
      if (phase === "player-turn") return true;
      return !new RegExp(messageSource).test(message);
    },
    { sceneSource: "Walka|Boss", messageSource: "Tura wroga" },
    { timeout }
  );
}

async function assertPlayableScreen(page, label, scenePattern) {
  await expectText(page, "[data-game-scene]", scenePattern);
  await assertResponsiveLayout(page, label);
  assertNonblankShot(await getShellShot(page), `${label} shell`);
  assertNonblankShot(await getCanvasShot(page), `${label} canvas`);
}

async function assertResponsiveLayout(page, label) {
  const metrics = await page.evaluate(() => {
    const readRect = (selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
    };
    const viewportWidth = document.documentElement.clientWidth;
    const overflowing = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 1 && (rect.left < -1 || rect.right > viewportWidth + 1);
      })
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName,
        className: typeof element.className === "string" ? element.className : "",
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
        width: element.getBoundingClientRect().width
      }));

    return {
      viewportWidth,
      viewportHeight: document.documentElement.clientHeight,
      scrollWidth: document.documentElement.scrollWidth,
      shell: readRect("[data-game-shell]"),
      canvas: readRect(".shell__canvas"),
      topbar: readRect(".shell__topbar"),
      overflowing,
      routeButtons: [...document.querySelectorAll(".map-route-actions__btn")].map((button) => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
      actionButtons: [...document.querySelectorAll(".shell-actions .btn")].map((button) => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })
    };
  });

  assert.equal(metrics.scrollWidth, metrics.viewportWidth, `${label} should not create horizontal page overflow`);
  assert.deepEqual(metrics.overflowing, [], `${label} should not have horizontally overflowing elements`);
  assert.ok(metrics.shell?.left >= -0.5 && metrics.shell?.right <= metrics.viewportWidth + 0.5, `${label} shell should fit viewport`);
  assert.ok(metrics.canvas?.width >= 300, `${label} canvas should preserve a playable width`);
  assert.ok(metrics.canvas?.height >= 168, `${label} canvas should preserve a playable height`);

  if (metrics.viewportWidth <= 700) {
    assert.ok(metrics.topbar?.height <= 170, `${label} mobile topbar should stay compact`);
    assert.ok(metrics.canvas?.top <= 275, `${label} mobile canvas should start high enough for gameplay`);
    for (const button of [...metrics.routeButtons, ...metrics.actionButtons]) {
      assert.ok(button.height >= 40, `${label} mobile touch targets should be at least 40px tall`);
    }
  }
}

async function clickRoute(page, routeId) {
  const routeType = routeId.split("-")[0];
  const route = page
    .locator(".map-route-actions__btn")
    .filter({ has: page.locator(".map-route-actions__type", { hasText: new RegExp(`^${routeType}$`) }) })
    .first();
  await route.waitFor({ state: "visible", timeout: 15000 });
  await route.click();
  await page.waitForFunction(() => !document.querySelector(".map-route-actions__btn"), null, { timeout: 15000 });
  await page.waitForFunction(() => !/Mapa/.test(document.querySelector("[data-game-scene]")?.textContent ?? ""), null, { timeout: 15000 });
  await delay(700);
}

async function fireAt(page, xRatio = 0.82, yRatio = 0.36) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await waitForPlayerTurn(page);
    const canvasBox = await page.locator(".kurczoker-r3f canvas").boundingBox();
    assert.ok(canvasBox, "battle canvas should have a bounding box");
    await page.mouse.move(canvasBox.x + canvasBox.width * xRatio, canvasBox.y + canvasBox.height * yRatio, { steps: 8 });
    await page.mouse.click(canvasBox.x + canvasBox.width * xRatio, canvasBox.y + canvasBox.height * yRatio);

    try {
      await waitForPostFireOutcome(page);
      await delay(1200);
      return;
    } catch (error) {
      if (attempt === 3) {
        const scene = await sceneText(page);
        const message = await messageText(page);
        throw new Error(`Firing did not produce a battle outcome after ${attempt} attempts; scene=${scene}; message=${message}; ${error.message}`);
      }
      await delay(700);
    }
  }
  await delay(1200);
}

async function winCurrentBattle(page, label, maxShots = 6, expectedScenePattern = null) {
  for (let shot = 0; shot < maxShots; shot += 1) {
    const scene = await sceneText(page);
    if (!/Walka|Boss/.test(scene ?? "")) {
      if (expectedScenePattern) {
        await expectText(page, "[data-game-scene]", expectedScenePattern);
      }
      return;
    }
    await fireAt(page);
  }

  const scene = await sceneText(page);
  assert.ok(!/Walka|Boss/.test(scene ?? ""), `${label} should finish within ${maxShots} shots, current scene: ${scene}`);
  if (expectedScenePattern) {
    await expectText(page, "[data-game-scene]", expectedScenePattern);
  }
}

async function loseCurrentBattle(page, label, maxShots = 6) {
  for (let shot = 0; shot < maxShots; shot += 1) {
    const scene = await sceneText(page);
    if (/Koniec/.test(scene ?? "")) {
      return;
    }

    await fireAt(page, 0.2, 0.52);
    await delay(9000);
    if (/Koniec/.test((await sceneText(page)) ?? "")) {
      return;
    }
    await waitForPlayerTurn(page, 30000);
  }

  await page.waitForFunction(
    () => /Koniec/.test(document.querySelector("[data-game-scene]")?.textContent ?? ""),
    null,
    { timeout: 30000 }
  );
  const scene = await sceneText(page);
  assert.ok(/Koniec/.test(scene ?? ""), `${label} should reach game over within ${maxShots} misses, current scene: ${scene}`);
}

async function chooseReward(page, preferredNamePattern) {
  const preferred = preferredNamePattern ? page.locator(".reward-card").filter({ hasText: preferredNamePattern }).first() : null;
  const card = preferred && (await preferred.count()) > 0 ? preferred : page.locator(".reward-card").first();
  await card.waitFor({ state: "visible", timeout: 15000 });
  await card.click();
  await expectText(page, "[data-game-scene]", /Mapa/);
}

test("r3f game renders and advances through map and battle", { timeout: 90000 }, async () => {
  const port = EXTERNAL_BASE_URL ? null : await findDeterministicFreePort();
  const baseUrl = EXTERNAL_BASE_URL ?? `http://${HOST}:${port}`;
  const server = EXTERNAL_BASE_URL ? null : await startStaticServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch();

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForCanvasReady(desktop, "desktop");
    await assertResponsiveLayout(desktop, "desktop map");
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
    await fireAt(desktop);
    const afterFire = await getCanvasShot(desktop);
    assertChangedPixels(beforeFire, afterFire, "aiming and firing");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mobile.goto(baseUrl, { waitUntil: "load" });
    await waitForCanvasReady(mobile, "mobile");
    await assertResponsiveLayout(mobile, "mobile map");
    const mobileMap = await getCanvasShot(mobile);
    assertNonblankShot(mobileMap, "mobile map");

    const mobileRoute = mobile.locator(".map-route-actions__btn").first();
    await mobileRoute.waitFor({ state: "visible" });
    await mobileRoute.click();
    await mobile.waitForFunction(() => !document.querySelector(".map-route-actions__btn"));
    await expectText(mobile, "[data-game-scene]", /Walka/);
    await delay(500);
    await assertResponsiveLayout(mobile, "mobile battle");
    const mobileBattle = await getCanvasShot(mobile);
    assertNonblankShot(mobileBattle, "mobile battle");
    assertChangedPixels(mobileMap, mobileBattle, "mobile route transition");

    const mobileCanvasBox = await mobile.locator(".kurczoker-r3f canvas").boundingBox();
    assert.ok(mobileCanvasBox, "mobile battle canvas should have a bounding box");
    await fireAt(mobile);
    assertChangedPixels(mobileBattle, await getCanvasShot(mobile), "mobile firing");
  } finally {
    await browser?.close();
    await stopStaticServer(server);
    if (port) {
      await assertServerStopped(port);
    }
  }
});

test("all production game screens are reachable and playable", { timeout: 300000 }, async () => {
  const port = EXTERNAL_BASE_URL ? null : await findDeterministicFreePort();
  const baseUrl = EXTERNAL_BASE_URL ?? `http://${HOST}:${port}`;
  const server = EXTERNAL_BASE_URL ? null : await startStaticServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch();

    const run = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await run.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForCanvasReady(run, "all-screens run");
    await assertPlayableScreen(run, "map", /Mapa/);

    await clickRoute(run, "battle-1");
    await delay(500);
    await assertPlayableScreen(run, "battle", /Walka/);
    await winCurrentBattle(run, "battle-1");
    await assertPlayableScreen(run, "reward", /Nagroda/);
    await chooseReward(run, /Guard Chick|Wind Boots|Rosol|Warm Broth/);

    await clickRoute(run, "treasure-1");
    await assertPlayableScreen(run, "treasure", /Skarb/);
    await chooseReward(run, /Chaos Egg/);

    await clickRoute(run, "battle-2");
    await assertPlayableScreen(run, "battle-2", /Walka/);
    await winCurrentBattle(run, "battle-2");
    await assertPlayableScreen(run, "reward after battle-2", /Nagroda/);
    await chooseReward(run, /Warm Broth|Rosol|Golden Grain/);

    await clickRoute(run, "elite-1");
    await assertPlayableScreen(run, "elite battle", /Walka/);
    await winCurrentBattle(run, "elite-1");
    await assertPlayableScreen(run, "elite reward", /Nagroda/);
    await chooseReward(run, /Prophet Hen|Warm Broth|Rosol/);

    await clickRoute(run, "battle-3");
    await assertPlayableScreen(run, "battle-3", /Walka/);
    await winCurrentBattle(run, "battle-3");
    await assertPlayableScreen(run, "late reward", /Nagroda/);
    await chooseReward(run, /Shell Shield|Warm Broth|Rosol/);

    await clickRoute(run, "boss");
    await delay(500);
    await assertPlayableScreen(run, "boss", /Boss/);
    await winCurrentBattle(run, "boss", 8, /Zwycięstwo/);
    await assertPlayableScreen(run, "victory", /Zwycięstwo/);

    const shop = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    await shop.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForCanvasReady(shop, "shop branch");
    await clickRoute(shop, "battle-1");
    await winCurrentBattle(shop, "shop setup battle");
    await chooseReward(shop, /Guard Chick|Wind Boots|Rosol|Warm Broth/);
    await clickRoute(shop, "shop-1");
    await assertPlayableScreen(shop, "shop", /Sklep/);
    await shop.getByRole("button", { name: /^Dalej$/ }).click();
    await assertPlayableScreen(shop, "map after shop skip", /Mapa/);
    await run.close();
    await shop.close();

    const defeat = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    await defeat.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForCanvasReady(defeat, "defeat branch");
    await clickRoute(defeat, "battle-1");
    await assertPlayableScreen(defeat, "defeat battle", /Walka/);
    await loseCurrentBattle(defeat, "defeat branch");
    await assertPlayableScreen(defeat, "game over", /Koniec/);
  } finally {
    await browser?.close();
    await stopStaticServer(server);
    if (port) {
      await assertServerStopped(port);
    }
  }
});

test("mobile production game screens fit and remain playable", { timeout: 210000 }, async () => {
  const port = EXTERNAL_BASE_URL ? null : await findDeterministicFreePort();
  const baseUrl = EXTERNAL_BASE_URL ?? `http://${HOST}:${port}`;
  const server = EXTERNAL_BASE_URL ? null : await startStaticServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch();

    const run = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await run.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForCanvasReady(run, "mobile all-screens run");
    await assertPlayableScreen(run, "mobile map", /Mapa/);

    await clickRoute(run, "battle-1");
    await assertPlayableScreen(run, "mobile battle", /Walka/);
    await winCurrentBattle(run, "mobile battle-1");
    await assertPlayableScreen(run, "mobile reward", /Nagroda/);
    await chooseReward(run, /Guard Chick|Wind Boots|Rosol|Warm Broth/);

    await clickRoute(run, "treasure-1");
    await assertPlayableScreen(run, "mobile treasure", /Skarb/);
    await chooseReward(run, /Chaos Egg/);

    await clickRoute(run, "battle-2");
    await assertPlayableScreen(run, "mobile battle-2", /Walka/);
    await winCurrentBattle(run, "mobile battle-2");
    await assertPlayableScreen(run, "mobile reward after battle-2", /Nagroda/);
    await chooseReward(run, /Warm Broth|Rosol|Golden Grain/);

    await clickRoute(run, "elite-1");
    await assertPlayableScreen(run, "mobile elite battle", /Walka/);
    await winCurrentBattle(run, "mobile elite-1");
    await assertPlayableScreen(run, "mobile elite reward", /Nagroda/);
    await chooseReward(run, /Prophet Hen|Warm Broth|Rosol/);

    await clickRoute(run, "battle-3");
    await assertPlayableScreen(run, "mobile battle-3", /Walka/);
    await winCurrentBattle(run, "mobile battle-3");
    await assertPlayableScreen(run, "mobile late reward", /Nagroda/);
    await chooseReward(run, /Shell Shield|Warm Broth|Rosol/);

    await clickRoute(run, "boss");
    await assertPlayableScreen(run, "mobile boss", /Boss/);
    await winCurrentBattle(run, "mobile boss", 8, /Zwycięstwo/);
    await assertPlayableScreen(run, "mobile victory", /Zwycięstwo/);

    const shop = await browser.newPage({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    await shop.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForCanvasReady(shop, "small mobile shop branch");
    await assertPlayableScreen(shop, "small mobile map", /Mapa/);
    await clickRoute(shop, "battle-1");
    await winCurrentBattle(shop, "small mobile shop setup battle");
    await chooseReward(shop, /Guard Chick|Wind Boots|Rosol|Warm Broth/);
    await clickRoute(shop, "shop-1");
    await assertPlayableScreen(shop, "small mobile shop", /Sklep/);
    await shop.getByRole("button", { name: /^Dalej$/ }).click();
    await assertPlayableScreen(shop, "small mobile map after shop skip", /Mapa/);
    await run.close();
    await shop.close();

    const defeat = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await defeat.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForCanvasReady(defeat, "mobile defeat branch");
    await clickRoute(defeat, "battle-1");
    await assertPlayableScreen(defeat, "mobile defeat battle", /Walka/);
    await loseCurrentBattle(defeat, "mobile defeat branch");
    await assertPlayableScreen(defeat, "mobile game over", /Koniec/);
  } finally {
    await browser?.close();
    await stopStaticServer(server);
    if (port) {
      await assertServerStopped(port);
    }
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
