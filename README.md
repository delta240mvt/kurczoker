# KURCZOKER

Taktyczny roguelite w przeglądarce: mapa → potyczki → nagrody i sklep → Jajokról → finał. Modele i otoczenie są przestrzenne. Walka odbywa się na czytelnej płaszczyźnie z kamerą obejmującą całą arenę.

## Uruchomienie

Node 22+ i npm. `npm ci`, następnie `npm run dev` i `/gra`.

| Polecenie | Wynik |
|---|---|
| `npm test` | Testy domeny, rzeczywistej fizyki Rapier, checkpointów i modeli |
| `npm run assets:build` | Animacje i kompresja autorskich modeli, manifest z haszami |
| `npm run build` | Statyczne `dist`, usunięcie materiałów roboczych, kontrola budżetu |
| `npm run preview` | Lokalny podgląd gotowego wydania |
| `npm run test:visual` | Playwright: sam uruchamia serwer `dist`, desktop i dotyk, pełna wyprawa |
| `npm run deploy` | Build i Cloudflare Pages preview bieżącej gałęzi |

Przed pierwszym testem przeglądarkowym: `npx playwright install chromium`. W CI dodatkowo `--with-deps`.

## Sterowanie i zasady

Masz 20 sekund na ruch, skok i jedną akcję. A/D lub strzałki poruszają bohaterem, W/↑ skacze. Mysz wskazuje kierunek i kąt, suwaki ustawiają kąt oraz moc. Strzałka obok suwaków odwraca kierunek rzutu. Spacja/Enter albo przycisk wykonuje wybraną zdolność. Escape zatrzymuje grę. Telefon ma osobne przyciski ruchu, skoku i akcji; można również celować dotykiem.

Jajobomba zadaje 2 obrażenia, jajo chaosu dodaje 1. Wysoki skok i strażnik dają osłonę, magiczne ziarno leczy i wzmacnia następny rzut. Skorupa blokuje pierwsze trafienie każdego starcia. Pozostałe artefakty zwiększają zdrowie, szybkość, ziarna lub wybór nagród. Potyczka daje 4 ziarna, elita 6. Zakup kończy wizytę w sklepie. Boss ma 8 HP: warto wcześniej zbudować odpowiedni zestaw wzmocnień.

Pauza i utrata fokusu zatrzymują czas oraz ruch. Checkpoint w `localStorage` powstaje na mapie, po zwycięstwie i w sklepie. Odświeżenie podczas walki wraca do ostatniego bezpiecznego miejsca. Zapis jest sprawdzany przed wznowieniem; porażka lub finał go usuwa. Dźwięk jest opcjonalny, początkowo wyciszony, inicjowany dopiero po kliknięciu.

## Architektura

- `src/engine/tactical/simulation.js`: jedna instancja Rapier, krok 1/60 s, kolizje obu stron i wynik. Tor podglądu jest liczony identyczną symulacją, a nie impulsem udającym prędkość.
- `arena.js`: wspólna definicja widocznego terenu i colliderów.
- `World.jsx`, `Chicken.jsx`, `Effects.jsx`: R3F/Three WebGL2, proceduralna diorama, animowane GLB, efekty trafienia.
- `KurczokerCanvas.jsx` i `Controls.jsx`: kampania, interfejs, cykl życia areny, klawiatura/dotyk. React otrzymuje HUD około 10 razy na sekundę; fizyka działa niezależnie.
- `src/game/run.js`, `abilities.js`, `map.js`: reguły wyprawy. Dawny silnik 2D pozostał jako materiał migracyjny i testy domeny, ale aktywny ekran nie wywołuje jego pętli walki.
- `tools/build-game-assets.mjs`: trzy autorskie modele, klipy Idle/Walk/Attack, meshopt. Kolory materiałów zastępują ciężkie tekstury, nie wymagają transkodera KTX2. Pochodzenie i rozmiary: `releaseManifest.json`.

Profil Wysoka używa cieni i DPR do 1,5; Oszczędna wyłącza cienie i ogranicza DPR do 1. Auto zaczyna oszczędnie na małych urządzeniach i obniża jakość przy słabym klatkażu. Stopka pokazuje FPS; atrybut `data-performance` zawiera także p95 czasu klatki, draw calls i trójkąty.

## Cloudflare

Statyczne Astro nie potrzebuje Workera, bazy danych ani R2 do działania gry. `tools/pages.config.json` wskazuje projekt **kurczoker-makeover**, gałąź produkcyjna `main`. Skrypt wdrożeniowy odczytuje lokalny `.env` albo zmienne środowiska (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, opcjonalnie `CF_PAGES_PROJECT`). Sekrety nigdy nie trafiają do klienta.

`node tools/deploy-pages.mjs --branch baza080926-makeover` publikuje gotowe `dist` jako preview. Publikacja `main` wymaga jawnego `--production`. Przed nią uruchom testy przeciwko preview, ustawiając `KURCZOKER_VISUAL_BASE_URL` na jego adres HTTPS.

Budżet: maksimum 10 MiB nieskompresowanego kodu/zasobów gry oraz 25 MiB na dowolny plik Pages. `dist/release-report.json` zapisuje rzeczywiste rozmiary. Haszowane GLB i pliki `_astro` mają cache immutable, HTML rewaliduje się. Źródłowe generacje pozostają w repo, są usuwane z `dist` po buildzie.

Opcjonalna analityka Umami wymaga `PUBLIC_UMAMI_SCRIPT_URL` (HTTPS) i `PUBLIC_UMAMI_WEBSITE_ID` podczas builda. Stary, zapisany w kodzie adres Vercel zwracał 404, dlatego bez konfiguracji skrypt nie jest ładowany. Zasady analityki opisuje `/polityka-prywatnosci`. Gra nie ma kont, rankingu ani zapisu w chmurze.

## Audyt i odbiór

- [Audyt repo i research techniczny](docs/research/2026-09-08-kurczoker-audyt-i-plan-naprawczy.md)
- [Zatwierdzony projekt](docs/superpowers/specs/2026-09-08-kurczoker-makeover-design.md)
- [Plan i TODO](docs/superpowers/plans/2026-09-08-kurczoker-makeover.md)
- [Wyniki odbioru i Cloudflare preview](docs/research/2026-09-08-makeover-odbior.md)

Testy Playwright zapisują obrazy i pomiary do `.superpowers/makeover-qa/`. Emulacja telefonu potwierdza interfejs i dotyk; pomiary Chromium ze SwiftShader nie są wynikiem fizycznego telefonu ani dedykowanego GPU.

Pomiar sprzętowego Direct3D11 na Windows: `node test/visual/profile.mjs`. Licencja projektu: [MIT](LICENSE).
