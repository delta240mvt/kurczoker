import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
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
  preview.kill("SIGTERM");

  try {
    await Promise.race([once(preview, "exit"), delay(3000)]);
  } finally {
    if (preview.exitCode === null) {
      preview.kill("SIGKILL");
    }
  }
}

async function getCanvasSample(page) {
  return page.locator(".kurczoker-r3f canvas").evaluate((canvas) => {
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) {
      throw new Error("R3F canvas does not expose a WebGL context");
    }

    const width = context.drawingBufferWidth;
    const height = context.drawingBufferHeight;
    const points = [];
    for (let y = 0.18; y <= 0.82; y += 0.16) {
      for (let x = 0.14; x <= 0.86; x += 0.12) {
        points.push([x, y]);
      }
    }

    return points.map(([xRatio, yRatio]) => {
      const pixel = new Uint8Array(4);
      context.readPixels(Math.floor(width * xRatio), Math.floor(height * yRatio), 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixel);
      return Array.from(pixel);
    });
  });
}

function assertNonblankSample(sample, label) {
  const unique = new Set(sample.map((pixel) => pixel.join(",")));
  const visible = sample.filter(([r, g, b, a]) => a > 0 && (r > 8 || g > 8 || b > 8));

  assert.ok(visible.length > 0, `${label} canvas should have visible pixels`);
  assert.ok(unique.size > 1, `${label} canvas should not be a single flat pixel sample`);
}

function countChangedPixels(before, after) {
  return before.reduce((changed, pixel, index) => {
    const next = after[index];
    const diff = Math.abs(pixel[0] - next[0]) + Math.abs(pixel[1] - next[1]) + Math.abs(pixel[2] - next[2]) + Math.abs(pixel[3] - next[3]);
    return changed + (diff > 16 ? 1 : 0);
  }, 0);
}

test("r3f game renders and advances through map and battle", { timeout: 90000 }, async () => {
  const port = await findDeterministicFreePort();
  const baseUrl = `http://${HOST}:${port}`;
  const preview = spawn("npm", ["run", "preview", "--", "--host", HOST, "--port", String(port)], {
    shell: true,
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
    assertNonblankSample(await getCanvasSample(desktop), "desktop map");

    const route = desktop.locator(".map-route-actions__btn").first();
    await route.waitFor({ state: "visible" });
    const beforeRoute = await getCanvasSample(desktop);
    await route.click();
    await desktop.waitForFunction(() => !document.querySelector(".map-route-actions__btn"));
    await desktop.locator("[data-game-scene]").waitFor({ state: "visible" });
    await expectText(desktop, "[data-game-scene]", /Walka/);
    await delay(500);
    const afterRoute = await getCanvasSample(desktop);
    assert.ok(countChangedPixels(beforeRoute, afterRoute) > 0, "clicking a route should visibly change the scene");

    const canvasBox = await desktop.locator(".kurczoker-r3f canvas").boundingBox();
    assert.ok(canvasBox, "battle canvas should have a bounding box");
    const beforeFire = await getCanvasSample(desktop);
    await desktop.mouse.move(canvasBox.x + canvasBox.width * 0.74, canvasBox.y + canvasBox.height * 0.36, { steps: 8 });
    await desktop.mouse.click(canvasBox.x + canvasBox.width * 0.74, canvasBox.y + canvasBox.height * 0.36);
    await desktop.locator("[data-game-message]").waitFor({ state: "visible" });
    await desktop.waitForFunction(() => /Tura wroga|Trafienie/.test(document.querySelector("[data-game-message]")?.textContent ?? ""));
    const afterFire = await getCanvasSample(desktop);
    assert.ok(
      countChangedPixels(beforeFire, afterFire) > 0 || /Tura wroga|Trafienie/.test(await desktop.locator("[data-game-message]").textContent()),
      "aiming and firing should visibly update the battle scene or battle status"
    );

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await mobile.goto(baseUrl, { waitUntil: "networkidle" });
    await mobile.locator(".kurczoker-r3f canvas").waitFor({ state: "visible" });
    assertNonblankSample(await getCanvasSample(mobile), "mobile map");
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
