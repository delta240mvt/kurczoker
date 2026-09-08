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

test("public pages include the shared Umami analytics component", async () => {
  const pagePaths = [
    "src/pages/index.astro",
    "src/pages/gra.astro",
    "src/pages/polityka-prywatnosci.astro"
  ];

  for (const pagePath of pagePaths) {
    const page = await readFile(pagePath, "utf8");

    assert.match(page, /import UmamiAnalytics from ['"]\.\.\/components\/UmamiAnalytics\.astro['"]/);
    assert.match(page, /<UmamiAnalytics\s*\/>/);
  }
});

test("privacy policy discloses Umami analytics data practices", async () => {
  const privacyPolicy = await readFile("src/pages/polityka-prywatnosci.astro", "utf8");
  const normalizedPolicy = withoutDiacritics(privacyPolicy);

  assert.match(normalizedPolicy, /Umami/);
  assert.match(normalizedPolicy, /bez plikow cookie/i);
  assert.match(normalizedPolicy, /odslon/i);
  assert.match(normalizedPolicy, /adresu strony odsylajacej|referrer/i);
  assert.match(normalizedPolicy, /przegladark/i);
  assert.match(normalizedPolicy, /systemu operacyjnego/i);
  assert.match(normalizedPolicy, /typu urzadzenia/i);
  assert.match(normalizedPolicy, /kraju/i);
  assert.match(normalizedPolicy, /umami\.is\/docs\/faq/);
});

test("landing footer links to the privacy policy route", async () => {
  const landingPage = await readFile("src/components/KurczokerLanding.astro", "utf8");
  const normalizedLanding = withoutDiacritics(landingPage);

  assert.match(normalizedLanding, /href="\/polityka-prywatnosci"/);
  assert.match(normalizedLanding, />Prywatnosc i zapis</);
});
