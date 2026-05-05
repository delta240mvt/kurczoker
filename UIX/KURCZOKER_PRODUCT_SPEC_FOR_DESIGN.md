# KURCZOKER - pelna specyfikacja produktu dla Claude Design / GPT Image 2.0

Data: 2026-05-04  
Projekt: `kurczoker.com`  
Typ produktu: statyczna strona Astro + przegladarkowa mini gra roguelite w Canvas 2D  
Cel dokumentu: przekazanie kompletnego briefu produktowego i wizualnego do narzedzia generujacego nowa szate graficzna.

---

## 1. Najwazniejszy cel redesignu

KURCZOKER ma wygladac jak dopracowana, zabawna, lekko absurdalna gra browserowa premium, a nie jak standardowy landing page SaaS. Pierwszy ekran ma natychmiast komunikowac:

- to jest gra, w ktora mozna od razu kliknac;
- glowny bohater to kurczak / kogut-fantasy walczacy jajobombami;
- klimat to komediowe fantasy, artefakty, krótkie wyprawy, eksplozje i boss na koncu;
- UI jest czytelny i funkcjonalny na desktopie oraz mobile;
- gra jest lekka, bez logowania, bez backendu i bez konta.

Projekt graficzny powinien ulepszyc istniejacy produkt, ale nie zmieniac jego podstawowej struktury. Najbardziej potrzebne sa: piekny hero, mocniejsza identyfikacja wizualna gry, lepszy canvas/game frame, dopracowany HUD, ladniejsze karty nagrod, ladniejsze ekrany koncowe i spojny styl postaci.

---

## 2. Obecny produkt w skrocie

KURCZOKER to mini roguelite na stronie www. Uzytkownik laduje na stronie, widzi tytul `KURCZOKER`, podtytul, HUD i centralny obszar gry. Gra dziala w petli:

1. Start wyprawy na mapie.
2. Wybor dostepnego wezla.
3. Walka, skarb, sklep, elita albo boss.
4. W walce gracz celuje, porusza sie i odpala jedna akcje.
5. Po walce wybiera nagrode.
6. Wraca na mape i idzie dalej.
7. Koniec następuje przez przegrana albo pokonanie bossa.

Technicznie projekt jest statyczny:

- Astro jako shell strony.
- Vanilla JS dla gry.
- Canvas 2D jako renderer.
- Web Audio tylko po interakcji uzytkownika.
- Brak logowania, kont, cookies, backendu, bazy danych i zewnetrznego API runtime.

---

## 3. Aktualne screenshoty referencyjne

Poniższe obrazy sa kompletna lista ekranow, ktore musza zostac zaprojektowane w nowej szacie graficznej. Sa to statyczne plansze specyfikacyjne wygenerowane na bazie faktycznych stanow aplikacji.

### 3.1 Desktop landing + pierwszy viewport

![Desktop landing](./product-spec-assets/01-landing-desktop.png)

Wymagania:

- Tytul `KURCZOKER` musi byc dominujacym sygnalem pierwszego viewportu.
- Gra nie moze byc ukryta pod CTA albo nizej na stronie. Centralny obiekt to game shell z canvasem.
- Dol kolejnej sekcji powinien byc lekko widoczny pod hero, zeby strona nie wygladala jak martwy fullscreen.
- Hero ma byc bardziej immersyjne: tlo moze pokazywac kurnik-fantasy, trawiasta mape, zrujnowane gospodarstwo, jajobomby, artefakty lub daleki zamek bossa.

### 3.2 Ekran mapy wyprawy

![Mapa wyprawy](./product-spec-assets/02-hero-map-state.png)

Wymagania:

- Mapa powinna byc czytelna jako sciezka roguelite.
- Wezly musza byc rozroznialne: start, battle, treasure, shop, elite, boss.
- Dostepny wezel powinien miec wyrazny stan aktywny/klikany.
- Aktualny wezel powinien byc rozpoznawalny bez czytania etykiety.
- Linie pomiedzy wezlami musza wygladac jak trasa wyprawy, nie jak wykres techniczny.

### 3.3 Ekran walki - tura gracza

![Walka - tura gracza](./product-spec-assets/03-battle-player-turn.png)

Wymagania:

- To najwazniejszy ekran gry. Musi wygladac dynamicznie.
- Gracz widzi bohatera, przeciwnika, platformy, przeszkody, celowanie i aktualna ture.
- Tor lotu / wskaznik celowania powinien byc czytelny i atrakcyjny.
- Postacie powinny miec charakter: kurczak-bohater, czerwony przeciwnik, boss jako wieksza forma.
- UI nie moze zaslaniac pola walki.

### 3.4 Ekran wyboru nagrody

![Nagroda](./product-spec-assets/04-reward-choice.png)

Wymagania:

- Karty nagrod musza byc ladne i natychmiast porownywalne.
- Kazda karta ma typ, nazwe, wartosc/efekt i ikone lub ilustracje.
- Karta hover/selected powinna wygladac jak realny wybor w grze.
- Nagrody powinny miec osobne style dla: ability, artifact, heal, gold, summon.

### 3.5 Ekran przegranej

![Game over](./product-spec-assets/05-game-over.png)

Wymagania:

- Ekran przegranej powinien miec mocny komunikat, ale nie byc ponury.
- Powinien zachecac do restartu.
- Potrzebny jest czytelny przycisk restartu w game shellu.
- Dobrze sprawdzi sie humorystyczna ilustracja porazki: rozbite jajko, przewrocony helm, przestraszony kurczak.

### 3.6 Ekran zwyciestwa

![Run complete](./product-spec-assets/06-run-complete.png)

Wymagania:

- Ekran zwyciestwa powinien wygladac jak domkniecie wyprawy.
- Powinien pokazac triumf nad bossem, zdobyty artefakt albo finalny sztandar.
- Nie moze wygladac jak zwykly alert systemowy.
- Powinien zachowac mozliwosc restartu.

### 3.7 Mobile - mapa

![Mobile mapa](./product-spec-assets/07-mobile-hero-map.png)

Wymagania:

- Mobile ma byc projektowany jako realny tryb gry, nie tylko skurczony desktop.
- Tytul i game shell musza miescic sie bez nakladania tekstu.
- Przyciski `Action`, `Restart`, mute musza byc wygodne dotykowo.
- HUD ma byc bardziej zwarty niz desktopowy.
- Canvas musi zachowac proporcje i czytelnosc mapy.

### 3.8 Mobile - walka

![Mobile walka](./product-spec-assets/08-mobile-battle.png)

Wymagania:

- W walce mobile najwazniejsze sa: czytelnosc postaci, celowania, przyciskow i statusu.
- Dolna czesc canvasu nie moze byc zaslonieta przez status albo HUD.
- Projekt powinien przewidziec dotykowe celowanie: drag po canvasie, release jako akcja.
- Elementy dekoracyjne musza ustapic funkcji gry.

---

## 4. Wszystkie wymagane okna i stany produktu

### 4.1 Landing hero / game shell

To pierwsze okno, ktore widzi uzytkownik. Musi zawierac:

- eyebrow: `Jajobomby, artefakty i szybkie wyprawy`;
- H1: `KURCZOKER`;
- subtitle: krótki opis gry, najlepiej po angielsku lub polsku, ale stylistycznie spójny;
- game shell z HUD-em, przyciskami i canvasem;
- status message pod canvasem;
- lekko widoczna nastepna sekcja strony.

Elementy stale game shell:

- HUD `HP`;
- HUD `Node`;
- HUD `Scene`;
- HUD `Ability`;
- przycisk `Action`;
- przycisk `Restart`;
- przycisk mute z ikoną audio;
- canvas 16:9;
- pasek statusu.

### 4.2 Mapa wyprawy

Mapa jest scena poczatkowa i scena powrotu po nagrodzie. Obecne typy wezlow:

- `start` - kurnik startowy;
- `battle` - standardowa walka;
- `treasure` - nagroda/skrzynia;
- `shop` - prosty sklep albo zapas ziaren;
- `elite` - trudniejsza walka;
- `boss` - finalny boss.

Potrzebne stany wizualne wezla:

- zablokowany;
- dostepny do wyboru;
- aktualny;
- ukonczony;
- boss/finalny.

Design mapy powinien przypominac wyprawe przez dziwne kurze królestwo: grzedy, sciezki, slady lap, tabliczki, mostki, sloma, ziarenka, mini choragiewki. Moze byc stylizowany jak mapa planszowa albo mini mapa kampanii fantasy, ale nadal musi byc czytelny w canvasie.

### 4.3 Walka

Walka jest aktywna, turowa i krotka. Zawiera:

- bohatera gracza;
- 1-3 przeciwnikow;
- platformy;
- hazardy, np. kolce;
- wskaznik tury i czasu;
- projectile / jajobombe;
- eksplozje i knockback;
- prosty enemy response.

Fazy walki:

- `player-turn`;
- `projectile`;
- `enemy-turn`;
- `won`;
- `lost`.

Wymagania wizualne:

- bohater powinien byc natychmiast rozpoznawalny;
- przeciwnicy powinni miec czytelna hierarchie: grunt, elite, boss;
- tor pocisku powinien byc piekny, ale nie rozpraszajacy;
- eksplozje jajobomb powinny byc komediowe i soczyste;
- pasek HP nad postaciami powinien byc czytelny;
- plansza musi miec glebokosc i klimat, nie tylko plaski prostokat nieba i trawy.

### 4.4 Wybór nagrody

Ekran po walce albo treasure node. Gracz wybiera jedna nagrode. Typy nagrod:

- ability;
- artifact;
- summon;
- heal;
- gold.

Karta nagrody powinna miec:

- ilustracje albo ikone;
- nazwe;
- typ;
- krótki efekt;
- wartosc/liczbe, jesli dotyczy;
- stan hover;
- stan selected;
- stan disabled tylko jesli w przyszlosci potrzebny.

Przyklady nagrod:

- `Egg Bomb` / `Jajobomba` - podstawowy pocisk;
- `Crest Jump` / `Grzebieniowy Skok` - ruch lub skok;
- `Guard Chick` / `Pisklak Straznik` - summon;
- `Mana Grain` / `Ziarno Many` - buff;
- `Crest Crown` / `Korona Grzebienia` - artefakt;
- `Wind Boots` / `Buty Kurnikowego Wiatru`;
- `Chaos Egg` / `Zgnile Jajo Chaosu`;
- `Golden Grain Ring` / `Pierscien Zlotego Ziarna`;
- `Prophet Hen` / `Kura Prorocza`;
- `Shell Shield` / `Tarcza Skorupki`;
- `Warm Broth` / `Rosol bojowy`;
- `Grain Purse` / `Zapas ziaren`.

### 4.5 Game over

Stan terminalny po przegranej. Musi zawierac:

- mocny tytul;
- krótki komunikat;
- zachowany HUD z `Scene: Game Over`;
- dostepny restart;
- wizualny sygnal porazki.

### 4.6 Run complete / victory

Stan terminalny po bossie. Musi zawierac:

- tytul zwyciestwa;
- komunikat finalny;
- zachowany restart;
- wizualny sygnal triumfu;
- opcjonalnie male podsumowanie runu w przyszlosci.

### 4.7 Sekcje pod hero

Obecna strona ma dodatkowe sekcje:

- `Run loop` z trzema kaflami: Pick a path, Win the turn, Shape the run;
- `Artifacts` z czterema kartami;
- `Roadmap` z lista elementow gry;
- footer.

Redesign powinien zachowac te sekcje, ale nie moze robic z nich marketingowej strony bez gry. To sa sekcje wspierajace produkt. Pierwszy viewport pozostaje najwazniejszy.

---

## 5. Styl wizualny

### 5.1 Kierunek artystyczny

Rekomendowany kierunek: `polished comic pixel-fantasy arcade`.

Opis:

- komediowe fantasy;
- swiat kurnika przerobiony na mini królestwo;
- bron: jajobomby, ziarna many, skorupkowe tarcze;
- artefakty wygladaja jak relikwie zrobione ze zlota, slomy, skorup i piór;
- postacie maja duze sylwetki i wyrazne emocje;
- UI jest grube, dotykowe, z ciemnym konturem;
- canvas wyglada jak ekran gry, nie jak placeholder.

Unikac:

- generickiego SaaS landing page;
- zbyt realistycznego horroru;
- ciemnego, ponurego fantasy;
- gladkich korporacyjnych gradientow;
- nadmiaru fioletu/granatu;
- zbyt drobnych detali, ktore znikna na mobile;
- efektu taniej gry flash bez dopracowania.

### 5.2 Paleta

Obecne kolory:

- ink: `#171b15`;
- paper: `#fbf8ea`;
- paper strong: `#fffef6`;
- field: `#cadb91`;
- moss: `#526b36`;
- moss dark: `#25351e`;
- gold: `#d69b2d`;
- amber: `#f2c15b`;
- red: `#d94b38`;
- sky: `#8ec7d2`.

Nowa paleta moze je ulepszyc, ale powinna zachowac:

- jasne, cieple tlo;
- zielono-trawiasty swiat;
- zlote artefakty;
- czerwony akcent akcji;
- ciemny kontur;
- niebieskie niebo jako kontrast.

### 5.3 Typografia

Tytul `KURCZOKER`:

- duzy, masywny, zabawny;
- moze miec nieregularny comic/fantasy charakter;
- musi byc czytelny;
- nie powinien byc cienki ani elegancko-minimalistyczny.

Teksty UI:

- bardzo czytelne;
- wysokie kontrasty;
- bez zbyt malego fontu na mobile;
- liczby w HUD musza byc natychmiast skanowalne.

### 5.4 Ilustracje i assety

Potrzebne elementy:

- bohater-kurczak;
- przeciwnik zwykly;
- przeciwnik elite;
- boss;
- jajobomba;
- wybuch jajka;
- pisklak summon;
- ikony artefaktow;
- ikony typow wezlow mapy;
- tla areny walki;
- tlo hero;
- karty nagrod.

Wszystkie elementy powinny wygladac jak z jednego swiata.

---

## 6. UI komponenty do zaprojektowania

### 6.1 Game shell

Game shell to rama calej gry. Powinien miec:

- wyrazny kontur;
- lekki cien;
- stabilne proporcje;
- wyglad automatu/ramy gry albo planszy fantasy;
- responsywne skalowanie.

Nie powinien:

- wygladac jak przypadkowa karta SaaS;
- miec zbyt duzego paddingu;
- zaslaniac canvasu;
- zmieniac rozmiaru przy zmianie tekstu HUD.

### 6.2 HUD

HUD desktop:

- 4 pola: HP, Node, Scene, Ability;
- wartosci pogrubione;
- etykiety mniejsze;
- ikony opcjonalne.

HUD mobile:

- skondensowany;
- priorytet: HP, Scene, Ability;
- Node moze byc krótszy albo przeniesiony do statusu, jesli brakuje miejsca.

### 6.3 Przyciski

Przyciski:

- `Action`;
- `Restart`;
- mute.

Wymagania:

- duze hit targety;
- wyrazny hover/focus/active;
- ikonka dla mute;
- Action jako primary;
- Restart jako secondary, ale nadal widoczny.

### 6.4 Canvas HUD wewnetrzny

Canvas ma tez wlasny pasek statusu:

- HP;
- wezel;
- akcja;
- audio;
- message.

W redesignie mozna to uproscic, ale informacje musza pozostac dostepne. Jesli zewnetrzny HUD wystarcza, wewnetrzny pasek moze zostac zmieniony w subtelniejszy overlay.

### 6.5 Karty contentowe pod hero

Karty `Run loop` i `Artifacts` powinny byc spójne z gra:

- moga przypominac tabliczki, pergaminy, skrzynki, kafle ekwipunku;
- nie powinny byc zbyt dekoracyjne;
- kazda karta ma byc latwa do skanowania.

---

## 7. Mechanika i stan gry, ktore design musi obsluzyc

### 7.1 Kontrolki

Desktop:

- ruch: `A`, `D`, `ArrowLeft`, `ArrowRight`;
- skok: `W`, `ArrowUp`;
- celowanie: mysz / pointer drag;
- akcja: `Space`, `Enter`, klik/przycisk;
- wybór ability: `1`, `2`, `3`, `4`;
- restart: przycisk;
- mute: przycisk.

Mobile:

- drag po canvasie jako celowanie;
- release jako akcja;
- dolna czesc dotyku moze sterowac ruchem;
- gorna czesc dotyku moze oznaczac skok;
- przyciski musza byc wygodne dotykowo.

### 7.2 Abilities

Obecne ability:

| ID | Nazwa | Typ | Efekt |
| --- | --- | --- | --- |
| `egg-bomb` | Egg Bomb / Jajobomba | projectile | arcing egg shot, eksplozja |
| `crest-jump` | Crest Jump / Grzebieniowy Skok | movement | skok/ruch do lepszego kata |
| `guard-chick` | Guard Chick / Pisklak Straznik | summon | tymczasowy blocker/pomocnik |
| `mana-grain` | Mana Grain / Ziarno Many | buff | wzmacnia tempo/nastepny trick |

Design musi przewidziec ikone dla kazdej ability i czytelny stan selected ability.

### 7.3 Artifacts

Obecne artefakty:

| ID | Nazwa | Efekt |
| --- | --- | --- |
| `crest-crown` | Crest Crown / Korona Grzebienia | max HP + heal |
| `wind-boots` | Wind Boots / Buty Kurnikowego Wiatru | szybszy ruch |
| `chaos-egg` | Chaos Egg / Zgnile Jajo Chaosu | mocniejsza jajobomba |
| `golden-grain-ring` | Golden Grain Ring / Pierscien Zlotego Ziarna | gold |
| `prophet-hen` | Prophet Hen / Kura Prorocza | wiecej wyborow nagrod |
| `shell-shield` | Shell Shield / Tarcza Skorupki | blokuje hit |

Design musi przewidziec ikony, mini karty i ewentualny pasek posiadanych artefaktow.

### 7.4 Enemy types

Obecne lub przewidziane typy:

- grunt;
- elite;
- boss.

Design powinien pokazac:

- zwykly przeciwnik jako mniejszy, prosty;
- elite jako mocniejszy, bardziej grozny;
- boss jako duza, zapamietywalna sylwetka.

---

## 8. Responsywnosc

### 8.1 Desktop

Docelowo:

- szeroki hero;
- tytul nad game shellem;
- HUD w jednym rzedzie;
- canvas duzy, centralny;
- sekcje pod hero w gridzie.

### 8.2 Tablet

Docelowo:

- tytul mniejszy;
- game shell nadal centralny;
- HUD moze zawijac sie do 2 kolumn;
- karty sekcji moga przejsc do 1-2 kolumn.

### 8.3 Mobile

Docelowo:

- tytul nie moze nachodzic na game shell;
- game shell ma pelna szerokosc z marginesem;
- HUD 2 kolumny albo kompaktowy pasek;
- przyciski w jednym rzedzie: Action, Restart, mute;
- canvas 16:9 albo minimalnie wyzszy, jesli potrzeba na dotyk;
- status message nie moze zaslaniac gry.

---

## 9. Accessibility i czytelnosc

Wymagania:

- wysoki kontrast tekstu;
- focus visible dla przyciskow;
- mute jako przycisk z aria label;
- canvas z aria label;
- teksty w HUD nie moga sie obcinac w kluczowych wartosciach;
- mobile hit target minimum ok. 44px;
- nie polegac tylko na kolorze dla typow wezlow, dodac ksztalt/ikone.

---

## 10. Copy i ton komunikacji

Ton:

- absurdalne fantasy;
- krótkie, energiczne teksty;
- humor bez przesady;
- gra na pierwszym miejscu.

Przykladowe polskie copy:

- `Jajobomby, artefakty i szybkie wyprawy`;
- `Wybierz pierwszy szlak`;
- `Celuj, ruszaj sie i odpal jedna akcje`;
- `Wybierz nagrode`;
- `Boss czeka`;
- `Koniec wyprawy`;
- `KURCZOKER pokonany`.

Przykladowe angielskie copy, jesli strona ma zostac EN:

- `Feathered fantasy, explosive eggs, crooked artifacts, and a boss waiting at the end of a short run.`
- `Pick a path`;
- `Win the turn`;
- `Shape the run`;
- `Ready at the coop gate`.

Rekomendacja: UI gry moze byc po polsku, a landing moze byc polsko-angielski tylko jesli to cel marki. Najlepiej wybrac jeden jezyk w finalnym projekcie.

---

## 11. Prompt bazowy dla Claude Design / GPT Image 2.0

Uzyj ponizszego jako glownego promptu:

```text
Design a complete visual redesign for KURCZOKER, a browser mini roguelite game embedded in an Astro landing page. The product is a playable Canvas 2D game, not a generic SaaS landing page.

Style: polished comic pixel-fantasy arcade, funny chicken kingdom, explosive eggs, golden artifacts, grassy fantasy map, dark chunky outlines, warm paper UI, readable game HUD, premium browser game feel.

First viewport must show:
- Big title: KURCZOKER
- Short eyebrow about egg bombs, artifacts and short runs
- A central playable game shell with HUD, controls, canvas and status message
- A hint of the next page section below the hero

Design all required screens:
1. Desktop landing hero with playable game shell
2. Map screen with route nodes: start, battle, treasure, shop, elite, boss
3. Battle screen with chicken hero, enemy, platforms, hazards, aiming arc and projectile
4. Reward choice screen with cards for ability, artifact, heal/gold/summon
5. Game over screen
6. Victory / run complete screen
7. Mobile map screen
8. Mobile battle screen

UI components:
- Game shell frame
- HUD fields: HP, Node, Scene, Ability
- Buttons: Action, Restart, mute
- Canvas internal overlay
- Reward cards
- Map nodes with active/available/completed/locked states
- Ability and artifact icons

Constraints:
- Keep the game as the main object in the first viewport
- Avoid generic corporate gradients and SaaS cards
- Avoid dark gloomy fantasy
- Make all text readable on desktop and mobile
- Use strong visual hierarchy and clear touch targets
- Do not hide gameplay behind marketing sections
```

---

## 12. Prompt szczegolowy dla ekranu walki

```text
Create a polished battle screen for KURCZOKER. Canvas 16:9. A brave yellow chicken hero stands on the left, a red enemy chicken warrior on the right, with simple platform terrain, grass, sky, hazards and a visible arcing egg-bomb trajectory. Include a readable turn timer, HP bars above characters, and a compact game HUD. The art direction is comic pixel-fantasy with thick dark outlines, warm colors, expressive characters, and playful explosive energy. Do not make it realistic, dark, or generic. The UI must remain clear on mobile.
```

---

## 13. Prompt szczegolowy dla mapy

```text
Create a roguelite route map screen for KURCZOKER. It should show a funny chicken fantasy kingdom path with nodes for start, battle, treasure, shop, elite and boss. The map is inside a playable game shell, not a standalone poster. Nodes need distinct icons, colors and states: current, available, completed, locked. Style: warm paper, grass, straw, egg symbols, little flags, dark outlines, polished arcade UI. Keep the route readable at small sizes.
```

---

## 14. Prompt szczegolowy dla kart nagrod

```text
Design reward choice cards for KURCZOKER. Cards should represent ability, artifact, summon, heal and gold rewards. Each card needs a clear icon/illustration, name, type label, effect text and value. Style them as playful fantasy inventory cards made from warm paper, straw, shell fragments and gold trim, with chunky dark outlines and readable typography. Include hover/selected states. Do not use generic flat SaaS cards.
```

---

## 15. Definition of done dla finalnego designu

Finalny design jest akceptowalny, jesli:

- zawiera wszystkie 8 ekranow ze screenshotow referencyjnych;
- pokazuje desktop i mobile;
- ma gotowy game shell, HUD, przyciski, canvas, status;
- ma gotowe stany mapy, walki, nagrody, game over, victory;
- ma spójny styl bohatera, przeciwnikow, bossow, artefaktow i UI;
- pierwszy viewport jednoznacznie komunikuje, ze to gra;
- teksty sa czytelne bez powiekszania;
- mobile nie jest tylko miniaturka desktopu;
- projekt nie wyglada jak ogolny landing page;
- projekt da sie potem zaimplementowac w Astro + Canvas 2D bez backendu.

---

## 16. Uwagi implementacyjne dla projektanta

Nie trzeba projektowac:

- logowania;
- profilu;
- leaderboardu online;
- sklepu real-money;
- multiplayera;
- dashboardu administracyjnego;
- backendowych ekranow.

Trzeba projektowac:

- widoczna gre w hero;
- wszystkie stany gry;
- responsive UI;
- ikony ability/artifact/node;
- styl postaci i areny;
- wyglad sekcji pod hero.

Najwazniejsza decyzja: wszystko ma sluzyc temu, zeby uzytkownik od razu chcial kliknac `Action` i zaczac wyprawe.
