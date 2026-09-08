# KURCZOKER brand redesign — dziennik wykonania i QA

Gałąź `baza080926-makeover`, istniejący checkout. Plan: `docs/superpowers/plans/2026-09-08-kurczoker-brand-redesign.md`.

## Baza — 2026-09-08

- Node 22.23.0, instalacja `npm ci` z istniejącego lockfile: PASS, 590 pakietów.
- Rapier compat zainstalowany w wersji 0.20.0; deklaracje są w `dist/`, nie w korzeniu pakietu.
- `npm test`: 143 PASS / 0 FAIL (138 dotychczasowych + 5 nowych testów maski).
- `npm run build`: PASS. Logi lokalne: `.superpowers/brand-baseline-tests.log`, `.superpowers/brand-baseline-build.log`.
- Instalator zgłosił 26 alertów audytu zależności (3 low, 3 moderate, 20 high). Nie uruchamiano automatycznej aktualizacji zmieniającej lockfile; ocenę zależności runtime należy uwzględnić przed wydaniem.
- Nie wykonano jeszcze odbioru nowej gry w przeglądarce ani deploymentu. Wczesne moduły terenu nie są jeszcze podłączone do UI starej gry.

## Task 01 — maska terenu i kontrakty

- RED: 5 testów wykazało brak createTerrain/nextRandom.
- GREEN: `node --test test/brand-terrain.test.js`, 5 PASS.
- Sprawdzone: krater, odporny fundament, tunel przez granicę fragmentu, idempotencja, ujemne/out-of-bounds operacje, niepoprawne liczby, niezależność snapshotu, powtarzalny PRNG.
- Materiały przechowywane w Uint8Array; operacje wycinania aktualizują tylko trafione fragmenty. Widok i adapter kolizji korzystają z tej samej maski.

## Task 02 — geometria i kolizje

- RED: 3 testy wykazały brak generatora boxów i synchronizacji colliderów.
- GREEN: maska + kolizje, 8 PASS / 0 FAIL.
- Realny Rapier potwierdził zniknięcie kolizji po wycięciu tunelu oraz zachowanie kolizji fundamentu.
- Porównanie każdej komórki maski z boxami: brak dziur, nakładania i zmiany materiału. Scalanie ogranicza liczbę colliderów; przebudowa zachowuje obiekty niezmienionych fragmentów.

## Task 03 — dynamiczny kontroler i stały krok

- RED: 3 nowe testy wskazały brak kontraktu dispatch/dynamicznego bohatera.
- GREEN: 3 testy kontrolera oraz 6 istniejących testów tactical-simulation PASS.
- Sprawdzone: rzeczywisty dynamic body, ruch, skok, brak drugiego skoku w powietrzu, sufit, cienka ściana, blokada osi Z, pauza, porównanie kroków 1/30 i 1/60, ponad 30 sekund decyzji bez zmiany tury, ograniczenie nadrabiania długiej klatki.
- Zachowano przejściowe wywołania starego UI w tym samym runtime (bez drugiego silnika). Zastąpiono widoczny zegar tekstem „Bez pośpiechu”; usunięto TURN_SECONDS. Pełny nowy HUD pozostaje zadaniem 12.

## Task 04 — upadki i bezpieczny powrót

- RED: 4 testy wykazały brak kosztu upadku, porażki i walidacji powrotu.
- GREEN: 4 testy upadków oraz 3 regresje kontrolera PASS.
- Koszt 20% maksymalnego HP dotyczy obu stron i jest naliczany raz. Brak zdrowia lub jakiegokolwiek poprawnego miejsca kończy życie postaci.
- Powrót sprawdza aktualny materiał pod stopami, wolną przestrzeń na ciało i zajęcie przez inne postacie. Nie korzysta ze zniszczonej półki.

## Task 05 — fizyczne lasso

- RED: 3 testy wykazały brak zaczepiania i stanu liny.
- GREEN: 3 testy lassa PASS, na dynamicznym ciele Rapiera i natywnym rope joint.
- Zwijanie rzeczywiście unosi bohatera; puszczenie zachowuje obie składowe prędkości. Sprawdzone granice długości 1.2–18, przesłonięty/pusty/odległy/niepoprawny zaczep i brak przenikania przez belkę.
- Długość jointa zmieniana przez odtworzenie constraintu, ponieważ RopeImpulseJoint w zainstalowanym API nie udostępnia setLimits. Nie przestawiamy pozycji bohatera w celu naciągnięcia liny.
