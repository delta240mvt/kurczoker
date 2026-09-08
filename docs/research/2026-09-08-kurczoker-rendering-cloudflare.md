# Kurczoker: rendering 3D, mobilność i hosting statyczny

Data weryfikacji: 2026-09-08. Zakres: dokumentacja producentów oraz lokalne `package.json`, `astro.config.mjs` i fragment wywołania deploymentu w `tools/deploy-pages.mjs`. Nie wykonywano pomiarów na telefonach, kompilacji ani publikacji. Fakty poniżej opisują możliwości narzędzi; rekomendacje są oceną architektury dla lokalnego singleplayera.

## Stan repozytorium

`package.json` deklaruje Astro `^6.2.2`, React `^19.2.5`, Three `^0.184.0`, R3F `^9.6.1`, Drei `^10.7.7`, react-three/rapier `^2.2.0` i Rapier compat `^0.20.0`. Są to zakresy deklaracji, nie potwierdzenie wersji faktycznie zainstalowanych. Konfiguracja Astro ma `output: "static"` i integrację React. Skrypt publikacji wywołuje Wrangler `pages deploy dist`; komenda `build` wykonuje także przygotowanie release'u. To istniejąca ścieżka do Pages, a nie dowód aktualnego stanu produkcji.

## Potwierdzone fakty

| Obszar | Ustalenie i źródło pierwotne |
| --- | --- |
| Pages | Dokumentacja Cloudflare dla Astro podaje `npm run build` oraz katalog `dist`. Pojedynczy asset Pages może mieć maksymalnie **25 MiB**; dokumentacja wskazuje R2 dla większych plików. To limit jednego pliku, nie całego pobrania gry. [Astro na Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/), [limity Pages](https://developers.cloudflare.com/pages/platform/limits/) |
| Kierunek platformy | Aktualny przewodnik Astro informuje, że Cloudflare rekomenduje Workers dla **nowych** projektów. Nie wynika z tego konieczność migracji istniejącej gry na Pages. [Astro: Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) |
| Gra w przeglądarce | Astro `client:only="react"` pomija renderowanie komponentu na serwerze i uruchamia go po stronie klienta; pozwala także zdefiniować fallback podczas ładowania. Rapier JavaScript dostarcza silnik WASM i lokalny krok symulacji `world.step()`. Pakiet `-compat` osadza WASM jako base64 w JS i wymaga inicjalizacji. [Dyrektywy Astro](https://docs.astro.build/en/reference/directives-reference/#clientonly), [Rapier: start](https://rapier.rs/docs/user_guides/javascript/getting_started_js/) |
| Modele i kompresja | `GLTFLoader` obsługuje glTF 2.0, `EXT_meshopt_compression` i `KHR_texture_basisu`. Dla meshopt trzeba ustawić `setMeshoptDecoder()`, a dla tekstur KTX2 podłączyć `setKTX2Loader()`. Sama obecność skompresowanego pliku nie konfiguruje loadera. [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) |
| KTX2 | Loader transkoduje tekstury Basis Universal do formatu wspieranego przez GPU. Przed ładowaniem należy wykonać `detectSupport(renderer)` i zapewnić pliki transkodera JS/WASM pod skonfigurowaną ścieżką. Nie każdy format, który może mieścić kontener KTX2, jest obsługiwany. [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html) |
| Pikselizacja | Three udostępnia `RenderPixelatedPass` z regulacją wielkości piksela i siły krawędzi. Typowy postprocessing używa dodatkowych render targetów oraz kolejnych passów; końcowy `OutputPass` wykonuje konwersję przestrzeni barw i opcjonalne tone mapping. [RenderPixelatedPass](https://threejs.org/docs/pages/RenderPixelatedPass.html), [postprocessing](https://threejs.org/manual/en/post-processing.html) |
| Rozdzielczość mobilna | Rozmiar CSS canvas i rozdzielczość drawing buffer to oddzielne wartości. Zwiększenie obu wymiarów bufora przez DPR zwiększa liczbę pikseli kwadratowo; dokumentacja opisuje ograniczanie maksymalnego rozmiaru bufora. [Three: responsive design](https://threejs.org/manual/en/responsive.html) |
| Ruch 2.5D | Rapier pozwala blokować translacje i rotacje brył względem osi kartezjańskich; dokumentacja wymienia zapobieganie przewracaniu postaci jako zastosowanie. To narzędzie do ograniczenia swobody ruchu, nie gotowy projekt sterowania grą. [Rapier: rigid bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/#locking-translationsrotations) |

## Rekomendacje dla tego projektu

1. Zachować Astro static i istniejące Pages. React/R3F może prowadzić scenę, a Rapier symulację w przeglądarce. **Wniosek projektowy:** lokalny singleplayer nie wymaga serwera symulacji. Hosting statyczny nie zapewnia sam z siebie synchronizacji zapisów, kont ani wspólnego rankingu; te funkcje stanowiłyby osobny zakres produktu.
2. Oddzielić wygląd od reguł: modele 3D, światło i głębia sceny mogą pozostać przestrzenne, podczas gdy kontroler postaci i kolizje respektują ustaloną płaszczyznę ruchu. Kierunek kamery, osie i przechodzenie między platformami należy zatwierdzić w prototypie sterowania.
3. Użyć glTF/GLB jako formatu runtime. Meshopt i KTX2 wdrażać razem z konfiguracją dekoderów, obsługą błędu i sprawdzeniem ścieżek JS/WASM w gotowym buildzie. Porównać rozmiar pobrania oraz koszt inicjalizacji na tych samych assetach; kompresja nie jest dowodem szybszego startu na każdym urządzeniu.
4. Styl retro oprzeć na spójnych modelach, palecie, czytelnych sylwetkach i kontrolowanej rozdzielczości obrazu. Porównać prosty render w niższej rozdzielczości z `RenderPixelatedPass`; efekty krawędzi, bloom i inne passy dodawać po ocenie obrazu i pomiarze. Interfejs dotykowy i tekst trzymać w czytelnej warstwie HTML ponad sceną.
5. Ustalić budżet rozdzielczości wewnętrznej, liczby widocznych obiektów, tekstur i efektów. Następnie zmierzyć czas uruchomienia, czas klatki, przycięcia oraz zachowanie po rozgrzaniu na rzeczywistym Androidzie i iPhonie. **Brak podstaw do deklaracji 30/60 FPS:** ten research nie zawiera takich testów.

## Ograniczenia wniosków

Dokumentacja internetowa jest aktualizowana niezależnie od wersji pakietów repozytorium. Przewodnik Rapier oznacza sekcję JavaScript jako 0.17, podczas gdy lokalna deklaracja compat to `^0.20.0`; konkretne sygnatury trzeba sprawdzić w zainstalowanych typach przy implementacji. Nie zweryfikowano tu istniejącej konfiguracji loaderów, wielkości assetów ani zgodności całego runtime na urządzeniach. Rekomendacje dotyczą zachowania obecnego stosu i kryteriów prototypu, a nie potwierdzenia jego jakości wykonania.
