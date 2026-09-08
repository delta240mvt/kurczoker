import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { serveBuild } from "./server.js";
import { startRun } from "../../src/game/run.js";
import { encodeCheckpoint } from "../../src/engine/tactical/checkpoint.js";

let host;
const base =
  process.env.KURCZOKER_VISUAL_BASE_URL ?? (host = await serveBuild()).url;
test.after(async () => {
  await host?.close();
});
const ready = (page) =>
  page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Rzuć jajobombę"]')?.disabled ===
      false,
  );
test(
  "tactical game: real inputs, shot, reward, pause, save and mobile controls",
  { timeout: 180000 },
  async () => {
    const browser = await chromium.launch({
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
    const errors = [];
    await mkdir(".superpowers/makeover-qa", { recursive: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
      });
      page.on("pageerror", (e) => {
        errors.push(e.message);
        console.log("PAGE ERROR", e.message);
      });
      page.on("console", (e) => {
        if (e.type() === "error") console.log("CONSOLE", e.text());
      });
      await page.goto(`${base}/gra`, { waitUntil: "domcontentloaded" });
      await page
        .getByRole("button", { name: "Nowa wyprawa", exact: true })
        .click({ timeout: 10000 });
      await page.getByRole("button", { name: /Ruszaj do walki/ }).click();
      await page
        .getByRole("button", { name: "Rzuć jajobombę", exact: true })
        .waitFor({ state: "visible" });
      await ready(page);
      await page.screenshot({
        path: ".superpowers/makeover-qa/desktop-battle.png",
      });
      await page.getByRole("button", { name: "Pauza", exact: true }).click();
      assert.equal(
        await page
          .getByRole("dialog", { name: "Przerwa w wyprawie" })
          .isVisible(),
        true,
      );
      await page.getByRole("button", { name: "Wróć do gry" }).click();
      await page
        .getByRole("button", { name: "Rzuć jajobombę", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Łup należy do Ciebie" })
        .waitFor({ timeout: 15000 });
      await page.locator("[data-reward-id]").first().click();
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Kontynuuj wyprawę" }).waitFor();
      await page.getByRole("button", { name: "Kontynuuj wyprawę" }).click();
      assert.ok((await page.locator("[data-route-id]").count()) >= 2);
      assert.deepEqual(errors, []);
      await page.close();
      const phone = await browser.newPage({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      phone.on("pageerror", (e) => errors.push(e.message));
      await phone.goto(`${base}/gra`, { waitUntil: "domcontentloaded" });
      await phone
        .getByRole("button", { name: "Nowa wyprawa", exact: true })
        .click();
      await phone.getByRole("button", { name: /Ruszaj do walki/ }).click();
      await ready(phone);
      const size = await phone.evaluate(() => ({
        viewport: innerWidth,
        width: document.documentElement.scrollWidth,
      }));
      assert.equal(size.width, size.viewport);
      assert.equal(
        await phone.getByRole("button", { name: "Ruch w lewo" }).isVisible(),
        true,
      );
      await phone.screenshot({
        path: ".superpowers/makeover-qa/mobile-battle.png",
      });
      await phone
        .getByRole("button", { name: "Rzuć jajobombę", exact: true })
        .click();
      await phone
        .getByRole("heading", { name: "Łup należy do Ciebie" })
        .waitFor({ timeout: 15000 });
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);

test(
  "keyboard, blur pause, mobile ability layout and failed asset recovery",
  { timeout: 180000 },
  async () => {
    const browser = await chromium.launch({
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const game = startRun(2);
    game.run.abilities = [
      "egg-bomb",
      "guard-chick",
      "crest-jump",
      "mana-grain",
    ];
    try {
      await page.addInitScript((save) => {
        localStorage.setItem("kurczoker.checkpoint.v1", save);
        localStorage.setItem(
          "kurczoker.settings",
          JSON.stringify({ quality: "low" }),
        );
      }, encodeCheckpoint(game));
      await page.route("**/enemy-rooster.*.glb", (route) => route.abort());
      await page.goto(`${base}/gra`, { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Kontynuuj wyprawę" }).click();
      await page.locator('[data-route-id="battle-1"]').click();
      await page
        .getByRole("heading", { name: "Scena potrzebuje restartu" })
        .waitFor();
      await page.unroute("**/enemy-rooster.*.glb");
      await page.getByRole("button", { name: "Spróbuj ponownie" }).click();
      await page.getByRole("button", { name: "Kontynuuj wyprawę" }).click();
      await page.locator('[data-route-id="battle-1"]').click();
      await ready(page);
      assert.equal(await page.locator(".ability-button").count(), 4);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        390,
      );
      // A held touch uses browser pointer capture, followed by keyboard input after button focus.
      const right = await page
        .getByRole("button", { name: "Ruch w prawo", exact: true })
        .boundingBox();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: right.x + 20, y: right.y + 20 }],
      });
      await page.waitForFunction(
        () =>
          Number(document.querySelector("[data-player-x]").dataset.playerX) >
          -4,
      );
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await page.getByRole("button", { name: "Skok", exact: true }).click();
      const x = Number(
        await page.locator("[data-player-x]").getAttribute("data-player-x"),
      );
      await page.keyboard.down("a");
      await page.waitForFunction(
        (x) =>
          Number(document.querySelector("[data-player-x]").dataset.playerX) <
          x - 0.3,
        x,
      );
      await page.keyboard.up("a");
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      await page.getByRole("dialog", { name: "Przerwa w wyprawie" }).waitFor();
      const time = await page
        .locator("[data-sim-time]")
        .getAttribute("data-sim-time");
      await page.waitForTimeout(500);
      assert.equal(
        await page.locator("[data-sim-time]").getAttribute("data-sim-time"),
        time,
      );
      await page.getByRole("button", { name: "Wróć do gry" }).click();
      await page.setViewportSize({ width: 844, height: 390 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        844,
      );
      await page.getByRole("button", { name: "Pauza", exact: true }).click();
      await page
        .getByRole("button", { name: "Rozpocznij nową wyprawę" })
        .click();
      await page.locator('[data-route-id="battle-1"]').waitFor();
      assert.equal(await page.getByRole("dialog").count(), 0);
      await page.locator('[data-route-id="battle-1"]').click();
      for (let turn = 0; turn < 3; turn++) {
        await ready(page);
        await page.getByLabel("Kąt rzutu").fill("10");
        await page.getByLabel("Moc rzutu").fill("6");
        await page
          .getByRole("button", { name: "Rzuć jajobombę", exact: true })
          .click();
        if (turn === 0) {
          await page.waitForFunction(
            () =>
              document.querySelector("[data-projectile-team]")?.dataset
                .projectileTeam === "enemy",
          );
          await page.screenshot({
            path: ".superpowers/makeover-qa/enemy-shot.png",
          });
        }
        await page.waitForFunction(
          () =>
            document.querySelector(".kurczoker-app")?.dataset.scene ===
              "game-over" ||
            document.querySelector('[aria-label="Rzuć jajobombę"]')
              ?.disabled === false,
        );
      }
      await page
        .getByRole("heading", { name: "Tym razem poleciały pióra." })
        .waitFor();
      await page.getByRole("button", { name: /Nowa wyprawa/ }).click();
      await page.locator('[data-route-id="battle-1"]').click();
      await ready(page);
      await page
        .getByRole("button", { name: "Rzuć jajobombę", exact: true })
        .click();
      await page.locator('[data-reward-id="heal-small"]').first().click();
      await page.locator('[data-route-id="shop-1"]').click();
      const emptyWalletSave = await page.evaluate(() => {
        const save = JSON.parse(
          localStorage.getItem("kurczoker.checkpoint.v1"),
        );
        save.game.run.gold = 0;
        return JSON.stringify(save);
      });
      const wallet = await browser.newPage({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      await wallet.addInitScript(
        (save) => localStorage.setItem("kurczoker.checkpoint.v1", save),
        emptyWalletSave,
      );
      await page.close();
      await wallet.goto(`${base}/gra`, { waitUntil: "domcontentloaded" });
      await wallet.getByRole("button", { name: "Kontynuuj wyprawę" }).click();
      await wallet.locator("[data-shop-id]").first().waitFor();
      assert.equal(
        await wallet.locator("[data-shop-id]:not(:disabled)").count(),
        0,
      );
      await wallet
        .getByRole("button", { name: "Ruszaj dalej", exact: true })
        .click();
      await wallet.locator('[data-route-id="battle-2"]').waitFor();
    } finally {
      await browser.close();
    }
  },
);

test(
  "a complete browser expedition buys equipment and defeats the boss with actual shots",
  { timeout: 300000 },
  async () => {
    const browser = await chromium.launch({
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
    const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      await page.goto(`${base}/gra`, { waitUntil: "domcontentloaded" });
      await page
        .getByRole("button", { name: "Nowa wyprawa", exact: true })
        .click();
      await page.getByLabel("Jakość grafiki").selectOption("low");
      for (const id of [
        "battle-1",
        "shop-1",
        "battle-2",
        "elite-1",
        "battle-3",
        "boss",
      ]) {
        await page.locator(`[data-route-id="${id}"]`).click();
        if (id === "shop-1") {
          const offers = page.locator("[data-shop-id]:not(:disabled)");
          await offers.first().waitFor();
          assert.ok((await offers.count()) > 0);
          await offers.first().click();
          continue;
        }
        await ready(page);
        for (let turns = 0; turns < 6; turns++) {
          await page.getByLabel("Kąt rzutu").fill("40");
          await page.getByLabel("Moc rzutu").fill("9");
          await page
            .getByRole("button", { name: "Rzuć jajobombę", exact: true })
            .click();
          await page.waitForFunction(
            () => {
              const el = document.querySelector(".kurczoker-app");
              return (
                el?.dataset.scene !== "battle" ||
                document.querySelector('[aria-label="Rzuć jajobombę"]')
                  ?.disabled === false
              );
            },
            null,
            { timeout: 30000 },
          );
          if (
            (await page
              .locator(".kurczoker-app")
              .getAttribute("data-scene")) !== "battle"
          )
            break;
        }
        assert.notEqual(
          await page.locator(".kurczoker-app").getAttribute("data-scene"),
          "game-over",
          id,
        );
        if (id !== "boss") {
          await page
            .getByRole("heading", { name: "Łup należy do Ciebie" })
            .waitFor();
          const ids = await page
            .locator("[data-reward-id]")
            .evaluateAll((nodes) => nodes.map((n) => n.dataset.rewardId));
          const preferred =
            id === "battle-1"
              ? "gold-small"
              : ids.includes("chaos-egg")
                ? "chaos-egg"
                : ids.includes("crest-crown")
                  ? "crest-crown"
                  : "heal-small";
          await page.locator(`[data-reward-id="${preferred}"]`).first().click();
        }
      }
      await page
        .getByRole("heading", { name: "Chwała Kurczokerowi!" })
        .waitFor();
      assert.equal(
        await page.evaluate(() =>
          localStorage.getItem("kurczoker.checkpoint.v1"),
        ),
        null,
      );
      const performance = await page.evaluate(() => ({
        browser: navigator.userAgent,
        profile: "low",
        frame: JSON.parse(
          document.querySelector("[data-performance]").dataset.performance,
        ),
        resources: performance.getEntriesByType("resource").map((r) => ({
          name: r.name,
          bytes: r.transferSize,
          duration: r.duration,
        })),
      }));
      await writeFile(
        ".superpowers/makeover-qa/browser-performance.json",
        JSON.stringify(performance, null, 2),
      );
      await page.screenshot({ path: ".superpowers/makeover-qa/victory.png" });
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);
