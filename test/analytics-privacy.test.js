import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function withoutDiacritics(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replaceAll("ł", "l").replaceAll("Ł", "L");
}

test("Umami analytics is optional and requires a configured HTTPS endpoint and website", async () => {
  const analyticsComponent = await readFile("src/components/UmamiAnalytics.astro", "utf8");

  assert.match(analyticsComponent, /PUBLIC_UMAMI_SCRIPT_URL/);
  assert.match(analyticsComponent, /PUBLIC_UMAMI_WEBSITE_ID/);
  assert.match(analyticsComponent, /enabled && <script/);
  assert.match(analyticsComponent, /src=\{scriptUrl\}/);
  assert.match(analyticsComponent, /data-website-id=\{websiteId\}/);
  assert.match(analyticsComponent, /\bdefer\b/);
  assert.match(analyticsComponent, /\bis:inline\b/);
});

test("landing and game retain the optional analytics component", async () => {
  const pagePaths = [
    "src/pages/index.astro",
    "src/pages/gra.astro"
  ];

  for (const pagePath of pagePaths) {
    const page = await readFile(pagePath, "utf8");

    assert.match(page, /import UmamiAnalytics from ['"]\.\.\/components\/UmamiAnalytics\.astro['"]/);
    assert.match(page, /<UmamiAnalytics\s*\/>/);
  }
});

test("privacy policy identifies the controller, actual providers and local save retention", async () => {
  const policy = await readFile("src/content/polityka-prywatnosci.md", "utf8");
  for (const value of ["Przemysław Filipiak", "Maków Polnych 12a", "61-606 Poznań", "hello@frinter.app", "12 miesięcy", "Cloudflare", "Gmail", "kurczoker-v2", "kurczoker.settings.v2", "kurczoker.help.v2", "Prezesa Urzędu Ochrony Danych Osobowych"]) assert.ok(policy.includes(value), value);
  assert.doesNotMatch(policy, /\[(?:TBD|TODO|UZUPEŁNIJ)\]|CREATIVA LEGAL/);
});

test("landing footer links to the privacy policy route", async () => {
  const landingPage = await readFile("src/components/KurczokerLanding.astro", "utf8");
  const normalizedLanding = withoutDiacritics(landingPage);

  assert.match(normalizedLanding, /href="\/polityka-prywatnosci\/"/);
  assert.match(normalizedLanding, />Polityka prywatnosci</);
});
