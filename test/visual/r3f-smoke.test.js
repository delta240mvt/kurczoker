import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { join } from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT_START = 47631;
const PORT_ATTEMPTS = 20;

async function isPortFree(port) {
  const server = createServer();
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

  throw new Error(`No free preview port found from ${PORT_START} to ${PORT_START + PORT_ATTEMPTS - 1}`);
}

async function waitForPreview(url, preview) {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < 30000) {
    if (preview.exitCode !== null) {
      throw new Error(`preview exited before becoming ready with code ${preview.exitCode}`);
    }

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

  throw new Error(`preview was not ready after 30s: ${lastError?.message ?? "unknown error"}`);
}

async function stopPreview(preview) {
  if (!preview || preview.exitCode !== null) return;

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const taskkill = spawn("taskkill", ["/pid", String(preview.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true
      });
      taskkill.once("exit", resolve);
      taskkill.once("error", resolve);
    });
  } else {
    preview.kill("SIGTERM");
  }

  try {
    await Promise.race([once(preview, "exit"), delay(3000)]);
  } finally {
    if (preview.exitCode === null) {
      preview.kill("SIGKILL");
    }
  }
}

async function getCanvasShot(page) {
  return page.locator(".kurczoker-r3f canvas").screenshot({ animations: "disabled" });
}

function assertNonblankShot(buffer, label) {
  const uniqueBytes = new Set(buffer);

  assert.ok(buffer.length > 1000, `${label} screenshot should contain rendered canvas data`);
  assert.ok(uniqueBytes.size > 16, `${label} screenshot should not be a blank or flat image`);
}

function countChangedBytes(before, after) {
  const length = Math.min(before.length, after.length);
  let changed = Math.abs(before.length - after.length);

  for (let index = 0; index < length; index += 1) {
    if (Math.abs(before[index] - after[index]) > 8) {
      changed += 1;
    }
  }

  return changed;
}

test("r3f game renders and advances through map and battle", { timeout: 90000 }, async () => {
  const port = await findDeterministicFreePort();
  const baseUrl = `http://${HOST}:${port}`;
  const astroCli = join(process.cwd(), "node_modules", "astro", "astro.js");
  const preview = spawn(process.execPath, [astroCli, "preview", "--host", HOST, "--port", String(port)], {
    stdio: "ignore",
    windowsHide: true
  });
  let browser;

  try {
    await waitForPreview(baseUrl, preview);
    browser = await chromium.launch();

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(baseUrl, { waitUntil: "networkidle" });
    await desktop.locator(".kurczoker-r3f canvas").waitFor({ state: "visible" });
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
    assert.ok(countChangedBytes(beforeRoute, afterRoute) > 64, "clicking a route should visibly change the scene");

    const canvasBox = await desktop.locator(".kurczoker-r3f canvas").boundingBox();
    assert.ok(canvasBox, "battle canvas should have a bounding box");
    const beforeFire = await getCanvasShot(desktop);
    await desktop.mouse.move(canvasBox.x + canvasBox.width * 0.74, canvasBox.y + canvasBox.height * 0.36, { steps: 8 });
    await desktop.mouse.click(canvasBox.x + canvasBox.width * 0.74, canvasBox.y + canvasBox.height * 0.36);
    await desktop.locator("[data-game-message]").waitFor({ state: "visible" });
    await desktop.waitForFunction(() => /Tura wroga|Trafienie/.test(document.querySelector("[data-game-message]")?.textContent ?? ""));
    const afterFire = await getCanvasShot(desktop);
    assert.ok(
      countChangedBytes(beforeFire, afterFire) > 64 || /Tura wroga|Trafienie/.test(await desktop.locator("[data-game-message]").textContent()),
      "aiming and firing should visibly update the battle scene or battle status"
    );

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await mobile.goto(baseUrl, { waitUntil: "networkidle" });
    await mobile.locator(".kurczoker-r3f canvas").waitFor({ state: "visible" });
    assertNonblankShot(await getCanvasShot(mobile), "mobile map");
  } finally {
    await browser?.close();
    await stopPreview(preview);
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
