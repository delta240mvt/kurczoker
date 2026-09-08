# KURCZOKER — audyt gry i propozycja naprawy

Data: 8 września 2026. Odbiorca: właściciel projektu i wykonawcy przebudowy. Branch: `baza080926-makeover`. Badany commit: `31ec9a1`.

Status: zakończony audyt kodu i research architektury; kierunek produktu oraz poniższy zakres są propozycją do wspólnego uzgodnienia. To nie jest zatwierdzona specyfikacja implementacyjna. Kod gry nie został zmieniony ani wdrożony.

## Rekomendacja

Zachować Astro, React Three Fiber, Three.js i Cloudflare Pages. Przebudować runtime walki tak, aby postacie, pociski obu stron, kolizje i celowanie korzystały ze wspólnego świata fizycznego. Zachować użyteczną logikę mapy, nagród, sklepu i przebiegu wyprawy. Równolegle przygotować spójny, zoptymalizowany zestaw modeli z animacjami.

Pierwszym produktem przebudowy powinna być jedna kompletna, przyjemna do grania arena z docelową jakością grafiki. Dopiero po jej odbiorze rozszerzać zawartość do pełnej wyprawy. Dodawanie kolejnych modeli przed uporządkowaniem celowania i fizyki utrwali obecne problemy.

Nie ma dowodu, że Cloudflare jest przyczyną opisanej awarii. Odtworzone błędy działają lokalnie, bez hostingu. Obecny statyczny build jest zgodny z modelem publikacji Astro na Pages. [Cloudflare: Astro](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/).

## Zakres i sposób badania

- Inwentaryzacja repozytorium: 47 plików w `src`, 28 plików w `test`, istniejące specyfikacje i plany, konfiguracja budowania i deploymentu, historia ostatnich zmian oraz narzędzia przygotowania assetów.
- Szczegółowe śledzenie aktywnej ścieżki: `gra.astro → HeroGame → KurczokerCanvas → GameRuntime → store → MapScene/BattleScene → run/battle/abilities/physics` oraz interfejsu DOM i nakładek.
- Inwentaryzacja wszystkich 185 plików `public`; odczyt metadanych wszystkich 43 GLB: rozmiar, geometria, materiały, animacje, szkielety i rozszerzenia kompresji. Nie jest to artystyczny odbiór każdego modelu.
- Uruchomienie istniejących testów i builda. Osobne eksperymenty z rzeczywistą biblioteką Rapier i store gry. Próby testów przeglądarkowych z produkcyjnego `dist`.
- Research źródeł pierwotnych: Cloudflare, Three.js, R3F/Rapier, glTF Transform, Playwright, MDN; porównanie alternatyw Babylon i PlayCanvas. Dokumentacja sprawdzona 2026-09-08.

Nie badano zawartości sekretów, ustawień konta Cloudflare, rzeczywistego deploymentu produkcyjnego ani wydajności na fizycznym telefonie. Nie ma podstaw do podawania obecnego FPS ani gwarantowania konkretnego czasu ładowania.

## Wyniki sprawdzeń

| Sprawdzenie | Wynik | Co rzeczywiście potwierdza |
| --- | --- | --- |
| `npm test` | 125/125 PASS | Testowane reguły i asercje strukturalne; nie pełną grywalność |
| `npm run build` | PASS, 3 strony | Powstaje statyczny `dist`; ostrzeżenie o dużych chunkach |
| Test Rapier z kulą r=0,14 i parametrami rzutu z gry | Odtworzono rozjazd prędkości ok. 87× | Podgląd trajektorii nie odpowiada symulacji pocisku |
| Test store: odpowiedź wroga | 1 pocisk domenowy, po 1,5 s HP 3→2 | Atak wroga działa w starej symulacji, mimo braku jego renderowania w scenie 3D |
| `npm run test:visual` | Dwa scenariusze FAIL; dalszy bieg przerwany po powtarzających się timeoutach | Nie ma aktualnego zielonego E2E; nie dowodzi to samo w sobie przyczyny awarii produkcyjnej |
| Dodatkowy headless screenshot / podgląd w przeglądarce aplikacji | Timeouty | Ocena wizualna pozostała niepełna; brak wiarygodnego pomiaru FPS |

Pierwszy scenariusz E2E zatrzymał się na `locator.screenshot` w `r3f-smoke.test.js:492`; drugi na kliknięciu drogi w `:558`. Dodatkowa próba screenshotu działała częściowo równolegle, co mogło zwiększać obciążenie. Te wyniki trzeba ponownie zbadać w izolowanym środowisku. Nie należy przedstawiać ich jako dowodu, że każda przeglądarka zawsze zawiesza grę.

## Potwierdzone problemy i ich skutki

### 1. P0: podgląd rzutu i rzeczywisty pocisk mają inne prędkości

`src/engine/runtime/throwDynamics.js:42` wylicza tor za pomocą `origin + impulse * time`, czyli traktuje impuls jako prędkość. `src/engine/scenes/BattleScene.jsx:134` przekazuje te liczby do `applyImpulse`. Pocisk ma `BallCollider` o promieniu 0,14 i brak jawnie ustalonej masy.

Eksperyment na zainstalowanym Rapierze, dla aim `{x:1.4,y:0.92}`:

| Wielkość | Wartość |
| --- | --- |
| Masa wyznaczona z collidera | 0,011494 |
| Wynik `aimToThrow().impulse` | x=3,0516; y=2,0054 |
| Prędkość po `applyImpulse` | x=265,4966; y=174,4691 |
| Podgląd po 70 ms | x=0,2136; y=0,1262 |
| Rzeczywiste położenie po 4 krokach, ok. 66,7 ms | x=17,6909; y=11,6118 |

Rapier definiuje zmianę prędkości jako impuls podzielony przez masę. [Rapier: Forces and impulses](https://rapier.rs/docs/user_guides/javascript/rigid_body_forces_and_impulses/).

Naprawa projektowa: jedno pojęcie prędkości początkowej i te same parametry fizyki w podglądzie oraz wystrzale. Można ustawiać `setLinvel`, albo jawnie przeliczać impuls z masy. Podgląd powinien uwzględniać krok, grawitację, tłumienie i kolizje; test porównuje go z rzeczywistym torem, nie tylko z tą samą funkcją matematyczną.

### 2. P0: trafienie może być przyznane bez trafienia fizycznego

`BattleScene.jsx:237` ustawia `targetEnemy` na podstawie współrzędnej kliknięcia. `:115` uznaje późniejsze zakończenie lotu za trafienie wroga, jeśli flaga jest prawdziwa, także po opuszczeniu areny lub trafieniu w inny obiekt.

Skutek: gra potrafi nagradzać miejsce kliknięcia zamiast umiejętnego rzutu. Próby balansu na tym zachowaniu byłyby mylące.

Naprawa projektowa: wynik wynika wyłącznie z kolizji lub promienia eksplozji w świecie gry. Każdy pocisk rozstrzyga się dokładnie raz; pudło nie odejmuje HP.

### 3. P0: walka jest rozdzielona między dwie fizyki

`store/useGameStore.js:107` wywołuje stare `updateBattle`. `src/game/battle.js:106` porusza postacie w pikselach i obsługuje podłoże 2D. W scenie Rapier postacie są obiektami `fixed` z sensorami, a ich położenia pochodzą z tego starego stanu. Pocisk gracza jest natomiast niezależnym lokalnym stanem React i dynamicznym rigid body.

`src/game/battle.js:397` tworzy pociski wroga w `battle.projectiles`. `BattleScene` ich nie renderuje: montuje tylko lokalny `projectile` gracza. Odtworzenie w store pokazało ubytek HP 3→2 po odpowiedzi wroga.

Dodatkowo konfiguracja terenu `TERRAIN` w scenie nie pochodzi z platform starej symulacji. Widoczne modele świata są niezależne od colliderów, których pomocnicze meshe mają `visible={false}`. Sama niewidoczność colliderów jest normalna; problemem jest brak wspólnej definicji poziomu dla grafiki i kolizji.

Naprawa projektowa: Rapier jest właścicielem pozycji i kolizji całej walki. Domena zarządza turą, HP i wynikiem na podstawie zdarzeń. Jedna definicja poziomu opisuje widoczną geometrię, collider, punkty startowe i granice. Wystarczy prosty runtime; pełny framework ECS nie jest wymagany.

### 4. P1: celowanie i kamera nie mają wspólnego układu współrzędnych

Canvas używa stałego ortograficznego `zoom:72` (`KurczokerCanvas.jsx:143`). Mapowanie dotyku zakłada zawsze świat 9,6×5,4 (`BattleScene.jsx:252`). Kamera nie dopasowuje widocznego świata do areny.

Wniosek z kodu: dla canvasu o szerokości około 350 px widoczna szerokość świata przy tym zoomie wynosi około 4,86 jednostki. Początkowe x postaci to około −3,62 i +3,02, więc ich środki mogą wypaść poza kadr. To analiza geometrii, nie potwierdzony screenshot telefonu.

Naprawa projektowa: dopasowanie kamery do granic gry przy każdym resize; celowanie przez raycast do jednej płaszczyzny rozgrywki, wspólne dla myszy i dotyku. Grafika pozostaje pełnym 3D nawet przy ruchu ograniczonym do płaszczyzny.

### 5. P1: dotyk i sterowanie są niespójne

Obsługa `touchstart/move/end` przechowuje `touchGesture` w lokalnej zmiennej efektu. Efekt zależy m.in. od pozycji postaci i jest ponownie zakładany po ich zmianach (`BattleScene.jsx:287–345`). Store aktualizuje aktorów w każdej klatce. Gest może stracić stan między początkiem a końcem dotyku.

Równolegle działają touch listeners i handlery R3F pointer. Brakuje spójnego pointer capture, resetu wejścia po utracie fokusu oraz obsługi pauzy. Klawiatura w nowej scenie obsługuje ruch i skok; README obiecuje również strzał Space/Enter. Przycisk „Akcja” jest wyłączany przez shell przez całą walkę (`shellUiSync.js:117`).

Naprawa projektowa: jeden kontroler wejścia i jawne akcje ruch/skok/celuj/strzel. Desktop: klawiatura + mysz, mobile: oddzielne czytelne kontrolki. Input resetuje się na blur, pause, pointercancel i zmianę sceny. Brak zależności wyniku rzutu od tempa React render.

### 6. P1: część nagród i audio nie dociera do aktywnej gry

W domenie istnieją cztery zdolności i sześć artefaktów. Nowy runtime nie ma kompletnej ścieżki wyboru i uruchomienia zdolności. `runtime/domainEvents.js:18` sprowadza obrażenia do Egg Bomb; scena strzela zawsze jajem. Bonus Wind Boots zapisuje `moveSpeedBonus`, lecz `createEngineBattleState` nie przekazuje go do prędkości gracza. `temporarySummons` także nie jest odwzorowane na aktorów tej ścieżki.

Przycisk audio zmienia `ui.muted`, lecz aktywny engine nie korzysta z `src/game/audio.js`. Dźwięki podłączono do starego bootstrapu.

Naprawa projektowa: początkowo mały zestaw kompletnie działających zdolności i nagród. Każda pozycja dostępna w UI musi zmieniać realny przebieg walki, a dźwięk powinien reagować na te same zdarzenia co animacje i VFX.

### 7. P1: koszt sceny jest nadmierny już przed walką

| Pomiar lokalny | Wynik |
| --- | --- |
| Całe `public/` | 316,90 MiB |
| Wszystkie GLB | 43 pliki, 280,37 MiB |
| Unikalne modele wskazane przez mapę | 8 plików, 89,62 MiB |
| Największy model | ok. 15,05 MiB |
| Klipy animacji / szkielety w 43 GLB | 0 / 0 |
| Chunk bitwy, nieskompresowany | 2 281 078 B |
| Vendor R3F, nieskompresowany | 964 982 B |

Wielkość `public` jest wielkością publikowanej paczki, nie downloadem całej gry na wejściu. Wartość 89,62 MiB to suma plików wskazanych w kodzie sceny mapy; nie pomiar transferu HTTP. Rozmiary JS nie oznaczają transferu po gzip/Brotli.

Zbadany `clean-world-terrain.glb` ma trzy osadzone PNG 2048×2048. Trzy takie obrazy po rozkodowaniu do RGBA8 zajmowałyby około 48 MiB bez mipmap — to estymacja, nie odczyt rzeczywistej pamięci GPU. W assetach świata nie wykryto Draco, Meshopt ani KTX2. Obecni aktorzy mają około 9 tys. trójkątów i 39–47 primitives na model; sam mały rozmiar GLB nie gwarantuje niskiego kosztu renderowania.

Naprawa projektowa: oddzielić źródła i stare generacje od assetów produkcyjnych, walidować manifest faktycznie używanych modeli, obniżyć rozdzielczość tekstur tam, gdzie nie daje szczegółu, zastosować kompresję geometrii i tekstur GPU. KTX2 transkoduje do formatu obsługiwanego przez GPU; loader wymaga poprawnej konfiguracji transkodera. [Three.js: KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html).

### 8. P1: stan React i DOM aktualizują się z częstotliwością symulacji

`GameRuntime` wywołuje `tickBattle` z `useFrame`. Store tworzy nowy `game`; subskrybują go cały canvas, runtime oraz nakładki. `ShellStatusSync` uruchamia synchronizację DOM po zmianie `game`. Smuga pocisku i wiek eksplozji używają `setState` w klatce (`BattleScene.jsx:410`, `ExplosionFx.jsx:24`). To potwierdzony wzorzec kosztownych aktualizacji, ale jego udział w czasie klatki nie został sprofilowany.

Naprawa projektowa: transformacje, czas VFX i bufory cząstek w runtime/refs; HUD aktualizowany zdarzeniami i selektorami wartości, które rzeczywiście zmieniły się dla gracza. R3F odradza przepuszczanie szybkich aktualizacji przez React i zaleca bezpośredni odczyt store w pętli. [R3F: Performance pitfalls](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/pitfalls.mdx).

### 9. P2: testy i dokumentacja nie opisują wystarczająco działającego produktu

`test/integration.test.js:9` wymusza wygraną przez wpisanie fazy WON i HP wroga=0. To poprawny test przejść runu, ale nie dowód, że walkę da się wygrać wejściem użytkownika. `test/runtime-3d-world.test.js` sprawdza obecność nazw modeli w kodzie. Test trajektorii nie porównuje wyniku z Rapierem.

Istnieją szersze scenariusze Playwright, więc nie trzeba zaczynać QA od zera. Potrzebują jednak wiarygodnego działania, rejestracji błędów i testów realnej mechaniki. README nadal opisuje Canvas 2D, brak analityki i sterowanie niezgodne z nową ścieżką. Historia i specyfikacje zawierają kolejne warstwy migracji; stary bootstrap nie jest aktywnym rendererem strony, choć część jego domeny jest nadal używana.

## Trzy warianty działania

| Wariant | Korzyść | Koszt i ryzyko | Ocena |
| --- | --- | --- | --- |
| Przebudowa runtime na obecnym stacku | Zachowuje mapę, progresję, shell i deployment; pozwala zjednoczyć walkę oraz dodać prawdziwe animacje | Wymaga nowych granic odpowiedzialności, adaptera fizyki i testów | Rekomendowany |
| Minimalne łatanie obecnej sceny | Szybciej poprawi rzut, input i najgorsze ładowanie | Pozostawia podział fizyki i koszt kolejnych wyjątków | Tylko pilny hotfix, nie docelowy makeover |
| Przepisanie do Babylon lub PlayCanvas | Zintegrowane narzędzia silnika; PlayCanvas oferuje edytor scen dla autora poziomów | Migracja renderowania, fizyki, inputu i testów; nie rozwiązuje automatycznie balansu ani jakości assetów | Uzasadnione dopiero zmianą potrzeb workflow |

Babylon ma rozbudowane systemy grafiki, animacji i fizyki; PlayCanvas zapewnia edytor z podglądem na swoim silniku. Ich dostępność nie stanowi dowodu, że przebudowa obecnego projektu będzie tańsza. [Babylon: specifications](https://www.babylonjs.com/specifications/), [PlayCanvas: Editor](https://developer.playcanvas.com/user-manual/editor/).

## Proponowany produkt do uzgodnienia

Punkt wyjścia wynikający z repo: taktyczne, aktywne tury w stylu Worms, mapa krótkiej wyprawy roguelite, bohater-kurczak i komediowe fantasy. Proponuję pełne modele i oświetlenie 3D przy walce na czytelnej płaszczyźnie oraz kontrolowanej kamerze. Alternatywa produktowa — swobodny ruch po arenie w czasie rzeczywistym — zmienia sterowanie, AI, kamerę i skalę przebudowy; wymaga osobnej decyzji właściciela.

Roboczy zakres pełnej pierwszej wersji: jeden biom, 3 konfiguracje areny, 2 archetypy zwykłych przeciwników i boss, 3 działające zdolności, 6 artefaktów, sklep i skarb, menu/pauza/ustawienia, zwycięstwo/porażka/restart, zapis lokalny między starciami. Sesja docelowo 8–12 minut, do weryfikacji playtestem. To proponowany zakres, nie opis już istniejących funkcji.

## Architektura naprawy

Przepływ: **wejście gracza → polecenie → runtime walki/Rapier → zdarzenie → reguły HP i tury → prezentacja oraz HUD**.

- `Run`: wybór drogi, nagrody, sklep, zapis checkpointu i końcowy wynik. Zachować istniejące reguły, poprawiając kontrakty na granicach.
- `BattleRuntime`: cykl tury, tworzenie i usuwanie pocisków, rozstrzyganie zdarzeń tylko raz, identyfikatory starcia i akcji. Odrzucenie spóźnionych kolizji po zakończeniu starcia/restartcie.
- `PhysicsAdapter`: Rapier, jedna jednostka świata, proste collidery postaci, stały krok 1/60 s, zgodna predykcja rzutu, ograniczony catch-up. Kontroler kinematyczny uwzględnia przeszkody. [Rapier React: timestep i hooki](https://pmndrs.github.io/react-three-rapier/), [Rapier: character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/).
- `Input`: wspólne polecenia dla klawiatury, myszy i dotyku, bez interpretowania tego samego gestu przez dwa systemy.
- `Presentation`: modele, animacje, kamera, VFX i audio czytają rezultat symulacji. Nie przyznają obrażeń na podstawie animacji lub czasu przeglądarki.
- `UI`: jeden React HUD i nakładki zamiast ręcznego synchronizowania rozbudowanej struktury DOM w każdej klatce. Menu, tutorial, akcje i stany ładowania powinny używać nazw zrozumiałych dla gracza.
- `Assets`: mały katalog produkcyjny, preload tylko niezbędnego zestawu, jawny postęp/błąd/retry. Stan „gotowy do gry” dopiero po załadowaniu niezbędnej fizyki i aktorów.

Stany walki: ładowanie → wejście → ruch/celowanie gracza → lot/eksplozja → zapowiedź wroga → jego ruch/atak → rozstrzygnięcie → kolejna tura albo wynik. Na czas lotu akcja jest zużyta. Pauza i zmiana karty zatrzymują zegar gry; wznowienie nie nadrabia całej przerwy jednym krokiem. Widoczny czas tury oraz sygnał ataku wroga zastępują zaskakujący ubytek HP.

## Grafika i przygotowanie assetów

Kierunek roboczy: stylizowana, przestrzenna diorama fantasy z wyrazistymi kurczakami, ograniczoną paletą i czytelnymi sylwetkami. Wysoka jakość ma wynikać z kompozycji, animacji, materiałów i światła, a nie liczby modeli.

Pierwszy pakiet: bohater z idle/run/aim/throw/hit/death, przeciwnik z zapowiedzią ataku i reakcją na trafienie, modularna arena, jajobomba, jeden zestaw efektów i krótkie dźwięki. Każdy model powinien mieć świadomie ustawione osie, skalę, pivot, materiały i uproszczony collider. Jeśli pojawią się szkielety, loader/klonowanie muszą obsługiwać skinned meshes oraz niezależne odtwarzanie klipów, czego dzisiejsze `scene.clone(true)` samo nie rozstrzyga.

Pipeline: źródło → przegląd jakości/licencji → eksport GLB → inspect/validate → usuwanie nieużywanych danych i duplikatów → redukcja geometrii według sylwetki → Meshopt lub Draco po porównaniu → KTX2 dla odpowiednich tekstur → weryfikacja wyglądu i czasu ładowania w grze. Nie stosować kompresji bez dostarczenia odpowiednich dekoderów. [glTF Transform CLI](https://gltf-transform.dev/cli), [Three.js: GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html).

WebGL2 jako baza pierwszego wydania. WebGPU ocenić później na tej samej ukończonej scenie; dokumentacja Three opisuje różnice shaderów i postprocessingu oraz nadal określa nowy renderer jako eksperymentalny. Migracja teraz zwiększyłaby liczbę zmiennych podczas naprawy. [Three.js: WebGPURenderer](https://threejs.org/manual/en/webgpurenderer.html).

## Cloudflare: konkretne rozwiązanie

1. **Pages na etap naprawy.** Obecne `output: static`, `npm run build` i `dist` pozostają naturalnym deploymentem. Nie dodawać SSR wyłącznie dla gry uruchamianej na GPU użytkownika. Projekt, produkcyjny branch i powiązanie domeny trzeba sprawdzić przed pierwszą publikacją.
2. **Limity plików.** Pages: 25 MiB na asset, 20 tys. plików na Free. Obecne GLB nie przekraczają pojedynczego limitu; paczka nadal wymaga odchudzenia z powodów użytkowych. Workers Static Assets ma także 25 MiB na plik, więc migracja nie jest obejściem ciężkich modeli. [Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
3. **R2 opcjonalnie.** Użyć przy większym katalogu lub niezależnym wersjonowaniu assetów. Dla produkcji własna domena zasobów, poprawne CORS dla gry i preview oraz sprawdzone reguły cache. `r2.dev` jest adresem developerskim z ograniczeniami. R2 zmienia sposób dostarczania plików; nie obniża sam ich kosztu GPU. [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/), [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/).
4. **Cache i wersje.** Hashowane URL dla modeli, tekstur i bundle; długi cache tylko dla niezmiennych nazw. HTML i manifest muszą pozwalać odkryć nowe wydanie. Reguły statyczne w `public/_headers`; sprawdzać rzeczywiste odpowiedzi preview. [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/).
5. **WASM.** Jeśli ładowany osobno, zwracać `application/wasm` i prawdziwy plik, nie stronę fallback 200. Sam WASM nie uzasadnia COOP/COEP; izolacja jest potrzebna m.in. dla SharedArrayBuffer/wątków, jeśli wybrana wersja rzeczywiście ich użyje. [MDN: instantiateStreaming](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiateStreaming_static), [MDN: crossOriginIsolated](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated).
6. **Preview przed produkcją.** Osobny deployment brancha i test pełnego runu po HTTPS, na faktycznych plikach i nagłówkach. Nie zakładać, że nazwa lokalnego brancha sama skonfigurowała projekt Cloudflare. [Pages preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/).
7. **Backend dopiero dla funkcji, które go wymagają.** Lokalny single-player i checkpoint nie potrzebują API. Cloud save/ranking mogą później użyć Worker + D1; wynik z klienta nie jest zaufanym rekordem rankingu. Multiplayer i Durable Objects to oddzielny projekt. [Cloudflare storage options](https://developers.cloudflare.com/workers/platform/storage-options/).

Obecny `tools/deploy-pages.mjs` wymaga zmiennej procesu `CF_PAGES_PROJECT`. Nie ma własnego wczytywania `.env`, konfiguracji CI ani zadeklarowanych w repo zasad preview. Nie sprawdzano, jakie zmienne dostarcza konto/środowisko, więc nie jest to dowód niedziałającego deploymentu.

## Kolejność realizacji i kryteria odbioru

| Etap | Zakres | Warunek ukończenia |
| --- | --- | --- |
| 0. Diagnoza | Ten audyt, błędy odtworzone eksperymentami, stan testów | Dowody zapisane, ograniczenia jawne |
| 1. Fundament walki | Jedna fizyka, zgodny rzut, uczciwe trafienia, input, kamera, pauza | Ruch, skok, trafienie i pudło działają jednakowo przy różnych rozmiarach canvasu i częstotliwościach klatek |
| 2. Jedna docelowa arena | Bohater z animacjami, widoczny atak wroga, HUD, feedback, dźwięk, nagroda/restart | Gracz bez znajomości kodu rozumie sterowanie, wygrywa lub przegrywa i potrafi wyjaśnić dlaczego |
| 3. Pełna wyprawa | Mapa, kilka starć, zdolności/artefakty, sklep/skarb, boss, zapis między starciami | Pełen run można ukończyć wejściami użytkownika; wszystkie oferowane nagrody mają testowalny efekt |
| 4. Jakość 3D i mobile | Optymalizacja assetów, warianty aren, profile jakości, mobile HUD, końcowe animacje | Mierzone budżety wydajności i spójność wizualna na uzgodnionych urządzeniach |
| 5. Wydanie Cloudflare | CI, preview, MIME/cache, pełne E2E, sprawdzenie produkcyjnej konfiguracji | Testy i playtest preview przechodzą; znany sposób powrotu do poprzedniego wydania |

Nie odkładać całej grafiki na koniec: etap 2 musi pokazać docelową jakość jednego starcia. Etap 4 skaluje zaakceptowany standard na resztę zawartości.

## Proponowane mierzalne cele

To budżety projektowe do kalibracji po pierwszej arenie, nie limity lub gwarancje platformy:

- Pierwszy grywalny zestaw do 10 MiB transferu, pozostała zawartość ładowana etapami. Osobno mierzyć decode i kompilację shaderów.
- Gotowość do sterowania do 5 s na ustalonym profilu łącza i urządzenia; baseline proponowany: łącze 20 Mb/s, RTT 50 ms, pusty cache. Zachować osobny profil słabszego telefonu i raportować niespełniony cel.
- Cel 60 FPS desktop i 30 FPS na telefonie referencyjnym; raportować medianę i p95 czasu klatki, nie tylko średnią FPS. Kryterium dokładne po wskazaniu urządzeń referencyjnych.
- Zero nieobsłużonych wyjątków, niedostarczonych assetów oraz blokad rozgrywki w pełnym scenariuszu.
- Każdy prawidłowy strzał zużywa jedną akcję i rozstrzyga się raz. Teren i obrażenia odpowiadają temu, co gracz widzi.
- Restart 10 razy bez narastania liczby obiektów fizyki, listenerów i niezwalnianych zasobów; początkowy wzrost cache odróżnić od wycieku.
- Pauza/wznowienie, resize i powrót z tła nie zmieniają wyniku starcia ani nie pozostawiają wciśniętego ruchu.
- Test realnego dotyku na Androidzie i iOS. Emulacja mobilna nie stanowi odbioru urządzenia.

## Strategia weryfikacji

Reguły runu testować deterministycznie w Node. Fizyce dać testy porównujące przewidywany i rzeczywisty tor, kolizję przy różnych krokach renderowania, timeout pocisku, rozstrzygnięcie dokładnie raz i restart w trakcie lotu. Osobno sprawdzić każdą zdolność, artefakt i kupno w sklepie.

E2E: menu → arena → zwycięstwo → nagroda → następna arena → boss → koniec → restart, a także ścieżka porażki, sklep bez pieniędzy, uszkodzony zapis i przerwane ładowanie assetu. Gracz testowy wydaje polecenia; nie ustawia przeciwnikowi HP=0. Testy screenshotów wykonywać na zatrzymanej, powtarzalnej scenie i w stałym środowisku.

Playwright wspiera Chromium, Firefox i WebKit, ale jego WebKit nie jest Safari. Rendering screenshotów zależy od systemu i sprzętu; testy wizualne oraz pomiary GPU należy interpretować oddzielnie. [Playwright: Browsers](https://playwright.dev/docs/browsers), [Playwright: Visual comparisons](https://playwright.dev/docs/test-snapshots).

## Decyzja potrzebna przed specyfikacją

Czy zachowujemy rdzeń **Worms + roguelite: aktywne tury, celowanie jajobombą, krótkie wyprawy**, z pełnymi modelami 3D i kontrolowaną kamerą, czy zmieniamy grę na swobodną akcję w czasie rzeczywistym? Rekomendowany pierwszy wariant jest spójny z istniejącą domeną i pozwala skoncentrować wysiłek na grywalności oraz jakości wykonania.

Po uzgodnieniu rdzenia: zapisać zatwierdzoną specyfikację, następnie rozbić wybrany pierwszy etap na konkretne zadania implementacyjne. Bieżący dokument pozostaje dowodem stanu wyjściowego.

## Pewność i zakończenie researchu

Wysoka pewność: błąd impulsu, nieuczciwy warunek trafienia, dwie ścieżki fizyki, brak rendererów pocisków wroga, brak animacji GLB, masa plików, status testów oraz oficjalne wymagania hostingu.

Wnioski wymagające pomiaru lub odbioru: skala kosztu React/DOM, dokładne zachowanie kamery i dotyku na telefonie, odbiór artystyczny modeli, realny FPS/czas ładowania, ustawienia konta Cloudflare, wymagany zakres produktu.

Zakończono wyszukiwanie po pokryciu rodzin decyzji: stack, fizyka, wydajność, assety, hosting, alternatywy i QA. Dalsze ogólne porównania silników nie rozstrzygną już najważniejszej niewiadomej: docelowego rodzaju rozgrywki. Następny użyteczny krok to decyzja produktowa i specyfikacja pierwszej kompletnej areny.
