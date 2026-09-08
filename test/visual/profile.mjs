import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { serveBuild } from "./server.js";
let host;
const base =
  process.env.KURCZOKER_VISUAL_BASE_URL ?? (host = await serveBuild()).url;
const browser = await chromium.launch({
  args: ["--use-angle=d3d11", "--enable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }),
  measurements = [];
page.on("response", (r) => {
  if (r.status() >= 400) console.log("HTTP", r.status(), r.url());
});
try {
  await page.goto(`${base}/gra?mode=quick`, {waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();
  await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  await page.getByRole('button',{name:'Pomiń wskazówki',exact:true}).click();
  for (const quality of ['high','low']) {
    await page.getByRole('button',{name:'Pauza',exact:true}).click();
    await page.getByRole('button',{name:'Ustawienia',exact:true}).click();
    await page.getByLabel('Jakość grafiki',{exact:true}).selectOption(quality);
    await page.getByRole('button',{name:'Gotowe',exact:true}).click();
    await page.getByRole('button',{name:'Wznów grę',exact:true}).click();
    await page.waitForTimeout(6500);
    measurements.push(
      await page.evaluate((quality) => {
        const gl = document.querySelector("canvas").getContext("webgl2"),
          ext = gl.getExtension("WEBGL_debug_renderer_info");
        return {
          quality,
          renderer: ext
            ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER),
          ...JSON.parse(
            document.querySelector("[data-performance]").dataset.performance,
          ),
        };
      }, quality),
    );
  }
  const report = {
    browser: await browser.version(),
    viewport: { width: 1440, height: 900 },
    measurements,
  };
  await writeFile(
    ".superpowers/makeover-qa/hardware-performance.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await host?.close();
}
