# KURCZOKER — odbiór przebudowy

Gałąź `baza080926-makeover`, bieżący worktree. Implementacja inline, zgodnie z zatwierdzonym projektem i listą TODO. Bez zmiany DNS domeny produkcyjnej.

## Co działa

- Jedna fizyka Rapier dla postaci, obu pocisków i terenu. Krok 1/60 s, jawna prędkość, CCD, podgląd liczony tą samą fizyką. Trafienie wymaga rzeczywistej kolizji i zasięgu eksplozji. Rzut w obie strony.
- Aktywne tury: 20 sekund na ruch/skok/akcję, zapowiedź ataku wroga, jego widoczny pocisk, obrażenia i następna tura. Pauza, utrata fokusu, czyszczenie wejścia i bezpieczne zwalnianie WASM.
- Mapa z rozgałęzieniami, nagrody, cztery zdolności i sześć artefaktów, ziarna za zwycięstwo, sklep, elita, boss, oba finały i restart. Lokalny checkpoint między starciami z walidacją danych.
- Responsywny ekran gry, przyciski dotykowe, klawiatura, suwaki i wybór kierunku, pomoc, kontrolowana kamera, dźwięk po interakcji, profile jakości i pomiar FPS.
- Stylizowana diorama 3D, autorskie modele z animacjami Idle/Walk/Attack, reakcja na trafienie, smugi, eksplozje i liczby obrażeń. Roślinność rysowana instancjami, statyczne części modeli połączone przed kompresją meshopt.

## Weryfikacja

| Sprawdzenie | Wynik |
|---|---|
| `npm test` | 138/138 PASS |
| `npm run build` | PASS, kontrola budżetu plików PASS |
| Lokalne `npm run test:visual` | 3/3 PASS |
| Desktop i telefon w Chromium | Rzut, nagroda, pauza i wznowienie zapisu PASS |
| Test odporności | Brak modelu → komunikat → ponowienie; dotyk, klawiatura po kliknięciu przycisku, blur, resize, restart i porażka PASS |
| Pełna wyprawa | Zakup w sklepie, zwykłe walki, elita, boss i ekran zwycięstwa przez rzeczywiste strzały PASS |
| Cloudflare HTTP | 51 plików HTTP 200; MIME JS/GLB, cache immutable i sumy modeli PASS |
| Cloudflare E2E | 3/3 PASS na deployment 96803d5b, pełna wyprawa zakończona zwycięstwem |

Testy fizyki obejmują zgodność wyników przy 30/60/120 Hz, trafienia i pudła, jeden wydatek akcji, atak przeciwnika, limity ruchu, skok, timeout, osłony, leczenie, modyfikatory nagród oraz pełną kampanię. Testy istniejącego sklepu sprawdzają zakup bez wystarczających środków i pominięcie wizyty.

Testy przeglądarkowe nie ustawiają HP przeciwnika na zero ani nie wywołują sztucznego zwycięstwa. Osobne fixture zapisu służą do kontroli układu z kompletem zdolności oraz zachowania sklepu z pustym portfelem.

## Rozmiary i wydajność

| Pomiar | Wynik |
|---|---:|
| Trzy finalne, animowane GLB | 211 816 B (około 207 KiB) |
| Cały kod/CSS i zasoby gry, przed HTTP | 4 365 605 B (4,16 MiB) |
| Całe `dist`, z grafikami landing page | 33 195 812 B (31,66 MiB) |
| Największy plik | Rapier z osadzonym WASM: 2 861 020 B |
| Limit wydania | 10 MiB gry; 25 MiB na plik Pages — PASS |

Pomiar sprzętowy: Windows, Chromium 147.0.7727.15, ANGLE / Intel UHD Graphics / Direct3D11, viewport 1440×900. Po rozgrzaniu sceny oba profile osiągnęły **60 FPS, p95 18 ms**. W arenie 68 wywołań rysowania; 22 596 trójkątów w profilu wysokim i 21 396 w oszczędnym. To krótki pomiar pojedynczej areny na tym komputerze, nie gwarancja dla każdego urządzenia.

Automatyczne E2E korzystają osobno ze SwiftShader. Ich wolniejszy programowy renderer służy do sprawdzenia zachowania, nie do certyfikacji wydajności telefonu. Interfejs przetestowano przy 390×844 i po obrocie do 844×390; fizyczny telefon pozostaje do odbioru ręcznego.

## Cloudflare

- Projekt: `kurczoker-makeover`; `main` zarezerwowany jako gałąź produkcyjna.
- Preview: [gra na gałęzi](https://baza080926-makeover.kurczoker-makeover.pages.dev/gra).
- Bieżący niezmienny deployment: [96803d5b](https://96803d5b.kurczoker-makeover.pages.dev/gra).
- HTML rewaliduje się; haszowane GLB i `_astro` mają rok cache immutable. Modele pobrane z preview mają identyczne SHA-256 z lokalnymi plikami.
- Stare generacje w `public/game/assets` pozostają w repo, ale build usuwa je z wydania. Landing page zachowuje swoje grafiki promocyjne.
- Nie przełączano `kurczoker.com` ani nie publikowano na produkcyjną gałąź. W dostępnym koncie nie było projektu tej gry, dlatego utworzono osobny projekt preview.

Znaleziony dodatkowy błąd: stary adres skryptu Umami na Vercel zwracał 404. Analityka jest teraz opcjonalna i wymaga skonfigurowania poprawnego adresu HTTPS oraz identyfikatora witryny w zmiennych builda. Gra nie zależy od tego serwisu.

## Artefakty i powtórzenie testów

Lokalne dowody są w `.superpowers/makeover-qa/`: `desktop-battle.png`, `mobile-battle.png`, `enemy-shot.png`, `victory.png`, logi testów, `hardware-performance.json`, `browser-performance.json` i `cloudflare-http.json`.

`node tools/verify-preview.mjs https://96803d5b.kurczoker-makeover.pages.dev` powtarza kontrolę HTTP. `KURCZOKER_VISUAL_BASE_URL` kieruje `npm run test:visual` na wybrane preview. `node test/visual/profile.mjs` wykonuje krótki pomiar sprzętowy Direct3D11 na Windows. CI uruchamia testy, build i przeglądarkę, zapisując obrazy jako artefakty.

Podstawa decyzji technicznych i źródła: [audyt oraz research](2026-09-08-kurczoker-audyt-i-plan-naprawczy.md). Zakres: [projekt](../superpowers/specs/2026-09-08-kurczoker-makeover-design.md), [TODO](../superpowers/plans/2026-09-08-kurczoker-makeover.md).
