import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { join } from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { PNG } from "pngjs";
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

async function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", (error) => {
      resolve({ code: 1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.once("exit", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

async function findListeningPids(port) {
  if (process.platform === "win32") {
    const result = await runCommand("netstat", ["-ano"]);
    const pids = new Set();

    for (const line of result.stdout.split(/\r?\n/)) {
      const columns = line.trim().split(/\s+/);
      if (columns[0] !== "TCP") continue;
      const [, localAddress, , state, pid] = columns;
      if (state !== "LISTENING" || !localAddress?.endsWith(`:${port}`)) continue;
      if (/^\d+$/.test(pid) && pid !== "0") {
        pids.add(Number(pid));
      }
    }

    return [...pids];
  }

  const lsof = await runCommand("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"]);
  if (lsof.code === 0 && lsof.stdout.trim()) {
    return [...new Set(lsof.stdout.trim().split(/\s+/).filter(Boolean).map(Number).filter(Number.isFinite))];
  }

  const ss = await runCommand("ss", ["-ltnp"]);
  const pids = new Set();
  for (const line of ss.stdout.split(/\r?\n/)) {
    if (!line.includes(`:${port}`)) continue;
    const match = line.match(/pid=(\d+)/);
    if (match) {
      pids.add(Number(match[1]));
    }
  }

  return [...pids];
}

async function killProcessTree(pid) {
  if (!pid) return;

  if (process.platform === "win32") {
    await runCommand("taskkill", ["/PID", String(pid), "/T", "/F"]);
  } else {
    try {
      process.kill(pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
    await delay(500);
    try {
      process.kill(pid, "SIGKILL");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
}

async function waitForPortClosed(port) {
  const started = Date.now();

  while (Date.now() - started < 10000) {
    const pids = await findListeningPids(port);
    if (pids.length === 0) {
      return;
    }
    await Promise.all(pids.map((pid) => killProcessTree(pid)));
    await delay(250);
  }

  throw new Error(`preview port ${port} is still listening after cleanup`);
}

async function stopPreview(preview, port) {
  if (preview && preview.exitCode === null) {
    await killProcessTree(preview.pid);

    try {
      await Promise.race([once(preview, "exit"), delay(3000)]);
    } finally {
      if (preview.exitCode === null) {
        await killProcessTree(preview.pid);
      }
    }
  }

  await waitForPortClosed(port);
}

async function getCanvasShot(page) {
  const buffer = await page.locator(".kurczoker-r3f canvas").screenshot({ animations: "disabled" });
  return PNG.sync.read(buffer);
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
    await mobile.goto(baseUrl, { waitUntil: "networkidle" });
    await mobile.locator(".kurczoker-r3f canvas").waitFor({ state: "visible" });
    assertNonblankShot(await getCanvasShot(mobile), "mobile map");
  } finally {
    await browser?.close();
    await stopPreview(preview, port);
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
