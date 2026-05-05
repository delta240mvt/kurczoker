# KURCZOKER — UIX Mockups Design

Zatwierdzony spec dla 10 statycznych mockupów HTML/CSS w folderze `UIX/mockups/`.
Mockupy odzwierciedlają nowy kierunek wizualny z `UIX/ChatGPT Image *.png`
(painted comic pixel-fantasy arcade) i są bazą do późniejszej implementacji
w `src/` (Astro + Canvas 2D). Same mockupy NIE są implementacją gry.

## Architektura

```
UIX/mockups/
  index.html              hub-nawigator (siatka 2×5)
  01-landing.html         KURCZOKER tytuł + 4 hint-cards
  02-mapa.html            mapa wyprawy
  03-walka-gracza.html    tura gracza + ability cards
  04-walka-wroga.html     tura wroga + odpowiedź
  05-nagroda.html         3 reward-cards
  06-sklep.html           4 shop-cards z cenami
  07-skarb.html           3 reward-cards + CTA
  08-boss.html            boss-bar + 3 ability hints
  09-game-over.html       end-modal KONIEC WYPRAWY
  10-victory.html         end-modal WYPRAWA UKOŃCZONA + stats

  _shared/
    base.css        reset + body + typografia bazowa
    tokens.css      CSS custom properties (paleta/font/spacing/cienie)
    shell.css       ramka, narożniki, listwy, HUD, przyciski
    statusbar.css   dolny pasek + ribbon wiadomości
    cards.css       karty: nagroda/sklep/skarb/hint
    overlays.css    modale: game-over, victory, boss-bar

  assets/
    svg/            ~12 ozdobników i ikon
    canvas/         10 PNG-ów wyciętych z UIX referencji (inner painted area)
```

Kolejność `<link>` w każdym mockupie: base → tokens → shell → statusbar → cards → overlays.

## Paleta

```
--shell-face:        #1d2746   ciemny granat — czoło ramki
--shell-deep:        #131a30   cień ramki
--shell-edge:        #0a0e1c   twardy outline
--shell-gold:        #d4a04a   złota listwa
--shell-gold-bright: #f2c15b   highlight złota
--shell-gold-deep:   #8a6322   cień złota

--paper:             #f3e9c8   ciepły kremowy pergamin
--paper-strong:      #fffbe8   highlight pergaminu
--paper-border:      #1a1f3a   ciemny outline pillsa

--status-bg:         #2a1d0a   ciemny brąz dolnego paska
--ribbon-bg:         #f3e9c8

--accent-red:        #c43e2c   Akcja, ribbon "Tura gracza"
--accent-red-hi:     #e35c44
--accent-blue:       #3f7fb8   Restart
--accent-blue-hi:    #5a9fd4

--ink:               #1a1f3a   tekst na jasnym
--ink-cream:         #f5e8c1   tekst na granatowym
--ink-muted:         #6b5e3a   etykiety w pillsach
```

## Typografia

```
--font-display: "Lilita One" → tytuł KURCZOKER, KONIEC WYPRAWY, h2 ribbon
--font-body:    "Inter"      → HUD, statusbar, body
```

Lilita One ładowana z Google Fonts (single weight ~6 KB).

## Inwentarz komponentów

| Klasa | Zastosowanie |
|---|---|
| `.shell` | granatowa rama + 4 narożne kryształy + złoty rim |
| `.shell__topbar` | HUD pillsy + przyciski Akcja/Restart/⚙ |
| `.hud-pill` | ikona + label + wartość |
| `.btn--action` / `.btn--restart` / `.btn--icon` | warianty przycisków |
| `.shell__canvas` | wewnętrzna płyta z `<img assets/canvas/0X-canvas.png>` |
| `.shell__statusbar` | dolny brązowy pasek z 4 `.status-pill` (HP/Węzeł/Akcja/Audio) |
| `.shell__ribbon` | kremowy ribbon wiadomości z piórem i seal-ami |
| `.hint-cards` + `.hint-card` | rząd 3-4 kontekstowych kart pod shell-em |
| `.reward-row` + `.reward-card` | 05/07: kremowe karty z ikoną/typem/efektem/wartością |
| `.shop-row` + `.shop-card` | 06: jak reward + cena + przycisk "Kup" |
| `.boss-bar` | 08: pasek HP bossa nad canvasem |
| `.end-modal` | 09/10: centralny modal z tytułem XXL + CTA-rząd |
| `.victory-stats` | 10: 3-kolumnowy rząd statystyk |

## Mapowanie ekranów → komponenty + canvas crop

| # | Ekran | Komponenty kontekstowe | Canvas content (crop) |
|---|---|---|---|
| 01 | landing | 4 hint-cards | tytuł + kurczak + mapa + zamek |
| 02 | mapa | 3 hint-cards | panorama królestwa z węzłami |
| 03 | walka-gracza | 3 hint-cards | scena bitwy z arkiem celowania |
| 04 | walka-wroga | 4 hint-cards | scena bitwy z eksplozją |
| 05 | nagroda | 3 reward-cards | tło sceny z ribbonem |
| 06 | sklep | 4 shop-cards | sklep w canvasie |
| 07 | skarb | 3 reward-cards + CTA | skrzynia + jaskinia |
| 08 | boss | boss-bar + 3 hints | arena bossa |
| 09 | game-over | end-modal + 4 hints | tło landing |
| 10 | victory | end-modal + stats | tło landing z konfetti |

## Decyzje techniczne

- **Format**: 10 osobnych HTML + jeden hub. Każdy plik = jeden ekran 1:1.
- **Canvas content**: PNG referencyjny wycięty do inner painted area
  (skrypt `scripts/crop-canvas.ps1`, jednorazowo). Owijany CSS-em chrome.
  Akceptujemy lekkie podwojenie warstw na ekranach 5/6/7/9/10
  gdzie PNG zawiera już overlay'e (karty, modal).
- **Język**: polski w UI (jak na referencjach), angielski w klasach CSS.
- **Mobile**: poza zakresem tej rundy. Jest planowany w drugiej rundzie.
- **Visual fidelity**: pure CSS dla ramki/HUD/przycisków + małe SVG-e
  (~12 plików) dla narożnych kryształów, ornamentów, ikon HUD.
  Bez sprite'ów rastrowych poza canvas content.

## Out of scope (świadomie)

- Sekcje pod hero z `index.astro` (Run loop, Artifacts, Roadmap, Footer)
  — w nowym kierunku ich rolę przejmują contextual `.hint-cards`
  pod shell-em w każdym ekranie.
- Mobile.
- JS interakcje (hover OK, click → nic).
- Astro/komponentyzacja — to są statyczne HTML.
