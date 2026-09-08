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

## Task 06 — narożniki i zniszczone zaczepy

- RED: brak routingu narożników, zwolnienia usuniętego zaczepu; osobny RED dla zdarzenia informującego o zerwaniu.
- GREEN: 9 testów liny i kolizji PASS.
- Każdy odcinek przetestowanej trasy omija materiał. Strona owijania jest zachowywana, dopóki odcinki są legalne; po usunięciu ściany lina prostuje się.
- Kontur i widoczność między narożnikami cache'owane według rewizji terenu. Limit 12 pivotów i 128 kandydatów; niemożliwy przebieg odczepia z przyczyną, bez teleportowania.
- Długość constraintu uwzględnia odcinki przed ostatnim pivotem. Zniszczony zaczep zwalnia constraint i emituje rope-release/anchor-destroyed.

## Task 07 — wspólna balistyka

- RED: nowe testy wykazały stary generator trajektorii nieobsługujący maski terenu.
- GREEN: 23 testy balistyki, colliderów, postaci, liny i starego adaptera PASS.
- Jeden integrator lotu i swept shape cast obsługują podgląd oraz rzeczywisty pocisk, także strzały w lewo i dół.
- Eksplozja uwzględnia osłonę, obrażenia własne, impuls i krater. Dodatkowy test potwierdził deduplikację i dwie eksplozje bez kroku świata pomiędzy: druga widzi już usuniętą osłonę.

## Task 08 — narzędzia

- RED: trzy testy brakujących komend i podglądu narzędzi.
- GREEN: 8 testów narzędzi i balistyki PASS.
- Podgląd nie mutuje świata, puste narzędzie i fundament nie kosztują ładunku, udany wykop zużywa jedną akcję narzędzia i zostawia atak.
- Rzeczywisty ruch przez tunel wykrył próg siatki. Po diagnozie wyrównano dolną krawędź kilofa do pobliskiego podłoża; ciało przechodzi teraz cały wykop, bez przenoszenia pozycji.

## Task 09 — tury i wynik

- RED: pass i kolejka przeciwników nie istniały.
- GREEN: 9 testów tur i balistyki PASS; 6 istniejących testów tactical-simulation również PASS po integracji.
- Dowolny czas namysłu, telegraph 0.7 s, ograniczony ruch, jeden fizyczny atak każdego żywego przeciwnika i nowa tura.
- Sprawdzone pomijanie trupa w kolejce, pauza telegraphu, odnowienie narzędzia, tura wiszącego na lassie bohatera i jeden wynik lost przy jednoczesnej śmierci.

## Task 10 — sterowanie równoczesne

- RED: brak input routera. GREEN: 3 testy PASS.
- Osobne identyfikatory klawiatury i dotyku; skok nie zwalnia biegu. Żaden pointer release ani klawisz ruchu nie wywołuje ataku.
- Menu, utrata okna, widoczność i obrót czyszczą ruch/zwijanie; cleanup usuwa listenery. Formularze i repeat nie uruchamiają akcji.
- Podłączono również przejściowy Controls; test fizycznego multi-touch i nowego HUD odbędzie się w zadaniu 12.

## Task 11 — kamera

- RED: brak modułu kamery; dodatkowy RED po rzeczywistym sprawdzeniu telefonu: kurczak w kraterze chował się pod panelem celowania.
- GREEN: 4 testy kamery PASS. Cel kamery uwzględnia przestrzeń zajętą przez HUD, także nisko pod powierzchnią terenu.
- Przegląd, powrót do kurczaka, zoom i drag podłączone w nowym HUD/scenie (integrowane w task12). Codex IAB: chodzenie, fizyczne zwijanie lassa i śledzenie uniesionego kurczaka; obrót 390×844 → 844×390 zachował HP71 i turę2.
- Kamera nie ściska całej areny w pionie; full-map tylko w osobnym przeglądzie.

## Task 12 — pierwsza kompletna arena (M1)

- Wejście /gra?mode=quick: menu potyczki → Podwórze → wynik → rewanż. Stara wyprawa pozostaje przejściowo osobnym widokiem do migracji task21, korzysta z tego samego runtime.
- RED przeglądarkowy na świeżym buildzie: brak przycisku nowej potyczki.
- GREEN: 178/178 testów logiki; po ostatnim rozszerzeniu kamery 5/5 jej testów. Produkcyjny build PASS. Finalne testy przeglądarkowe 4/4 PASS, 0 błędów JS: 390×844, 844×390, 1440×900 oraz pełna walka 1280×720 ze zwycięstwem i rewanżem.
- Test telefonu wysyła dwa rzeczywiste punkty dotyku przez Chromium CDP i sprawdza jednoczesne przesunięcie oraz skok. Test pełnej walki używa wyłącznie klawiatury i przycisków: dwa skoki na wzgórze, dwa strzały, odpowiedź wroga, zwycięstwo, rewanż.
- Codex IAB: ręczne chodzenie (x6 → x9.55), zaczepienie belki, zwijanie unoszące ciało, huśtanie i puszczenie, wiercenie (rewizja1), strzał w dół (HP100 →71), nowa tura2. Pion i obrót do poziomu sprawdzone wizualnie; stan HP/tury przetrwał obrót.
- Wykryte i poprawione: czarne tło przypięte do grupy zamiast sceny; kamera chowająca postać w kraterze za panelem; brak belki w kadrze wyboru lassa w poziomie; pasek Astro przechwytujący dotyk; niepotrzebny render podczas pauzy.
- Zmieniono stary test wymuszający przegraną przez timeout na jawny pass i fizyczny atak przeciwnika.
- Artefakty lokalne: .superpowers/brand-foundation-final-build.log, brand-foundation-final-browser.log, brand-m1-final-tests.log oraz makeover-qa/brand-390.png, brand-844.png, brand-1440.png, brand-desktop-victory.png.
- Pierwszy przebieg desktopu przekroczył120s przy małej wolnej pamięci. Po zwolnieniu własnej dodatkowej karty/serwera końcowy przebieg wszystkich4 scenariuszy trwał123s i przeszedł. Testy automatyczne używają SwiftShader; to weryfikacja funkcjonalna i emulacja telefonu, nie pomiar realnego urządzenia.
- Dalsze dopracowanie: w task14 poprawić dekoracyjny pas trawy przy częściowo zasłoniętej górze scalonego boxa; finalne modele/animacje, profile jakości i pomiary pozostają task22–25.

## Task 13 — pełny arsenał

- RED dziewięciu testów przed implementacją. Końcowe 27/27 testów arsenału, pocisków, postaci i zgodności runtime PASS.
- Granajko odbija się i ma zapalnik; Dubeltówka używa pięciu zgodnych z podglądem promieni; Kopniak zadaje10HP i odrzuca; Mina-jajo uzbraja się, szkodzi obu stronom i spada po utracie podłoża; Jajo kasetowe tworzy pięć deterministycznych odłamków.
- Zużycie amunicji jest atomowe. Kopniak i śrut korzystają ze wspólnego naliczania obrażeń bez pozornej eksplozji. Miny/kopniak mają wybór kierunku; ruch odwraca postać i celowanie.
- Produkcyjny build PASS. Ostateczny test przeglądarkowy wszystkich pięciu nowych broni przez UI PASS,0 błędów JS,140s. Obrazy odłamków/miny/kopniaka obejrzane. Panel celowania znika na czas ataku, żeby odsłonić akcję.
- Artefakty: .superpowers/brand-arsenal-final-tests.log, brand-arsenal-final-build.log, brand-arsenal-final-browser.log, makeover-qa/brand-weapon-*.png.

## Task 14–16 — dziewięć map, role AI, szybka potyczka

- Testy RED: brak dziewięciu map/validatora, błędny powrót po usunięciu miękkiego gruntu, pas trawy wewnątrz wzgórza, brak ról AI i selektora.
- Testy końcowe:74/74 testów brand PASS; osobne10/10 testów map i pełnych przejść fizycznych PASS. Produkcyjny build PASS.
- Ostateczny zestaw przeglądarkowy:5/5 scenariuszy PASS (18 wariantów map, desktop/phone fundament, pełne zwycięstwo i rewanż),0 błędów JS,476s. Wcześniejszy test selektora9map, dwóch potyczek, odtworzenia zapasu/terenu i zachowania zapisu PASS (31s).
- Przejścia w runtime używają wyłącznie ruchu, skoku i fizycznego lassa: sześć map do pozycji przeciwnika, młyn przez przejście pod wieżą i schody, twierdza pod rusztowaniem. Wąwóz i wyspy przebyte także po skasowaniu mostów i przebudowie rzeczywistych colliderów. Heurystyka grafu jest dodatkowym sprawdzeniem, nie dowodem grywalności.
- Poprawiono prześwity i wysokości schodów po długich przejściach. Młyn ma schody dochodzące do prawej półki. Dodatkowe trwałe zaczepy umożliwiają wyjście nad krawędzie po zniszczeniu mostów. Trawa powstaje wyłącznie na odkrytej powierzchni.
- Codex IAB: wąwóz390×844, Lasso→Szukaj zaczepu→dotknięcie odległej belki, automatyczny powrót do bohatera, zwijanie przesuwające x7→9.11; obrót844×390 zachował przyczepioną linę,100HP i turę1. Tymczasowy viewport i karta testowa zamknięte.
- AI: strzelec strzela Jajooką, grenadier używa odbijającego granatu z zapalnikiem, szturmowiec szuka dojścia i kopie z zasięgu. Widoczna zapowiedź, maksymalnie120 ocen trajektorii na decyzję, graf powierzchni przebudowywany po rewizji terenu. Kolizje ruchu rozstrzyga Rapier; graf stosuje próbkowanie kapsuły i fizycznego łuku skoku.
- QuickSelect pokazuje przekroje z tych samych MapDef. Każdy start ma świeże100HP,6broni,3granaty/3śrut/2miny/1kasetowe/2kilofy/2wiertła. Tryb nie zapisuje kampanii.

| Mapa | Pion390×844 | Poziom844×390 | Przejście fizyczne |
|---|---|---|---|
| Podwórze | PASS | PASS | Skoki na wzgórze, pełna wygrana przez UI |
| Dwa wzgórza | PASS | PASS | Zejście do doliny i wejście na drugie wzgórze |
| Dachy kurników | PASS | PASS | Przejście po dachach i rusztowaniu |
| Wąwóz | PASS | PASS | Most oraz lasso po zniszczeniu mostu |
| Stary młyn | PASS | PASS | Tunel pod wieżą i schody na półkę przeciwnika |
| Jaskinie | PASS | PASS | Przejście pod pierwszą ścianą i nad drugą |
| Kamieniołom | PASS | PASS | Tarasy i schody między wzniesieniami |
| Trzy wyspy | PASS | PASS | Łańcuch lassa po zerwaniu obu mostów; dwie role w walce |
| Twierdza Jajokróla | PASS | PASS | Dziedziniec z prześwitem pod rusztowaniem |

- Artefakty: .superpowers/brand-m2-release-tests.log, brand-m2-release-build.log, brand-m2-verified-browser.log, brand-m2-final-browser.log, brand-all-traversal-tests-4.log; makeover-qa/map-*.png i quick-select-phone.png. Obrazy wszystkich dziewięciu topografii obejrzane. Funkcjonalne testy telefonu używają prawdziwych zdarzeń dotyku w emulowanym Chromium/SwiftShader; nie są pomiarem realnego urządzenia.
- Osobna pełna wygrana na każdej mapie i pomiary tempa/osiągów pozostają częścią końcowego odbioru task25. Najwyższe opcjonalne rusztowanie młyna wymaga jeszcze przeglądu w tym odbiorze.

## Task 17–18 — przebieg i ekonomia wyprawy

- Czysty reducer utrzymuje cztery walki, stabilne encounterId, trasy i przenoszenie HP/zapasów. Obcy/powtórzony wynik jest ignorowany; pierwsza porażka prowadzi do drugiej szansy, kolejna do końca wyprawy. Właściwe wznowienie powstaje w task20.
- Pierwsza nagroda daje Granajko3 i wybrane narzędzie. Kolejne wybory oferują broń z zapasem, jedno z trzech osiągalnych ulepszeń i leczenie/narzędzie. Sklep ma atomowe zakupy bez ujemnej waluty i ponownego zakupu tej samej oferty.
- Pancerz łagodzi pierwsze faktyczne trafienie o połowę; efekt0 nie zużywa osłony. Zdarzenie podaje faktycznie stracone HP. Buty zmniejszają koszt upadku do10%, pas daje po jednym narzędziu.
- RED: brak reducerów; po dodaniu reguł ekonomii osobne RED działania pancerza/butów. Dodatkowy test wykrył nieosiągalne ulepszenia przy stałej kolejności ofert — wybór jest teraz deterministyczny z seeda spośród nieposiadanych.
- GREEN:23/23 testów ekonomii, wyprawy i arsenału; parser JSX RewardPanel/ShopPanel PASS. Cztery pełne przejścia domenowe, odrzucanie duplikatów i brak zmiany wejściowego stanu sprawdzone.
- Ekrany łupu/sklepu są gotowe do podłączenia w task21; nie są jeszcze aktywnym trybem aplikacji. Test całej wyprawy przez UI, czas10–15min i odświeżenie pozostają task21/25.
- Artefakty: .superpowers/brand-expedition-red.log, brand-economy-runtime-red.log, brand-upgrades-red.log, brand-economy-final-tests.log. Task17–18 zapisane razem, ponieważ wynik walki generuje bezpośrednio ofertę nagrody.

## Task 19 — Jajokról

- RED: brak intencji bossa. GREEN:14/14 testów bossa, tur i ekonomii; parser trzech komponentów JSX PASS.
- Zamiar jest ustalany przed ruchem gracza. Salwa ma2 granaty, poniżej połowy HP3; cel pozostaje ten sam mimo przemieszczenia gracza i jest oznaczony w świecie.
- Szarża porusza dynamiczną kapsułę, respektuje collider i podłoże, ma maksymalnie8 jednostek oraz jedno trafienie20HP. Wycięcie podłoża po zapowiedzi zatrzymuje ją bez zastąpienia ukrytą salwą.
- Testy przeprowadzają salwy obu faz, przejście do następnej zapowiedzi, szarżę przez rzeczywistą fizykę i jej zatrzymanie. Fixture500HP izoluje zachowanie szarży od wcześniejszej porażki; nie stanowi dowodu balansu wyprawy. Odbiór bossa przez UI z produkcyjnym100HP i końcami wyprawy należy do task21/25.
- ResultPanel ma oba zakończenia i wejścia do nowej wyprawy/potyczki. Pełne połączenie ekranów w task21.
- Artefakty: .superpowers/brand-boss-red.log, brand-boss-tests.log, brand-boss-final-tests-2.log.

## M3 — Task20: pełny checkpoint i transakcje

- V2 SHA-256, limit8MiB, walidacja map/aktorów/ekwipunku/faz, odbudowanie Rapiera bez serializacji uchwytów. Legacy codec pozostaje dla historycznych danych; nie kasujemy localStorage.
- Odtworzenie krateru, granatu w locie, miny, liny, prędkości, PRNG i osłony: porównanie pełnego stanu i dalszego lotu.
- IndexedDB latest/previous w jednej transakcji. Test rzeczywistej przeglądarki wstrzykuje QuotaExceededError po zakolejkowaniu zapisu previous: transakcja cofa oba zapisy, reopen zachowuje poprawne D/C. Poprawiono utratę pierwotnego błędu przy abort.
- Druga szansa odtwarza battleStart i zapisuje secondChanceUsed przed zwrotem sterowania; awaria zapisu zostawia grę w pamięci z błędem. Most store potwierdza brak drugiej próby ponowienia.
- PASS: .superpowers/brand-storage-tests.log (1/1), .superpowers/brand-m3-checkpoint-regression.log (92/92), .superpowers/brand-m3-state-tests.log (11/11). Build .superpowers/brand-m3-build-2.log PASS po poprawieniu granicy SSR/przeglądarka.
- Task20 i21 są integrowane w jednym commicie: nowy codec, store i aktywna ścieżka UI muszą zostać przełączone razem. Task21 nadal w odbiorze.

## M3 — Task21: aktywna wyprawa i ekrany

- Jeden BrandStore steruje mapą, nagrodami, sklepem, wynikiem oraz runtime. Usunięto nieaktywny stary komponent KurczokerCanvas; aktywna ścieżka nie importuje starego updateBattle/tickBattle ani syntetycznych wyników. Historyczne testy codec zachowują osobny legacyCheckpoint.
- Checkpoint przy wejściu, przed atakiem, przy pauzie i na początku kolejnej tury. Async inicjalizacja zwalnia anulowane światy; jeden GameRuntime na encounter. Menu odczytuje poprawny zapis, nowa wyprawa potwierdza zastąpienie postępu. Quick zachowuje game i nie zapisuje wyprawy.
- Naprawiono renderowanie wielu przeciwników: Chicken odczytuje actorId zamiast pierwszego enemy i nie kopiuje maski terenu w każdej klatce.
- PASS: .superpowers/brand-expedition-browser-3.log: pełne zwycięstwo Podwórze→Wzgórza→Młyn→Jajokról z 100HP startu, prawdziwe ruchy/skoki/ataki, nagrody i dwa sklepy; osobny reload zachowuje faktyczny krater i drugą turę. 2/2 PASS.
- PASS: .superpowers/brand-expedition-errors-browser.log: defeat→retry→reload→defeat bez drugiej próby oraz rzeczywisty QuotaExceededError z komunikatem i możliwością walki. 2/2 PASS.
- Bot nie dopisuje HP ani wyników do runtime/store. Czyta widoczne diagnostyki aktorów i używa klawiatury oraz przycisków. Pierwsze próby FAIL wynikały z celowego samouszkodzenia w teście zapisu i strzelania zza krawędzi krateru; rozdzielono scenariusze oraz poprawiono ruch testowego gracza. Balansu nie zmieniano, żeby zaliczyć test.
- Codex IAB: trasa390×844, walka/startowe2bronie, strzał i odpowiedź, pauza/menu/Wznów, odtworzony krater +75HP/tura2, obrót844×390. Brak overflow HUD; viewport zresetowany, karta zamknięta. Screenshots automatów expedition-1..4.png oraz expedition-failure.png w .superpowers/makeover-qa.
- Pełna wygrana automatu361s. Nie jest to pomiar osoby35–65 ani potwierdzenie docelowych10–15min; trzy pomiary gry i szerszy balans należą do25.

## M4 — Task22: modele, animacje i rendering

- Pięć oryginalnych modeli Y-up: hero, shooter, grenadier, rusher, boss. Osiem klipów każdego: Idle/Walk/Jump/Swing/Land/Attack/Hit/Defeat; lokalne przeguby skrzydeł i stóp, hełm/scarf/korona, sprzęt sześciu broni w dłoni. Łącznie 258588 bajtów GLB.
- Manifestv2 zawiera SHA-256, rzeczywisty rozmiar, klipy i pochodzenie. Wszystkie czytniki zmigrowane do assets; meshopt skonfigurowany w loaderze. KTX2=null, ponieważ modele nie mają tekstur Basis ani innych rastrowych. Loader potrafi skonfigurować KTX2/detectSupport, kiedy manifest faktycznie wskaże takie zasoby.
- Kontrola obrazu ujawniła błąd join po dedup: współdzielone geometrie dostawały błędne transformacje (jedno oko znikało, granaty unosiły się obok). RED: brand-geometry-bounds-red.log. Kolejność join→dedup zachowuje oba oczy i zakresy każdego materiału; test porównuje surowy model autora z finalnym dekodowanym GLB dla wszystkich5postaci. PASS4/4: brand-assets-tests-2.log.
- Assety mają jawne dispose, klony współdzielą geometrię, nieużywane/asynchronicznie anulowane zestawy są zwalniane. Drzewa, pagórki i kryształy są instancjami. Młyn obraca się wg czasu symulacji i zatrzymuje w pauzie.
- Wybór finalny: MeshLambertMaterial (oświetlenie wierzchołków), bez kosztownych map cieni, z cieniem kontaktowym pod postacią. Profil auto obniża DPR do.65 po wolnych próbkach, low=.75, high=1.5. Profile zmieniają rendering/cząstki, bez ingerencji w runtime.
- Software SwiftShader, izolowane porównanie: wcześniejszy shader PBR telefon21FPS/p9551ms i desktop6FPS/p95186ms; Lambert telefon60FPS/p9519ms, desktop17FPS/p9575ms przed adaptacją. Codex IAB na tej maszynie:60FPS/p9517ms już przed uproszczeniem shadera. Software render nie jest pomiarem fizycznego telefonu.
- Końcowy test porównuje natywny niższy target z EffectComposer+RenderPixelatedPass+OutputPass (poprawna konwersja kolorów). Arkusz40postaci: native9.84ms vs pixelated27.81ms średnio z8renderów z gl.finish; to benchmark arkusza, nie p95 rozgrywki. Wybrano native dla kosztu i czytelności.
- PASS3/3 brand-m4-render-verified.log: pięć nowych broni obok Jajooki przez faktyczne UI, błąd pobrania GLB i retry tej samej areny, arkusz wszystkich40póz. Obejrzano brand-animation-sheet.png, warianty Native/Pixelated, brand-new-model-phone.png oraz lambert-390/1280.png.
- Ograniczenie pomiaru: próbki testu po retry/resize (10/25FPS, p95188/103ms) obejmują zmianę rozmiaru i rozgrzewanie; nie przedstawiamy ich jako spełnienia budżetu FPS. Stabilny pomiar adaptacji, wybuchów i fizycznych urządzeń pozostaje w25.
- Build brand-adaptive-build.log PASS; publikowany bundle gry około4.54MB nieskompresowane, pliki poniżej25MiB. To nie jest pomiar transferu z Cloudflare.


## Task 23 — ustawienia, pomoc i audio

- PASS: 13 testów settings/audio/camera (`.superpowers/brand-settings-final.log`), build (`brand-settings-build-final.log`), browser (`brand-settings-browser-final.log`, 1/1).
- Browser: zapis i odświeżenie ustawień, oddzielne głośności, HUD 125%, leworęczne sterowanie, wyłączony shake, natywna pułapka fokusu dialogu, Pomoc → Escape → Pauza → wznowienie, 390×844 i 844×390. Brak błędów pageerror.
- Obejrzano oba zrzuty ustawień. Poprawiono kamerę w poziomie: cały kurczak jest widoczny nad panelem celowania także z HUD 125%.
- Reduced motion wyłącza wstrząsy, obrót pocisków, smugę, rozszerzanie/obrót eksplozji, dodatkowe odłamki i miganie uzbrojonych min. Pozostają lot, ruch i czytelna informacja o obrażeniach.
- Oryginalny motyw syntezowany lokalnie. AudioContext dopiero po interakcji; oddzielne kanały, pauza bez zaległych dźwięków, deduplikacja zdarzeń obejmuje identyfikator walki.


## Task 24 — landing DELTA240MVT

- Nowy landing: dwa bezpośrednie tryby, wznowienie poprawnego aktywnego zapisu, rzeczywisty klip WebM i poster z builda, dziewięć podglądów z danych map, zasady, autor, FAQ i aktualny opis zapisu lokalnego.
- Typografia Inter Variable / IBM Plex Mono z lokalnych paczek Fontsource (OFL), paleta z DESIGN-MASTER. Wzorzec hero z lokalnego `strony-sprzedażowe/baza-wiedzy/hero-component-desktop.md`: obietnica, opis, CTA, dowód w postaci gry. Brak nowych integracji analitycznych.
- RED: poprzedni landing nie zawierał zatwierdzonego H1 (`brand-landing-red.log`). PASS: build, `brand-landing-browser-final.log` (odtwarzanie filmu, obie ścieżki, 9 map, FAQ, brak canvas/GLB/Rapier przed grą, brak overflow 360px i 1440px). Kontrola w Codex IAB oraz zrzut całej strony 360px.
- Lekki moduł wznowienia sprawdza checksum i walidację zapisu, bez importowania symulacji/Three. Szybkie mapy mają bezpośrednie parametry `map`.
- Pełny test unit wykazał 237/239 PASS; dwa testy analityki wymagały migracji selektorów źródła po przeniesieniu stopki do komponentu i zmianie cudzysłowów. Zakres sprawdzenia zachowany.
