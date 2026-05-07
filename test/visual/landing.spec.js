import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { extname, resolve, sep } from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { PNG } from "pngjs";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT_START = 47651;
const PORT_ATTEMPTS = 20;
const DIST_DIR = resolve(process.cwd(), "dist");
const EXTERNAL_BASE_URL = process.env.KURCZOKER_VISUAL_BASE_URL;
const SCREENSHOTS_DIR = resolve(process.cwd(), "test-screenshots");

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

async function isPortFree(port) {
  const server = createNetServer();
  server.unref();
  server.listen({ host: HOST, port });
  try {
    await once(server, "listening");
    return true;
  } catch (error) {
    if (error.code === "EADDRINUSE" || error.code === "EACCES") return false;
    throw error;
  } finally {
    server.close();
  }
}

async function findFreePort() {
  for (let i = 0; i < PORT_ATTEMPTS; i++) {
    const port = PORT_START + i;
    if (await isPortFree(port)) return port;
  }
  throw new Error("No free port found for landing visual test server");
}

async function assertBuiltDist() {
  const indexPath = resolve(DIST_DIR, "index.html");
  try {
    const s = await stat(indexPath);
    assert.ok(s.isFile(), "dist/index.html must be a file");
  } catch {
    throw new Error("Landing visual test requires a prior static build. Run `npm run build` first.");
  }
}

function staticFilePath(url) {
  const parsed = new URL(url, `http://${HOST}`);
  const decoded = decodeURIComponent(parsed.pathname);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const normalized = resolve(DIST_DIR, `.${requested}`);
  const inside = normalized === DIST_DIR || normalized.startsWith(`${DIST_DIR}${sep}`);
  return inside ? normalized : null;
}

async function sendStaticFile(res, filePath) {
  let actualPath = filePath;
  try {
    let s = await stat(filePath).catch(() => null);
    if (s?.isDirectory()) {
      actualPath = resolve(filePath, "index.html");
      s = await stat(actualPath).catch(() => null);
    }
    if (!s?.isFile()) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, {
      "content-type": MIME_TYPES.get(extname(actualPath)) ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(await readFile(actualPath));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

async function startStaticServer(port) {
  await assertBuiltDist();
  const server = createHttpServer((req, res) => {
    const fp = staticFilePath(req.url ?? "/");
    if (!fp) { res.writeHead(403); res.end("Forbidden"); return; }
    void sendStaticFile(res, fp);
  });
  server.listen({ host: HOST, port });
  await once(server, "listening");
  return server;
}

async function waitForServer(url) {
  const started = Date.now();
  let lastErr;
  while (Date.now() - started < 30000) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
      lastErr = new Error(`HTTP ${r.status}`);
    } catch (e) { lastErr = e; }
    await delay(250);
  }
  throw new Error(`Server not ready after 30s: ${lastErr?.message}`);
}

async function stopServer(server) {
  if (!server) return;
  await new Promise((res, rej) => server.close((e) => e ? rej(e) : res()));
}

function assertNonblank(buf, label) {
  const img = PNG.sync.read(buf);
  assert.ok(img.width > 0 && img.height > 0, `${label}: zero dimensions`);
  let visible = 0;
  const colors = new Set();
  for (let i = 0; i < img.data.length; i += 4) {
    const [r, g, b, a] = [img.data[i], img.data[i+1], img.data[i+2], img.data[i+3]];
    if (a > 0 && r + g + b > 24) visible++;
    colors.add(`${r},${g},${b},${a}`);
  }
  assert.ok(visible > 50, `${label}: too few visible pixels (${visible})`);
  assert.ok(colors.size >= 8, `${label}: not enough color variety (${colors.size} unique colors)`);
}

async function saveScreenshot(buf, name) {
  try {
    await mkdir(SCREENSHOTS_DIR, { recursive: true });
    await writeFile(resolve(SCREENSHOTS_DIR, `${name}.png`), buf);
  } catch { /* non-fatal */ }
}

test("landing page renders all key sections", { timeout: 120000 }, async () => {
  const port = EXTERNAL_BASE_URL ? null : await findFreePort();
  const baseUrl = EXTERNAL_BASE_URL ?? `http://${HOST}:${port}`;
  const server = EXTERNAL_BASE_URL ? null : await startStaticServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch();

    // ── Desktop ──────────────────────────────────────────────
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(baseUrl, { waitUntil: "load" });
    await desktop.waitForSelector(".lp-nav", { timeout: 10000 });
    await desktop.waitForSelector(".lp-hero", { timeout: 10000 });

    // no horizontal overflow
    const scrollWidth = await desktop.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await desktop.evaluate(() => document.documentElement.clientWidth);
    assert.equal(scrollWidth, clientWidth, "landing: no horizontal overflow on desktop");

    // hero heading visible
    const h1Text = await desktop.locator(".lp-h1").textContent();
    assert.ok(/KURCZOKER/i.test(h1Text ?? ""), `hero h1 should contain KURCZOKER, got: ${h1Text}`);

    // ZAGRAJ TERAZ button
    const ctaCount = await desktop.locator(".lp-nav__cta").count();
    assert.ok(ctaCount >= 1, "lp-nav__cta button should exist");

    // game window mockup
    await desktop.waitForSelector(".lp-gamewin", { timeout: 8000 });
    const gamewinVisible = await desktop.locator(".lp-gamewin").isVisible();
    assert.ok(gamewinVisible, "game window mockup should be visible on desktop");

    // how-to-play section
    await desktop.locator("#jak-grac").scrollIntoViewIfNeeded();
    await delay(150);
    const stepCount = await desktop.locator(".lp-step").count();
    assert.equal(stepCount, 4, `should have 4 how-to-play steps, got ${stepCount}`);

    // features section
    await desktop.locator("#funkcje").scrollIntoViewIfNeeded();
    await delay(150);
    const featCount = await desktop.locator(".lp-feature").count();
    assert.equal(featCount, 4, `should have 4 feature cards, got ${featCount}`);

    // in-action section
    const panelCount = await desktop.locator(".lp-action-panel").count();
    assert.equal(panelCount, 3, `should have 3 in-action panels, got ${panelCount}`);

    // boss section
    await desktop.locator("#bonusy").scrollIntoViewIfNeeded();
    await delay(150);
    const bossVisible = await desktop.locator(".lp-boss-grid").isVisible();
    assert.ok(bossVisible, "boss section should be visible");

    // rewards grid
    await desktop.locator("#nagrody").scrollIntoViewIfNeeded();
    await delay(150);
    const rewardCount = await desktop.locator(".lp-reward-type").count();
    assert.equal(rewardCount, 6, `should have 6 reward types, got ${rewardCount}`);

    // FAQ section
    await desktop.locator("#faq").scrollIntoViewIfNeeded();
    await delay(150);
    const faqCount = await desktop.locator(".lp-faq-item").count();
    assert.ok(faqCount >= 4, `should have at least 4 FAQ items, got ${faqCount}`);

    // final CTA
    const ctaSection = await desktop.locator(".lp-final-cta").isVisible();
    assert.ok(ctaSection, "final CTA section should be visible");

    // footer with stopka background
    await desktop.locator(".lp-footer").scrollIntoViewIfNeeded();
    await delay(150);
    const footerVisible = await desktop.locator(".lp-footer").isVisible();
    assert.ok(footerVisible, "footer should be visible");

    // full-page screenshot
    await desktop.evaluate(() => window.scrollTo(0, 0));
    await delay(150);
    const fullBuf = await desktop.screenshot({ fullPage: true, animations: "disabled" });
    await saveScreenshot(fullBuf, "landing-desktop-full");
    assertNonblank(fullBuf, "landing desktop full-page");

    // hero viewport screenshot
    const heroBuf = await desktop.locator(".lp-hero").screenshot({ animations: "disabled" });
    await saveScreenshot(heroBuf, "landing-desktop-hero");
    assertNonblank(heroBuf, "landing desktop hero");

    // footer screenshot
    const footerBuf = await desktop.locator(".lp-footer").screenshot({ animations: "disabled" });
    await saveScreenshot(footerBuf, "landing-desktop-footer");
    assertNonblank(footerBuf, "landing desktop footer — should show stopka.png background");

    // ── Mobile ───────────────────────────────────────────────
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mobile.goto(baseUrl, { waitUntil: "load" });
    await mobile.waitForSelector(".lp-nav", { timeout: 10000 });

    const mScrollW = await mobile.evaluate(() => document.documentElement.scrollWidth);
    const mClientW = await mobile.evaluate(() => document.documentElement.clientWidth);
    assert.equal(mScrollW, mClientW, "landing: no horizontal overflow on mobile");

    const mh1 = await mobile.locator(".lp-h1").textContent();
    assert.ok(/KURCZOKER/i.test(mh1 ?? ""), "mobile hero h1 should contain KURCZOKER");

    // nav links hidden on mobile (CSS display:none)
    const navLinksVisible = await mobile.evaluate(() => {
      const el = document.querySelector(".lp-nav__links");
      return el ? getComputedStyle(el).display !== "none" : false;
    });
    assert.equal(navLinksVisible, false, "nav links should be hidden on mobile");

    const mobileBuf = await mobile.screenshot({ fullPage: true, animations: "disabled" });
    await saveScreenshot(mobileBuf, "landing-mobile-full");
    assertNonblank(mobileBuf, "landing mobile full-page");

    // ── Game page reachable ───────────────────────────────────
    const gamePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await gamePage.goto(`${baseUrl}/gra`, { waitUntil: "load" });
    await gamePage.waitForSelector(".gra-topnav", { timeout: 10000 });
    const backLink = await gamePage.locator(".gra-topnav__back").getAttribute("href");
    assert.ok(backLink === "/", `game page back link should point to /, got: ${backLink}`);

    console.log(`\n✓ Landing page visual tests passed. Screenshots saved to ${SCREENSHOTS_DIR}\n`);
  } finally {
    await browser?.close();
    await stopServer(server);
  }
});

test("landing page FAQ accordion toggles correctly", { timeout: 30000 }, async () => {
  const port = EXTERNAL_BASE_URL ? null : await findFreePort();
  const baseUrl = EXTERNAL_BASE_URL ?? `http://${HOST}:${port}`;
  const server = EXTERNAL_BASE_URL ? null : await startStaticServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.locator("#faq").scrollIntoViewIfNeeded();
    await delay(150);

    // first item open by default
    const firstOpen = await page.evaluate(() => document.querySelector(".lp-faq-item")?.open);
    assert.ok(firstOpen, "first FAQ item should be open by default");

    // click second item to open
    const secondSummary = page.locator(".lp-faq-item").nth(1).locator("summary");
    await secondSummary.click();
    await delay(200);
    const secondOpen = await page.evaluate(() => document.querySelectorAll(".lp-faq-item")[1]?.open);
    assert.ok(secondOpen, "second FAQ item should open on click");
  } finally {
    await browser?.close();
    await stopServer(server);
  }
});
