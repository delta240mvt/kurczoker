# KURCZOKER — kompletny opis gry do głębokiego researchu

Stan na 8 września 2026 r. • Gałąź: `baza080926-makeover` • Kod bazowy: `538b49b6c51c0cb3d6c7bc4019e7e564473df665`

## 1. Cel dokumentu i sposób czytania

Ten dokument opisuje aktualną, działającą wersję KURCZOKERA: zasady, dynamikę walki, wszystkie ścieżki wyprawy, zdolności, przedmioty, ekonomię, ekrany, grafikę, dźwięk, sterowanie, zapis, architekturę i sposób wydania na Cloudflare. Ma być samodzielnym załącznikiem dla osoby lub systemu prowadzącego głęboki research nad urozmaiceniem gry. Do zrozumienia produktu nie trzeba otwierać pozostałych dokumentów repozytorium.

Podstawą opisu jest odczyt aktualnego kodu, manifestu zasobów i istniejącego raportu z testów. To inwentaryzacja produktu, a nie nowy research rynkowy. Pytania i kierunki rozwoju na końcu są tematami do zbadania, a nie zatwierdzonymi funkcjami ani gotowymi rekomendacjami.

Rozróżnienia stosowane w dokumencie:

- **Stan aktualny:** zachowanie wynikające z aktywnego kodu gry.
- **Wniosek projektowy:** konsekwencja obecnych reguł; wymaga obserwacji graczy, jeśli dotyczy zabawy, trudności lub motywacji.
- **Do researchu:** możliwy kierunek, którego jeszcze nie wdrożono.
- **Starszy kod / materiały promocyjne:** zawartość repozytorium, która nie potwierdza istnienia funkcji w obecnej rozgrywce.

Adres gry na gałęzi: [Cloudflare preview](https://baza080926-makeover.kurczoker-makeover.pages.dev/gra). Niezmienny deployment odpowiadający powyższemu commitowi: [wydanie c42d25f6](https://c42d25f6.kurczoker-makeover.pages.dev/gra). Repozytorium: [delta240mvt/kurczoker](https://github.com/delta240mvt/kurczoker/tree/baza080926-makeover).

## 2. Tożsamość i zamysł gry

KURCZOKER jest jednoosobową grą przeglądarkową o małym kurczaku wojowniku, który przemierza krainę kurnika i próbuje pokonać Jajokróla. Oprawa łączy żartobliwy świat drobiu z motywami rycerskiej wyprawy: hełmy, tarcze, zamki, grzędy, ziarna, magiczne jaja i korony.

Przyjęty kierunek produktu to **taktyczny roguelite z aktywnymi turami i jajobombami w duchu Worms, pełnymi modelami 3D oraz kontrolowaną kamerą**. Inspiracja mapą wyprawy nie oznacza implementacji systemów Heroes: nie ma armii, rekrutacji oddziałów, miast ani ekonomii strategicznej na mapie.

Obecna wersja jest krótką wyprawą z kilkoma pojedynkami, wyborem nagród, jednym sklepem lub skarbem, opcjonalną elitą i jednym bossem. Rozwój bohatera odbywa się wewnątrz wyprawy. Nie ma trwałych odblokowań między wyprawami, kont, klas postaci ani systemu metaprogresji. Określenie „roguelite” opisuje kierunek i strukturę prób; aktualny zakres progresji jest ograniczony.

### 2.1. Główna obietnica dla gracza

1. Wejdź na stronę i zacznij bez konta.
2. Wybierz dostępne miejsce na mapie.
3. W walce ustaw pozycję, kąt i moc jajobomby.
4. Wykonaj jedną akcję, obserwuj fizyczny pocisk i odpowiedź wroga.
5. Po zwycięstwie wybierz wzmocnienie i zdecyduj o dalszej trasie.
6. Pokonaj Jajokróla albo rozpocznij kolejną próbę po porażce.

### 2.2. Aktualne granice produktu

| Obszar | Stan aktualny |
|---|---|
| Tryb | Single player przeciwko prostemu AI |
| Środowisko | Przeglądarka z WebGL2, komputer lub responsywny widok telefonu |
| Walka | Jeden bohater kontra jeden przeciwnik |
| Przestrzeń walki | Ruch i pociski w płaszczyźnie X/Y, scena renderowana w 3D |
| Sterowanie kamerą | Automatyczny, stały kadr dopasowany do rozmiaru sceny |
| Kampania | Jeden rozdział, skończony graf lokacji |
| Rozwój | Zdolności i artefakty do końca bieżącej wyprawy |
| Zapis | Lokalny checkpoint między starciami |
| Sieć | Pobieranie strony, kodu i modeli; brak serwera symulującego walkę |
| Monetyzacja | Brak zakupów za prawdziwe pieniądze w aktywnej grze |
| Język interfejsu | Polski |

## 3. Pełna pętla rozgrywki i stany

```text
STRONA GŁÓWNA / → GRA /gra → MENU
                              ├─ Nowa wyprawa → MAPA
                              └─ Kontynuuj → zapisany MAPA / ŁUP / SKLEP

MAPA → WALKA → zwycięstwo → ŁUP → MAPA
          └─ porażka → KONIEC WYPRAWY → Nowa wyprawa

MAPA → SKARB → ŁUP → MAPA
MAPA → SKLEP → jeden zakup albo pominięcie → MAPA
MAPA → BOSS → zwycięstwo → FINAŁ → Nowa wyprawa
```

Menu startowe jest stanem interfejsu nad stanem kampanii. W samej domenie kampanii występują sceny `map`, `battle`, `reward`, `shop`, `game-over`, `run-complete`. Pauza, pomoc, przygotowanie areny i komunikaty błędów są dodatkowymi warstwami interfejsu.

### 3.1. Stan początkowy bohatera

- Zdrowie: **3/3 HP**.
- Waluta: **0 ziaren**.
- Zdolności: tylko **Jajobomba**.
- Artefakty: brak.
- Aktualny węzeł: `start`.
- Ukończone miejsca: pusta lista; punkt startowy nie zwiększa licznika odwiedzonych miejsc.
- Dostępny pierwszy cel: `battle-1`.
- Dźwięk jest początkowo wyciszony.

Store powstaje z seedem `1`. Przycisk „Nowa wyprawa” wywołuje reset zwiększający seed o 1, więc pierwsza nowa wyprawa po świeżym uruchomieniu aplikacji ma seed `2`. Kolejne restarty w tej instancji podnoszą seed. Nie istnieje ekran wpisywania własnego seeda ani udostępniania wyzwania.

### 3.2. Co pozostaje między starciami

Pozostają HP, maksymalne HP, ziarna, odblokowane zdolności, artefakty, ich bonusy, bieżąca pozycja na mapie i historia ukończonych miejsc. Wybrana zdolność jest elementem stanu interfejsu i może pozostać wybrana w kolejnej walce.

Nowa walka tworzy nową symulację: przywraca startowe pozycje, turę 1, 20 sekund, kąt 40°, moc 9, kierunek w prawo, zerowe czasowe wzmocnienie następnej bomby i niewykorzystaną osłonę Pancernej skorupy. Nie przechodzą pozycje postaci, pociski, zegar ani częściowo rozegrana tura.

## 4. Mapa, wszystkie lokacje i wszystkie ścieżki

Mapa jest skierowanym grafem z ośmioma węzłami, łącznie ze startem. Topologia jest z góry ustalona. Seed zmienia kolejność części danych i dobór ofert, ale nie generuje nowej struktury kampanii.

```text
Kurnik startowy [start]
          │
     Potyczka 1 [battle-1]
          │
          ├───────────────┐
          ▼               ▼
  Ukryty skarb        Stragan nioski
  [treasure-1]        [shop-1]
          └───────┬───────┘
                  ▼
             Potyczka 2 [battle-2]
                  │
                  ├─────────────────┐
                  ▼                 │
          Elitarny kogut [elite-1]   │ pominięcie elity
                  └────────┬────────┘
                           ▼
                      Potyczka 3 [battle-3]
                           │
                           ▼
                      Jajokról [boss]
```

| ID lokacji | Rola | Następne cele | Co się wydarza |
|---|---|---|---|
| `start` | Punkt rozpoczęcia | `battle-1` | Pierwszy wybór na mapie |
| `battle-1` | Zwykła walka | `treasure-1`, `shop-1` | Kogut 2 HP; po wygranej ziarna i wybór łupu |
| `treasure-1` | Skarb | `battle-2` | Bez walki, wybór jednej nagrody |
| `shop-1` | Sklep | `battle-2` | Jeden zakup lub wyjście |
| `battle-2` | Zwykła walka | `elite-1`, `battle-3` | Kogut 2 HP; po wygranej ziarna i łup |
| `elite-1` | Opcjonalna trudniejsza walka | `battle-3` | Przeciwnik 4 HP; większy zarobek i rosół o wartości 2 HP |
| `battle-3` | Zwykła walka z podwyższeniem terenu | `boss` | Kogut 2 HP; po wygranej ziarna i łup |
| `boss` | Finał | Brak | Jajokról 8 HP; zwycięstwo kończy wyprawę |

### 4.1. Cztery możliwe warianty pełnej trasy

1. Potyczka 1 → skarb → potyczka 2 → potyczka 3 → boss.
2. Potyczka 1 → sklep → potyczka 2 → potyczka 3 → boss.
3. Potyczka 1 → skarb → potyczka 2 → elita → potyczka 3 → boss.
4. Potyczka 1 → sklep → potyczka 2 → elita → potyczka 3 → boss.

Wariant bez elity ma **4 walki i 5 odwiedzonych miejsc**. Wariant z elitą ma **5 walk i 6 odwiedzonych miejsc**. Nie można odwiedzić zarówno sklepu, jak i skarbu, wrócić do wcześniejszego miejsca, farmić ukończonej walki ani pominąć trzeciej potyczki. Elita jest dodatkowym starciem, a nie zamiennikiem trzeciej potyczki.

### 4.2. Jak mapa wygląda i jak się jej używa

Mapa to trójwymiarowa diorama z węzłami rozmieszczonymi od lewej do prawej. Złote linie pokazują połączenia. Każdy węzeł ma niską, ośmiokątną podstawę i mały geometryczny znacznik. Boss ma większy, czerwony znacznik.

- Dostępne węzły: złote, lekko emisyjne, z jasnym pierścieniem.
- Ukończone: zielone.
- Pozostałe: szarozielone i nieaktywne.
- Bohater stoi przy aktualnej lokacji; przejście wynika ze zmiany stanu, bez osobnej mechaniki swobodnego chodzenia po mapie.
- Węzeł można kliknąć w scenie albo wybrać odpowiadający mu przycisk pod sceną.
- Przyciski pokazują typ lokacji i akcję: „Ruszaj do walki”, „Odwiedź stragan”, „Otwórz skrzynię”, „Podejmij wyzwanie”, „Zmierz się z Jajokrólem”.

Obecna mapa nie ma mgły wojny, odkrywania sekretów, kosztów podróży, wydarzeń dialogowych, pogody, zadań pobocznych ani dodatkowych biomów. Zamek w tle jest dekoracją.

## 5. Walka: pełna dynamika tury

Walka odbywa się w czasie rzeczywistym wewnątrz kolejnych faz. Gracz ma ograniczone okno na ustawienie się i jedną akcję. Nie jest to system jednoczesnych tur ani klasyczna, całkowicie zatrzymana taktyka.

| Faza | Czas / warunek | Działanie |
|---|---|---|
| `player` | Do 20 sekund | Ruch, skoki, celowanie, wybór zdolności i jedna akcja |
| `player-shot` | Do zakończenia lotu jajobomby | Postać nie może już wykonać następnej akcji; symulacja pocisku trwa |
| `enemy-tell` | 1,3 sekundy | Baner ostrzegawczy i animacja przygotowania przeciwnika |
| `enemy-shot` | Do zakończenia lotu pocisku wroga | Fizyczny atak przeciwnika |
| `settle` | 0,65 sekundy | Krótkie uspokojenie po ataku przeciwnika |
| kolejny `player` | Nowe 20 sekund | Numer tury rośnie o 1 |
| `finished` | Ktoś ma 0 HP | Symulacja kończy starcie; po około 850 ms wynik przechodzi do kampanii |

### 5.1. Ruch i akcja

W swojej turze gracz może chodzić w lewo i prawo, skakać po lądowaniu, zmieniać kąt, moc i kierunek oraz przełączać odblokowane zdolności. Ruch i zwykły skok nie zużywają odrębnych punktów akcji. Ogranicza je zegar oraz fizyka.

Użycie zdolności kończy możliwość sterowania w tej turze. Jajobomba uruchamia lot pocisku. Pozostałe trzy zdolności przechodzą bezpośrednio do przygotowania ataku wroga. Jeśli gracz niczego nie użyje przez 20 sekund, traci akcję i przeciwnik rozpoczyna odpowiedź. Nie ma osobnego przycisku „Zakończ turę”.

W turze przeciwnika gracz nie może chodzić, skakać ani odpalać zdolności. Zapowiedź służy czytelności ataku; nie jest oknem na reakcyjny unik sterowany przez gracza. Wcześniej nadany pionowy impuls nadal podlega fizyce.

### 5.2. Parametry ruchu

| Parametr | Wartość w aktywnej symulacji |
|---|---:|
| Stały krok fizyki | 1/60 s |
| Grawitacja | −10 jednostek/s² |
| Pozycja początkowa bohatera | X = −4,5; Y ≈ 0,57; Z = 0 |
| Pozycja początkowa wroga | X = 3,5; Y ≈ 0,57; Z = 0 |
| Bazowa prędkość ruchu bohatera | 3 jednostki/s |
| Zwykły skok | Prędkość pionowa 5,5 |
| Skrzydlaty skok | Prędkość pionowa 8 |
| Dopuszczalne X środka postaci | −6,5 do 6,5 |
| Automatyczne pokonywanie stopnia | Do 0,55 wysokości, przy warunkach kontrolera |
| Przyciąganie do podłoża | 0,12 |

Postacie mają kinematyczne bryły, a pociski dynamiczne. Przeciwnik stoi na swojej pozycji; nie ma AI przemieszczania. Postacie mogą blokować się wzajemnie przez kolidery. Nie ma sprintu, kucania, dashu, chwytania krawędzi, odrzutu po trafieniu ani upadku w przepaść jako osobnej reguły porażki.

## 6. Celowanie, lot, kolizje i obrażenia

### 6.1. Kąt i moc

- Kąt: **10–80°**, suwak co 1°.
- Moc w fizyce: **6–14**, suwak co 0,1.
- HUD przedstawia moc jako zakres **0–100%**, liczony `(moc − 6) / 8 × 100`.
- 0% na suwaku oznacza minimalną prędkość 6, a nie nieruchomy pocisk.
- Domyślny rzut: kąt **40°**, moc **9**, czyli około **38%** w HUD.
- Kierunek: lewo lub prawo, niezależny od samego chodzenia. Można zmienić go przyciskiem albo wskazaniem celu po odpowiedniej stronie bohatera.
- Mysz lub dotyk sceny ustawia kąt i stronę; moc pozostaje regulowana suwakiem.

Wektor prędkości początkowej ma postać `vx = cos(kąt) × moc × kierunek`, `vy = sin(kąt) × moc`, `vz = 0`. Pocisk startuje około 0,52 jednostki przed postacią i 0,36 powyżej jej środka. Nie ma wiatru ani losowego rozrzutu.

### 6.2. Podgląd trajektorii

Jasna linia pokazuje przewidywany lot. Liczona jest w osobnym, małym świecie Rapiera, z tym samym krokiem, grawitacją, terenem, promieniem pocisku i koliderem wroga. Nie jest wyłącznie dekoracyjną parabolą. Wynik jest buforowany według pozycji wystrzału, kąta, mocy i kierunku.

Podgląd obejmuje maksymalnie 180 kroków, czyli około 3 sekund. Może zakończyć się wcześniej po kolizji, zejściu poniżej Y = −1 lub przekroczeniu |X| = 8. Rzeczywisty pocisk ma szersze progi usuwania i maksymalnie 5 sekund życia. Oznacza to, że podgląd i rzut korzystają z tej samej fizyki, ale nie z identycznego horyzontu symulacji dla każdego możliwego strzału. Linia znika poza fazą gracza i podczas pauzy.

### 6.3. Pocisk i moment eksplozji

Jajobomba ma kulisty kolider o promieniu **0,14**, ciągłe wykrywanie kolizji CCD i zerową sprężystość. Nie odbija się i nie czeka na zapalnik. Pocisk gracza może zderzyć się z terenem lub wrogiem, a pocisk wroga z terenem lub bohaterem. Własna postać nie zatrzymuje swojego pocisku.

Rozliczenie eksplozji następuje po kolizji albo awaryjnym zakończeniu lotu: Y < −2, |X| > 9 lub wiek > 5 s. Następnie pocisk jest usuwany. W danej chwili istnieje jeden aktywny pocisk.

### 6.4. Reguła obrażeń

Kod liczy odległość w płaszczyźnie X/Y między eksplozją a środkiem celu. Jeśli jest nie większa niż **1,05 + 0,35 = 1,40 jednostki**, cel może otrzymać obrażenia.

| Atak | Obrażenia przed osłoną |
|---|---:|
| Jajobomba bez bonusów | 2 HP |
| Jajobomba z Jajem chaosu | 3 HP |
| Jajobomba po Magicznym ziarnie | 3 HP |
| Jajobomba z Jajem chaosu i wzmocnieniem ziarna | 4 HP |
| Pocisk zwykłego wroga | 1 HP |
| Pocisk elity | 1 HP |
| Pocisk bossa | 1 HP |

Nie ma spadku obrażeń z odległością wewnątrz promienia, krytyków, obrażeń częściowych, trafień w głowę, samouszkodzenia ani obrażeń sojuszniczych. Eksplozja rozpatruje jednego przeciwnika wskazanego przez stronę strzelającą. Nie niszczy terenu i nie odrzuca postaci.

Teren zatrzymuje pocisk, ale samo sprawdzenie obrażeń od wybuchu nie wykonuje dodatkowego testu widoczności przez przeszkodę. Cel blisko eksplozji po drugiej stronie podwyższenia może więc dostać obrażenia. To ważne rozróżnienie dla przyszłego projektu osłon.

### 6.5. Kolejność ochrony

Jeśli pocisk wroga znalazł się w zasięgu zadania obrażeń:

1. Najpierw zużywana jest aktywna osłona strażnika/skoku, jeśli istnieje.
2. W przeciwnym razie Pancerna skorupa blokuje trafienie, jeśli nie została jeszcze wykorzystana w tej walce.
3. Dopiero bez tych osłon bohater traci 1 HP.

Pudło nie zużywa osłony. Osłona nie kumuluje się przez wielokrotne użycie strażnika: jej stan jest ustawiany na 1. Wzmocnienie z Magicznego ziarna znika po rozliczeniu następnego pocisku gracza, również gdy ten chybił.

## 7. Wszyscy przeciwnicy i areny

### 7.1. Przeciwnicy

| Przeciwnik w HUD | Typ | HP | Zarobek za wygraną | Zachowanie |
|---|---|---:|---:|---|
| Zadziorny kogut | `battle` | 2 | 4 ziarna | Stoi, zapowiada i rzuca jednym pociskiem |
| Strażnik grzędy | `elite` | 4 | 6 ziaren | Ten sam schemat ataku, większa wytrzymałość |
| Jajokról | `boss` | 8 | 4 ziarna | Ten sam schemat ataku, osobny model i sceneria |

Wróg po 1,3 s przygotowania oblicza rzut w stronę aktualnej pozycji bohatera. Używa założonego czasu lotu **1,18 s** i grawitacji do wyliczenia prędkości. To pojedyncze wycelowanie w chwili strzału; pocisk nie naprowadza się podczas lotu. AI nie dobiera jednej z kilku broni, nie szuka bezpiecznej pozycji, nie przewiduje dalszego ruchu i nie rozwiązuje świadomie problemu przeszkód. Jego pocisk może trafić w teren.

Boss nie ma drugiej fazy, przywoływania pomocników, ataków obszarowych, słabych punktów, szału ani osobnej logiki taktycznej. Elita i zwykły kogut korzystają z tego samego modelu przeciwnika; różnicują je HUD, HP i arena.

### 7.2. Areny

| Nazwa | Gdzie | Układ |
|---|---|---|
| Słoneczne Grzędy | Potyczka 1 i 2 | Płaska platforma i ograniczniki po bokach |
| Ruiny Starego Młyna | Elita i potyczka 3 | Ta sama baza z centralnym podwyższeniem |
| Twierdza Jajokróla | Boss | Centralne podwyższenie, chłodniejsza paleta i większy, ciemniejszy zamek |

Podstawowa platforma ma szerokość 14, wysokość 0,7 i głębokość 3,4 jednostki. Jej górna powierzchnia leży na Y = 0. Centralne podwyższenie ma szerokość 1,7, wysokość 0,5 i głębokość 2,4; jego szczyt jest na Y = 0,5. Po bokach są niewielkie ograniczniki. Geometria platform jest wspólną podstawą widoku i kolizji.

To trzy warianty jednego zestawu scenograficznego, nie trzy duże, niezależne poziomy. Nazwa „Ruiny Starego Młyna” nie oznacza obecności osobnej mechaniki młyna. Brak ruchomych platform, pułapek, wody z regułami obrażeń, skrzyń fizycznych, niszczalnych ścian i generowania terenu.

## 8. Wszystkie zdolności

Zdolności odblokowuje się jako nagrody lub kupuje w sklepie. Nie są kartami zużywanymi po użyciu. Pozostają do końca wyprawy i można przełączać je w swojej turze. Każda aktywacja kosztuje jedyną akcję tej tury.

| Zdolność / ID | Dostępność | Faktyczny efekt | Ważna granica |
|---|---|---|---|
| **Jajobomba** `egg-bomb` | Od początku | Fizyczny rzut, bazowo 2 HP w zasięgu eksplozji | Jedyna obecnie ofensywna broń pociskowa gracza |
| **Skrzydlaty skok** `crest-jump` | Do zdobycia | Nadaje pionową prędkość 8 i zapewnia osłonę na jedno przyszłe trafienie | Kończy akcję; nie daje dodatkowego rzutu w tej turze |
| **Pisklak strażnik** `guard-chick` | Do zdobycia | Ustawia osłonę blokującą jedno przyszłe trafienie | Nie tworzy chodzącej jednostki ani osobnego modelu pisklaka |
| **Magiczne ziarno** `mana-grain` | Do zdobycia | Leczy 1 HP do maksimum; następna bomba ma +1 obrażenie | Bonus nie kumuluje się ponad +1; znika też po pudle |

**W aktywnej symulacji nie ma cooldownów, punktów many, amunicji ani limitu użyć tych zdolności w walce.** Pola o takich nazwach występują w starszym katalogu zdolności, ale obecny runtime ich nie egzekwuje.

Zwykły skok z przycisku W/↑ jest innym działaniem niż Skrzydlaty skok: zwykły wymaga podłoża, nie dodaje osłony i pozwala później użyć akcji. Skrzydlaty skok może nadać impuls bez sprawdzenia podłoża, lecz zużywa turę. Nazwa „Magiczne ziarno” nie oznacza zasobu mana.

## 9. Wszystkie artefakty i zapasy

Artefakty są pasywnymi, unikalnymi zdobyczami wyprawy. Nie mają slotów ekwipunku, poziomów ulepszenia, jakości losowej ani możliwości sprzedaży. Posiadane artefakty i zdolności są usuwane z puli kolejnych standardowych ofert.

| Nazwa / ID | Faktyczny efekt | Zakres |
|---|---|---|
| **Korona grzebienia** `crest-crown` | +1 maksymalnego HP i +1 aktualnego HP | Do końca wyprawy |
| **Buty wichru** `wind-boots` | `moveSpeedBonus +0,06`; aktywna prędkość rośnie z 3 do **3,72 jednostki/s**, czyli o 24% | Kolejne walki |
| **Jajo chaosu** `chaos-egg` | +1 obrażenie każdej jajobomby | Kolejne walki |
| **Złote ziarno** `golden-grain-ring` | Jednorazowo +6 ziaren; zapisuje się na liście artefaktów | Nie generuje dochodu co turę |
| **Kura wyrocznia** `prophet-hen` | +1 do liczby propozycji nagród | Zmienia późniejsze oferty, nie liczbę wybieranych nagród |
| **Pancerna skorupa** `shell-shield` | Blokuje pierwsze nieosłonięte innym efektem trafienie w każdej walce | Reset ochrony przy nowej walce |

Pancerna skorupa zapisuje w danych również statystykę `damageReduction`, ale obecna symulacja stosuje regułę pojedynczej blokady na podstawie ID artefaktu. Nie daje stałego zmniejszenia każdego ataku o 1.

| Zapasy / ID | Efekt |
|---|---|
| **Bojowy rosół** `heal-small` | Leczy do maksymalnego HP; zwykle 1 HP, gwarantowany rosół po elicie 2 HP |
| **Sakiewka ziaren** `gold-small` | Standardowa nagroda dodaje 5 ziaren |
| **Pisklak na straży** `grain-guard` | Tymczasowa ochrona na następne starcie; przy wejściu daje jedną osłonę |

`grain-guard` jest zapasową ofertą sklepu. Sklep najpierw korzysta z puli normalnych nagród, więc obecność tej pozycji w kodzie nie oznacza, że zawsze pojawia się w sklepie. Tymczasowym przywołaniom maleje licznik TTL po ukończeniu walki. Przy kilku wpisach runtime nadal przyznaje jedną początkową osłonę, a nie osobną jednostkę za każdy wpis.

Wizualny hełm i tarcza modelu bohatera są częścią wyglądu postaci. Nie dowodzą posiadania Korony grzebienia lub Pancernej skorupy. Artefakty nie przebudowują modelu ani nie zmieniają jego ubioru.

## 10. Nagrody, losowość i ekonomia

### 10.1. Zarobek za zwycięstwo

Ziarna za walkę są przyznawane niezależnie od późniejszego wyboru karty łupu. Zwykła walka daje 4, elita 6, boss 4. Przegrana nie daje nagrody pieniężnej. Zdrowie z wyniku symulacji przechodzi do kampanii.

Suma gwarantowanych ziaren za walki wynosi **16 bez elity** albo **22 z elitą**, przed wydatkami i dodatkowymi nagrodami. Monety za bossa są przyznawane, lecz nie ma już kolejnego miejsca ich wydania.

### 10.2. Dobór kart nagród

Pula obejmuje nieposiadane zdolności i artefakty, leczenie oraz sakiewkę ziaren. Kolejność jest wyliczana deterministycznym hashem z seeda i ID nagrody. Nie istnieje system rzadkości, wag dropu, gwarancji konkretnej kategorii lub wyboru pod klasę postaci.

- Po walce: dwie propozycje z puli oraz dodatkowy rosół; zwykle 3 karty.
- Z Kurą wyrocznią: trzy propozycje z puli oraz rosół; zwykle 4 karty.
- Skarb: trzy propozycje z puli; z Wyrocznią cztery.
- Wybór jednej karty zamyka ekran i wraca na mapę. Nie można zachować decyzji na później ani wziąć wszystkich propozycji.
- Nie ma rerollu ani pomijania łupu bez wyboru.
- Skarb używa innego przesunięcia seeda, ale nie ma osobnej puli „lepszych” przedmiotów.

W generatorze nie ma końcowej deduplikacji dołączanego rosołu względem rosołu z puli. Możliwe są dwie karty `heal-small`. Wybór w store szuka pierwszej nagrody o danym ID, więc przy różnych wartościach takich kart powstaje ryzyko niespójności wyboru. To obserwacja kodu do sprawdzenia przy porządkowaniu generatora nagród, nie deklaracja odtworzenia błędu w ostatnim teście przeglądarkowym.

### 10.3. Sklep

Sklep pojawia się tylko po pierwszej walce, jako alternatywa dla skarbu. Oferuje do czterech pozycji. Z puli zakupów wykluczane są bezpośrednie nagrody typu gold i artefakt Złote ziarno. Generator uzupełnia oferty rosołem i tymczasowym strażnikiem, jeśli zostało miejsce.

Cena zależy od indeksu oferty: **4 + 2 × indeks + 2, jeśli jest artefaktem**; indeksy zaczynają się od 0. Oznacza to, że cena nie wynika bezpośrednio z siły przedmiotu. Ta sama kategoria może kosztować różnie w różnych miejscach listy.

Kliknięcie jednej oferty kupuje ją, odejmuje ziarna, stosuje efekt i od razu kończy wizytę. Nie jest to sklep wielozakupowy. „Ruszaj dalej” kończy wizytę bez zakupu. Za drogie pozycje są wyłączone, a warstwa logiki również sprawdza saldo.

### 10.4. Konkretny przykład początku wyprawy, seed 2

To przykład wynikający z generatora i początkowego stanu, nie uniwersalny zestaw dla każdego seeda.

1. Start: 3/3 HP, 0 ziaren, Jajobomba.
2. Wygrana pierwszej potyczki: 4 ziarna.
3. Pierwszy łup: Pisklak strażnik, Sakiewka ziaren +5, Bojowy rosół +1 HP.
4. Wybór sakiewki: saldo 9.
5. Sklep: Buty wichru za 6, Skrzydlaty skok za 6, Korona grzebienia za 10, rosół za 10.
6. Kupno Butów wichru: saldo 3 i ruch 3,72 w następnej walce.

To przykład realnego kompromisu: wybranie zapasu pieniędzy po pierwszej walce otwiera zakup w sklepie. Bez dodatkowych ziaren część lub wszystkie pokazane oferty mogą być poza zasięgiem.

### 10.5. Konsekwencje ekonomii do researchu

Po minięciu jedynego sklepu nie ma kolejnego wydatku. Ziarna zdobywane później zwiększają licznik, ale nie dają już siły w tej wyprawie ani postępu następnej. Późna sakiewka lub Złote ziarno mają więc ograniczoną wartość użytkową. Trzeba zbadać rolę waluty w dalszej części wyprawy, a nie tylko zwiększać liczbę przedmiotów.

## 11. Zwycięstwo, porażka i restart

Gdy wróg ma 0 HP, zwykłe starcie prowadzi do łupu. Gdy Jajokról ma 0 HP, pojawia się finał. Gdy bohater ma 0 HP, wyprawa kończy się porażką. Nie ma wskrzeszenia, punktów życia drużyny ani kontynuacji za walutę.

Ekran zwycięstwa pokazuje koronę, „KURNIK MA NOWEGO KRÓLA”, tytuł **„Chwała Kurczokerowi!”**, informację o pokonaniu Jajokróla oraz liczbę miejsc i artefaktów. HP i ziarna pozostają w górnym HUD.

Ekran porażki pokazuje motyw skrzyżowanej broni, tekst **„Tym razem poleciały pióra.”**, zachętę do nowej trasy i te same kategorie statystyk. Oba ekrany pozwalają zacząć nową wyprawę.

Nie ma rankingu, zapisu najlepszego wyniku, historii prób, podsumowania trafności, czasu wyprawy, obrażeń, przyczyny śmierci ani analizy wybranego zestawu. Wygrana nie odblokowuje drugiego rozdziału mimo etykiety „ROZDZIAŁ I” w menu.

## 12. Wszystkie ekrany i opcje interfejsu

### 12.1. Strona promocyjna `/`

Osobna strona przedstawia markę, zrzuty/ilustracje promocyjne, opis pętli gry, funkcje, bonusy, nagrody i FAQ. Nawigacja prowadzi do `/gra` oraz sekcji `#funkcje`, `#jak-grac`, `#bonusy`, `#nagrody`, `#faq`. Jest także strona `/polityka-prywatnosci`.

Landing ma własną stylistykę fantasy i typografię Cinzel/Cinzel Decorative. Używa grafik `/uix/screeny/`. Część tekstów opisuje systemy szersze niż obecna implementacja: frakcje, bonusy lojalnościowe, codzienne nagrody. Nie należy traktować tych tekstów jako specyfikacji działającej gry. Podawane tam 15–30 minut wyprawy nie jest potwierdzonym pomiarem obecnej wersji.

### 12.2. Wspólna rama gry `/gra`

- Nagłówek: symbol wieży, „KURCZOKER”, podtytuł „KRONIKI KURNIKA”; logo prowadzi na `/`.
- Narzędzia: dźwięk, „Jak grać”, po rozpoczęciu również pauza.
- Nagłówek wyprawy: tytuł sceny, HP/maksymalne HP, ziarna i liczba miejsc.
- Centralna scena 3D z zaokrągloną ramą i winietą.
- Pod sceną: aktualne cele mapy albo panel walki.
- Stopka: opis zdolności lub ostatni komunikat oraz FPS i wybór jakości.

Etykieta „STARCIE N” wynika z liczby ukończonych miejsc +1, a nie z oddzielnego licznika walk. Wizyta w sklepie lub skarbie wpływa więc na tę numerację.

### 12.3. Menu

Nagłówek „Niech polecą pióra.”, oznaczenie „ROZDZIAŁ I · ZŁOTE GRZĘDY”, hasło „Pióra ze stali. Serce wojownika.” i krótki opis misji. Bohater jest powiększony w dioramie. Przycisk „Nowa wyprawa” staje się aktywny po inicjalizacji klienta. Przy poprawnym zapisie pojawia się również „Kontynuuj wyprawę”.

### 12.4. HUD walki

Na górze areny jest baner z numerem tury i fazą. W turze gracza pokazuje pozostałe sekundy, zaokrąglone w górę. Podczas faz przeciwnika zmienia kolor na czerwony. W dolnych rogach są podpisy bohatera i przeciwnika z HP; przy bohaterze może pojawić się symbol aktywnej osłony.

Panel pod sceną zawiera wszystkie zdobyte zdolności, kierunek, kąt, moc, ruch w obie strony, zwykły skok i duży przycisk aktywacji wybranej zdolności. Nieaktywne przyciski są przygaszone. Nie ma osobnego ekranu ekwipunku, pełnego dziennika efektów ani historii tury.

### 12.5. Łup i sklep

Półprzezroczysta, rozmywająca tło nakładka z tytułem, objaśnieniem i kartami. Karta ma symbol, kategorię „ZDOLNOŚĆ” / „ARTEFAKT” / „ZAPASY”, nazwę, opis i przycisk wyboru lub cenę. Leczenie i sakiewka pokazują dodatkowo wartość liczbową. Sklep dodaje saldo oraz przycisk wyjścia.

### 12.6. Pauza i pomoc

Pauza to modal „Grzęda może poczekać.” z przyciskami powrotu i nowej wyprawy. Pomoc opisuje 20-sekundową turę, celowanie, klawisze i zasady podstawowych osłon. Otwarcie pomocy podczas walki pauzuje ją. Utrata fokusu lub ukrycie karty też pauzuje walkę; powrót wymaga wznowienia.

Symulacja, zegar, lot i animacje postaci oparte na czasie symulacji zatrzymują się. Strona nadal może renderować. Pauza na mapie nie jest osobnym checkpointem i nie zmienia zasad zapisu.

### 12.7. Błędy i ładowanie

Podczas inicjalizacji walki pojawia się „Przygotowujemy arenę” i „Ostrzymy dzioby i liczymy jajobomby…”. Błąd załadowania symulacji ma przycisk ponowienia. Błąd sceny ma komunikat restartu i ponowne załadowanie strony. Brak WebGL2 pokazuje informację o potrzebie obsługi grafiki. Zablokowany localStorage nie uniemożliwia gry, ale może wywołać komunikat o braku zapisu.

## 13. Sterowanie desktop i mobile

| Działanie | Klawiatura / mysz | Dotyk / ekran |
|---|---|---|
| Ruch w lewo/prawo | A/D lub strzałki ←/→ | Przytrzymanie przycisku ←/→ |
| Zwykły skok | W lub ↑ | Przycisk ↑ |
| Ustawienie kąta | Ruch myszy po arenie albo suwak | Dotknięcie/przesunięcie po arenie albo suwak |
| Ustawienie mocy | Suwak | Suwak |
| Zmiana strony rzutu | Wskazanie strony lub przycisk kierunku | Przycisk kierunku albo dotknięcie strony |
| Wybór zdolności | Kliknięcie kafelka | Dotknięcie kafelka |
| Użycie zdolności | Spacja / Enter lub główny przycisk | Główny przycisk |
| Pauza w walce | Esc lub narzędzie w nagłówku | Narzędzie w nagłówku |
| Wybór trasy | Kliknięcie węzła lub przycisku | Dotknięcie węzła lub przycisku |

Klawisze gry nie przechwytują obsługi pól INPUT/SELECT/TEXTAREA. Długie przytrzymanie Spacji nie odpala kilku akcji dzięki ignorowaniu powtórzeń klawisza. Przyciski ruchu używają pointer capture i zatrzymują ruch także przy anulowaniu dotyku lub utracie przechwycenia. Utrata fokusu czyści wejście.

Nie ma gamepada, mapowania własnych klawiszy, wirtualnego joysticka, sterowania gestami kamery ani wymuszonego pełnego ekranu. Można przewijać stronę, a karty w nakładkach mają własne przewijanie, gdy zabraknie miejsca.

### 13.1. Responsywność

Desktop układa zdolności, celowanie, ruch i akcję w szerokim panelu. Przy szerokości do 950 px panel przechodzi na kilka rzędów. Przy wielu zdolnościach pasek umiejętności i celowanie dostają pełną szerokość.

Do 600 px zmniejszają się typografia, marginesy, HUD i narzędzia nagłówka. Arena ma wysokość zależną od ekranu w granicach 275–420 px, a scena menu 490 px. Ekran łupu wymusza co najmniej 360 px wysokości sceny. Przyciski ruchu mają około 42 × 43 px. Interfejs mobilny jest dopasowaniem tej samej gry, bez innego balansu lub odrębnego trybu.

### 13.2. Dostępność — obecne możliwości i granice

Przyciski i suwaki mają etykiety, wybrana zdolność `aria-pressed`, komunikaty role status/alert, a modal rolę dialogu. Jest widoczny focus klawiatury. `prefers-reduced-motion` wyłącza animacje i przejścia CSS, ale nie stanowi pełnej opcji ograniczenia animacji sceny Three.js. Nie ma odrębnego trybu wysokiego kontrastu, regulacji rozmiaru tekstu, wyłączenia limitu tury ani alternatywnego, niewizualnego sposobu rozegrania walki. Nie przeprowadzono pełnego audytu dostępności.

## 14. Wygląd: kierunek artystyczny i detale

### 14.1. Ogólny charakter

Stylizowane, kolorowe fantasy w formie małej dioramy: jasny bohater na zielonej platformie zawieszonej nad spokojnym tłem, las, wzgórza i zamek. Obiekty środowiska mają uproszczoną geometrię i wyraźne bryły. Postacie są rzeczywistymi modelami 3D z kolorowymi materiałami. Gra nie używa sprite’ów postaci jako głównej reprezentacji aktualnego bohatera i przeciwników.

Nie jest to fotorealizm. Czytelność opiera się na sylwetkach, kolorze, kontraście HUD i kontrolowanym kadrze. Wrażenie głębi pochodzi z oświetlenia, cieni, warstw tła i geometrii, choć mechanika pozostaje na jednej płaszczyźnie.

### 14.2. Paleta UI

| Rola | Przykładowy kolor z CSS |
|---|---|
| Tło aplikacji | Ciemna zieleń `#182b29` |
| Główny tekst | Ciepła biel `#edece1` |
| Akcent i główne przyciski | Złoto `#edca7a` |
| Tekst na złotym przycisku | `#22392e` |
| Drugorzędne przyciski | `#31473b` |
| Baner gracza | Ciemna zieleń z przezroczystością `#19372ce8` |
| Baner przeciwnika | Czerwień/brąz `#692f29e8` |
| Informacja o zdrowiu | Łososiowy `#e6a18c` |

Nagłówki i logo używają **Unbounded**, tekst i kontrolki **DM Sans**. Fonty są pobierane z Google Fonts, z lokalnymi fontami zastępczymi. Karty mają delikatne obramowania, zaokrąglenia, gradienty i złote symbole. Menu ma przyciemnienie pomagające odczytać tekst na tle sceny; na telefonie tekst jest bliżej dołu sceny.

### 14.3. Bohater

Kurczak rycerz ma kremowe pióra, bardziej beżowe warstwy upierzenia, pomarańczowy dziób i nogi, stalowy hełm ze złotym obramowaniem i czerwonym pióropuszem. Nosi niebieską tarczę ze złotym detalem, a przy skrzydle widoczny jest motyw jajobomby. Model składa się z obłych brył i wyraźnych elementów wyposażenia. Rzeczywisty lecący pocisk jest oddzielnym obiektem sceny.

### 14.4. Przeciwnicy

Zwykły kogut ma osobny model uzbrojonego drobiowego przeciwnika, metalową tarczę i czerwono-ciemne akcenty. Elita używa tego samego zasobu. Jajokról jest masywniejszy: czarne upierzenie, mocny złoty dziób, czerwony grzebień, złote naramienniki i pas, stalowe kolce oraz świecący detal pasa. Sylwetka bossa i jego arena odróżniają finał wizualnie, nawet przy wspólnej logice ataku.

### 14.5. Świat i światło

Teren ma zielony wierzch i kamienny spód z dodatkowymi wielościennymi skałami. W tle są drzewa z prostymi pniami i wielościennymi koronami, warstwy gór/wzgórz, zamek z wieżami, dachami, oknami i flagą. Na pierwszym planie są drobne kwiaty. Duża płaszczyzna pod sceną buduje spokojne tło; nie jest aktywnym systemem wody.

Normalna scena ma tło `#d3dbce`, boss `#b2b9bf`. Jest mgła od 24 do 58 jednostek, światło ambient, hemisferyczne i ciepłe światło kierunkowe z góry. Cienie w wysokiej jakości używają mapy 1024 × 1024. Roślinność rysowana jest instancjami: 26 drzew w profilu wysokim i 14 w oszczędnym. Kwiaty również są instancjonowane.

### 14.6. Kamera

Kamera jest ortograficzna, ustawiona w przybliżeniu na `[0, 6, 16]`, patrzy na `[0, 1.8, 0]`. Zoom dopasowuje się przez `min(szerokość / 16.5, wysokość / 8.8)`. Cała arena pozostaje w kontrolowanym kadrze po zmianie rozmiaru okna.

Nie ma swobodnego obrotu, zoomu kółkiem, śledzenia lotu pocisku, dramatycznych zbliżeń ani trzęsienia kamerą. „Kontrolowana kamera” oznacza obecnie kontrolę kadru przez aplikację.

### 14.7. Animacje i efekty

Każdy z trzech modeli ma klipy **Idle**, **Walk**, **Attack**. Są generowane na obrotach części, takich jak skrzydła i nogi; nie należy utożsamiać ich z rozbudowanym, ręcznie animowanym szkieletem postaci. Zmiana klipu używa krótkiego przenikania około 0,12 s.

Postać lekko kołysze się w bezruchu, mocniej podskakuje wizualnie w chodzie, obraca się zgodnie ze stroną rzutu, reaguje krótkim przechyłem na trafienie i kładzie się przy 0 HP. Nie ma osobnych klipów Victory, Defeat ani Hit — część reakcji wykonywana jest transformacjami.

Jajobomba to jasne, obracające się jajo z małym światłem i złotą smugą do 24 próbek. Wybuch trwa około 0,8 s: jasna bryła, rozszerzający się pierścień, dziesięć odłamków i napis z obrażeniami albo „PUDŁO / BLOK”. Pociski obu stron korzystają z tego samego podstawowego wyglądu. Brak osobnych efektów przestrzennych dla każdej zdolności; ochronę komunikuje przede wszystkim HUD.

## 15. Dźwięk

Dźwięk jest generowany na bieżąco przez Web Audio API. Nie ma paczki nagranych odgłosów, muzyki tła, ambientu lasu, dialogów ani głosu narratora. Dostępnych jest pięć krótkich efektów:

| Zdarzenie | Charakter | Długość |
|---|---|---:|
| Wystrzał | Rosnący ton prostokątny, 440 → 660 Hz | 0,08 s |
| Trafienie/eksplozja | Opadający ton piłokształtny, 180 → 90 Hz | 0,12 s |
| Nagroda / zdolność | Rosnący ton trójkątny, 660 → 990 Hz | 0,16 s |
| Porażka | Opadający ton, 220 → 55 Hz | 0,35 s |
| Zwycięstwo | Rosnący ton, 520 → 1040 Hz | 0,28 s |

Gracz włącza dźwięk przyciskiem, co inicjalizuje lub wznawia kontekst audio po interakcji. Jest tylko przełącznik włącz/wyłącz, bez suwaka głośności i osobnych kanałów. Preferencja jakości jest zapisywana lokalnie, ale lokalny stan włączenia dźwięku w aktualnym komponencie rozpoczyna się ponownie od wyciszenia.

## 16. Zapis i odporność sesji

Checkpoint jest przechowywany pod kluczem localStorage **`kurczoker.checkpoint.v1`**. Ustawienia jakości pod **`kurczoker.settings`**. Jest jeden slot wyprawy na dany origin przeglądarki.

Zapis jest tworzony dla mapy, nagrody i sklepu. Nie zapisuje świata Rapiera w trakcie walki. Odświeżenie podczas starcia pozwala wrócić do ostatniego poprawnego checkpointu, a nie dokładnie do chwili przed odświeżeniem. Wynik zwycięstwa lub porażki całej wyprawy usuwa checkpoint. Nie ma synchronizacji między urządzeniami ani eksportu/importu w UI.

Parser sprawdza wersję, wielkość danych, seed, zakresy HP i waluty, poprawność identyfikatorów węzłów, zdolności i artefaktów, powtórzenia przedmiotów, część relacji mapy oraz wartości nagród. Mapę odtwarza z seeda. Uszkodzony lub niezgodny zapis jest odrzucany. Jest to walidacja lokalnej sesji, nie ochrona rankingu przed oszustwami.

Zapis dla adresu aliasowego Cloudflare i zapis dla adresu niezmiennego deploymentu są oddzielne, ponieważ to różne originy. Zmiana domeny nie przenosi automatycznie wyprawy. Brak dostępu do localStorage pozwala grać dalej w bieżącej karcie.

## 17. Architektura i ścieżki plików

Ścieżki w tej sekcji są względne wobec katalogu repozytorium, aby pozostały użyteczne po przeniesieniu tego jednego pliku do innego narzędzia. Nie trzeba ich otwierać, by zrozumieć wcześniejsze sekcje.

### 17.1. Przepływ działającej aplikacji

```text
src/pages/gra.astro
  → src/components/HeroGame.astro
    → src/engine/KurczokerCanvas.jsx
      ├─ Zustand: src/engine/store/useGameStore.js
      │   └─ kampania: src/game/{state,map,run,abilities}.js
      ├─ src/engine/GameRuntime.jsx
      │   ├─ src/engine/scenes/MapScene.jsx
      │   └─ src/engine/scenes/BattleScene.jsx
      │       └─ src/engine/tactical/simulation.js → Rapier WASM
      └─ src/engine/tactical/{Controls,World,Chicken,Effects}.jsx
```

Stan kampanii jest oddzielony od symulacji aktywnego starcia. Rapier zarządza ruchem i pociskami, scena odczytuje jego snapshoty i zdarzenia. HUD jest odświeżany z symulacji mniej więcej co 0,1 s. Po zakończeniu walka przekazuje wynik i HP przez `finishEncounter`, które przyznaje ziarna, aktualizuje tymczasowe efekty i uruchamia dalszy przebieg kampanii.

### 17.2. Mapa odpowiedzialności plików

| Ścieżka | Odpowiedzialność |
|---|---|
| `src/pages/index.astro` | Landing i jego teksty promocyjne |
| `src/pages/gra.astro` | Strona wejściowa gry, metadane |
| `src/components/HeroGame.astro` | Osadzenie React z `client:load`, CSS gry |
| `src/engine/KurczokerCanvas.jsx` | Menu, Canvas, HUD, ekrany łupu, pauza, audio, zapis, jakość i cykl inicjalizacji |
| `src/engine/GameRuntime.jsx` | Wybór sceny i dopasowanie kamery |
| `src/engine/store/useGameStore.js` | Akcje kampanii, zakup, wybór nagrody, integracja wyniku walki |
| `src/game/state.js` | Stan początkowy i restart |
| `src/game/map.js` | Węzły i połączenia całej kampanii |
| `src/game/run.js` | Przejścia między miejscami, łup, sklep, finały |
| `src/game/abilities.js` | Katalog zdolności/artefaktów, dobór i nakładanie nagród |
| `src/engine/tactical/simulation.js` | Aktywna fizyka walki, fazy, AI, obrażenia, osłony i podgląd lotu |
| `src/engine/tactical/arena.js` | Parametry fizyki i wspólne platformy/kolidery |
| `src/engine/tactical/ballistics.js` | Kąt, prędkość i przeliczenie wskazanego punktu |
| `src/engine/tactical/Controls.jsx` | Klawiatura, pointer capture, suwaki i panel zdolności |
| `src/engine/tactical/copy.js` | Polskie nazwy, opisy, symbole i akcje |
| `src/engine/tactical/checkpoint.js` | Format, zapis i walidacja checkpointu |
| `src/engine/tactical/World.jsx` | Proceduralne środowisko, światła i instancje |
| `src/engine/tactical/Chicken.jsx` | Modele postaci i animacje |
| `src/engine/tactical/Effects.jsx` | Podgląd lotu, jajo, smuga i eksplozja |
| `src/engine/tactical/releaseManifest.json` | Lista faktycznie używanych modeli wydania |
| `src/styles/game.css` | Wygląd i responsywność aktywnej gry |
| `src/game/audio.js` | Synteza efektów dźwiękowych |
| `src/components/UmamiAnalytics.astro` | Opcjonalna analityka strony |
| `tools/build-game-assets.mjs` | Animacje, optymalizacja i kompresja modeli |
| `tools/generate-true-3d-chicken-actors.mjs` | Generowanie źródłowych postaci |
| `tools/prepare-release.mjs` | Usunięcie starych zasobów z builda i kontrola rozmiarów |
| `tools/deploy-pages.mjs` | Wdrożenie aktualnej gałęzi do Cloudflare Pages |
| `tools/pages.config.json` | Nazwa projektu i gałęzi produkcyjnej |
| `tools/verify-preview.mjs` | Sprawdzenie plików wdrożenia |
| `public/_headers` | Cache oraz nagłówki HTTP |
| `astro.config.mjs` | Build statyczny i podział bundli |

### 17.3. Stos technologiczny

W `package.json` zadeklarowano: Astro `^6.2.2`, React/React DOM `^19.2.5`, Three.js `^0.184.0`, React Three Fiber `^9.6.1`, Drei `^10.7.7`, Rapier compat `^0.20.0`, Zustand `^5.0.13`. Obecne są też `@react-three/rapier`, glTF Transform, meshoptimizer, Playwright i Wrangler. To zakresy zależności z manifestu, a nie stwierdzenie o najnowszych wersjach tych bibliotek.

Build jest statyczny. Symulacja Rapiera jest importowana przy wejściu do walki. React i biblioteki 3D są wydzielane w bundlach. Aktualny świat walki tworzy bezpośrednio `@dimforge/rapier3d-compat`; sama obecność wrappera `@react-three/rapier` w dependencies nie oznacza drugiego równoległego świata fizycznego w tej scenie.

### 17.4. Starsze implementacje — ważne dla kolejnego audytu

Repo zawiera również `src/game/battle.js`, `physics.js`, `renderer.js`, `input.js`, `bootstrap.js` oraz starsze komponenty `src/engine/components/`, `runtime/` i `fx/`. Część starej domeny nadal uczestniczy w inicjalizacji danych store, a część służy wcześniejszej implementacji i jej testom. Nie należy ani uznać wszystkiego za aktywne, ani usunąć całego katalogu `src/game`, bo właśnie tam pozostaje logika kampanii.

Przykłady wartości, których nie należy przenosić do opisu obecnej walki:

- Stare `TUNING.PLAYER_TURN_MS = 8000`; aktywna tura to **20 s** z `tactical/arena.js`.
- Stare dane inicjalizacyjne store mają bossa 6 HP; aktywna symulacja tworzy **8 HP**.
- Starsze parametry elity przewidują 2 obrażenia; aktywny pocisk elity zadaje **1 HP**.
- Katalog zdolności ma cooldowny i inne promienie w starych jednostkach; obecny runtime stosuje zasady opisane wyżej.

Przy rozbudowie konieczne jest śledzenie aktywnego przepływu wywołań, aby nowa funkcja nie została dodana wyłącznie do starszego silnika.

## 18. Zasoby 3D, jakość i wydajność

### 18.1. Modele używane w wydaniu

| Model | Adres zasobu | Rozmiar |
|---|---|---:|
| Bohater | `/game/release/hero-chicken.1fba7d2e222f.glb` | 72 152 B |
| Kogut | `/game/release/enemy-rooster.37f86fa86010.glb` | 69 508 B |
| Jajokról | `/game/release/boss-rooster.951482c5886a.glb` | 70 156 B |
| **Razem** | Trzy animowane GLB | **211 816 B** |

Modele mają kompresję `EXT_meshopt_compression`, kolory materiałów i nie używają rastrowych tekstur. Pipeline łączy statyczne fragmenty, zachowuje ruchome części, usuwa zbędne dane i nadaje nazwy zawierające hash zawartości. Nie ma obecnie tekstur KTX2 do opisania; kompresja tekstur jest tematem potencjalnej przyszłej rozbudowy.

W `public/game/assets/` pozostają poprzednie generacje modeli i referencje: procedural-backup, rodin-uix, hyper3d-world, hyper3d-clean i inne. Nie są dowodem używania tych światów w aktualnej grze. `prepare-release.mjs` usuwa `game/assets` z `dist`, pozostawiając źródła w repozytorium. Grafiki promocyjne landingu mają osobną ścieżkę i pozostają w wydaniu.

### 18.2. Profile jakości

| Profil | DPR | Cienie / antyaliasing | Drzewa |
|---|---|---|---:|
| Wysoka | 1–1,5 | Włączone | 26 |
| Oszczędna | 1 | Wyłączone | 14 |
| Auto | Dobiera jeden z powyższych | Według heurystyki | Według profilu |

Auto na starcie preferuje profil oszczędny przy szerokości ≤700 px lub `hardwareConcurrency ≤4`. Co około 2 s zbierane są FPS, p95 czasu klatki, draw calls i trójkąty. Po co najmniej trzech próbkach wynik poniżej 26 FPS może przełączyć Auto na wariant oszczędny. Ręczny wybór wysokiej jakości pozostaje ręcznym wyborem. Nie ma rozbudowanego dynamicznego skalowania rozdzielczości, systemu LOD postaci ani automatycznego powrotu do wyższej jakości.

### 18.3. Zapisane wyniki pomiarów

Według raportu odbioru z 8 września 2026 r.:

- Kod/CSS i zasoby gry przed kompresją HTTP: **4 365 605 B**, około 4,16 MiB.
- Cały katalog wydania, wraz z landingiem: **33 195 812 B**, około 31,66 MiB.
- Największy plik: Rapier z osadzonym WASM, **2 861 020 B**.
- Krótki pomiar Windows/Chromium, ANGLE Intel UHD Graphics Direct3D11, 1440×900: **60 FPS, p95 18 ms** w obu profilach.
- W mierzonej arenie: 68 draw calls; 22 596 trójkątów w wysokiej i 21 396 w oszczędnej jakości.

To wyniki wcześniejszego odbioru, nie nowy benchmark wykonany podczas tworzenia dokumentu. Pomiar pojedynczego komputera nie potwierdza wydajności na wszystkich telefonach. Automatyzacja ze SwiftShader służyła zachowaniu gry, a nie pomiarowi sprzętowego GPU telefonu.

## 19. Cloudflare i granice infrastruktury

Aktualny projekt Cloudflare Pages nazywa się **`kurczoker-makeover`**. Gałąź `main` jest wskazana jako produkcyjna. Opisywana wersja działa jako **preview gałęzi `baza080926-makeover`**. W ostatnim wydaniu nie przełączano DNS `kurczoker.com`.

Cloudflare serwuje statyczny HTML, JavaScript, CSS i GLB. Walka i stan wyprawy wykonują się na urządzeniu gracza. Gra nie korzysta obecnie z D1, KV, R2, Durable Objects, logowania ani serwera multiplayer. Backend nie jest potrzebny do aktualnej pętli single player.

`/game/release/*` i `/_astro/*` mają roczny cache immutable. `/gra` wymaga rewalidacji. Hash w nazwach plików umożliwia wymianę zasobów po nowym buildzie. Skrypt wydania sprawdza przyjęty budżet gry **10 MiB** i próg **25 MiB na plik**. Są to reguły obecnego pipeline’u; przy następnym researchu infrastruktury trzeba ponownie zweryfikować aktualną dokumentację i limity dostawcy.

`npm run deploy` wykonuje build i skrypt wdrożenia. Skrypt używa aktualnej gałęzi, a dla `main` wymaga jawnej flagi produkcyjnej. Narzędzie weryfikacji sprawdza HTTP 200, typy JS/GLB, cache i zgodność sum modeli. Dane uwierzytelniające nie są elementem tego dokumentu.

Opcjonalne Umami włącza się przez publiczny adres skryptu HTTPS i ID witryny w konfiguracji builda. Gra nie zależy od analityki. Nie ma obecnie dedykowanego strumienia telemetrycznego decyzji taktycznych, balansu i lejka wyprawy opisanego jako system produktowy.

Nie wdrożono service workera ani osobnego trybu offline/PWA. Lokalny zapis i cache przeglądarki nie są równoznaczne z gwarantowaną rozgrywką offline po zamknięciu strony.

## 20. Co zostało sprawdzone

Na podstawie istniejącego raportu odbioru i zakończonego wdrożenia:

| Zakres | Dowód / wynik |
|---|---|
| Testy jednostkowe/integracyjne repo | 138/138 zaliczonych w poprzednim odbiorze |
| Testy przeglądarkowe | 3/3 lokalnie; 3/3 na wcześniejszym preview tej implementacji |
| Fizyka | Trafienia/pudła, zgodność przy różnych częstotliwościach renderowania, timeout, osłony, leczenie i bonusy |
| Desktop Codexa | Interaktywny test 1440×900: start, scena, rzut, nagroda, pauza |
| Widok mobile Codexa | 390×844, kontrolki, zakup, odświeżenie i kontynuacja; brak poziomego przepełnienia w sprawdzonym stanie |
| Pełna wyprawa Codexa | Sklep, potyczki, elita, boss i zwycięstwo przez rzeczywiste rzuty |
| Finał przykładowej wyprawy | 2/4 HP, 21 ziaren, 6 miejsc, 3 artefakty |
| Konsola końcowej karty | Brak wpisów error |
| Najnowszy deploy c42d25f6 | Sukces; 51 plików zweryfikowanych przez HTTP i zgodność modeli |

Widok mobile na komputerze nie zastępuje odbioru na fizycznym Androidzie lub iPhonie. Nie potwierdzono tutaj wszystkich seedów, wszystkich kombinacji zdolności i przedmiotów, wielogodzinnego działania, zużycia baterii ani wyników testów z nowymi graczami. Istnienie testów starszego silnika nie oznacza pokrycia wszystkich reguł aktywnego runtime’u.

## 21. Miejsca, które mogą ograniczać różnorodność i zabawę

Poniższe punkty są wnioskami z obecnych reguł, przeznaczonymi do sprawdzenia w researchu i obserwacji graczy.

### 21.1. Szybkie rozstrzygnięcia zwykłych walk

Zwykły kogut ma 2 HP, a podstawowa bomba zadaje 2. Jedno poprawne trafienie może zakończyć potyczkę bez odpowiedzi wroga. To może dawać satysfakcję, ale też ograniczać znaczenie ruchu, osłon i alternatywnych zdolności w większości kampanii. Pierwsze dwie potyczki mają ten sam układ i pozycje początkowe, więc raz odkryty skuteczny rzut może być powtarzany.

### 21.2. Boss różni się przede wszystkim wytrzymałością

Jajokról wymaga nominalnie 4 trafień bazową bombą, 3 z Jajem chaosu albo 2 wzmocnionych do 4 HP. To wyliczenie obrażeń przy skutecznych rzutach, nie symulacja całej taktyki: przygotowanie Magicznego ziarna samo zużywa turę. Brakuje zmiany reguł finału i rozpoznawalnych wzorców wymagających różnych odpowiedzi.

### 21.3. Role zdolności są nierówno rozwinięte

Jajobomba jest jedynym pociskiem ofensywnym. Strażnik i Skrzydlaty skok częściowo dublują ochronę. Magiczne ziarno leczy i wzmacnia, lecz po użyciu wystawia gracza na odpowiedź wroga. Bez cooldownów powtarzanie ochrony może przedłużać walkę bez postępu, a powtarzane leczenie może tworzyć stan równowagi z atakiem za 1 HP. Ocena atrakcyjności tych decyzji wymaga testu, nie samego dodania kolejnych ikon.

### 21.4. Mała liczba decyzji na mapie

Są tylko dwa istotne rozwidlenia: sklep/skarb i elita/pominięcie. Seedy nie tworzą nowych grafów ani aren. Dodatkowa walka z elitą daje korzyść, ale jej przeciwnik nie oferuje nowego zachowania. Nie ma sytuacyjnych wydarzeń, ukrytej informacji i długofalowych konfliktów celów.

### 21.5. Słaba funkcja późnej waluty

Pieniądze po jedynym sklepie nie mają zastosowania. Nagrody pieniężne mogą zajmować sloty obok realnych wzmocnień, mimo że nie pomagają już w pokonaniu bossa. Nie ma końcowego wydatku ani przenoszenia waluty między próbami.

### 21.6. Niewielka wizualna manifestacja rozwoju

Zdobycie przedmiotu zwykle zmienia liczby lub zasady bez zmiany wyglądu bohatera. Strażnik nie pojawia się jako istota w świecie. Ochrona, wzmocnienie i artefakty mają skromne sygnały. Obecny feedback dobrze pokazuje lot i obrażenia, słabiej odróżnia rodzaje efektów oraz źródło blokady.

### 21.7. Niewykorzystany potencjał terenu i czasu

Geometria zawiera głównie płaską podłogę i niski stopień. Brak destrukcji, wysoko położonych stanowisk, obiektów do interakcji i zagrożeń. Gracz może ruszać się tylko przed akcją, a AI strzela do jego pozycji po przygotowaniu. Trzeba ustalić, jaki problem taktyczny ma rozwiązywać ruch i kiedy gracz odczuwa korzyść ze zmiany pozycji.

### 21.8. Brak trwałego powodu powrotu

Nowa wyprawa zmienia seed i resetuje rozwój. Nie ma kolekcji, osiągnięć, klas, modyfikatorów trudności, dziennych wyzwań ani nowych rozdziałów. Samo dodanie metaprogresji nie powinno zastąpić ciekawszych starć, ale obecny produkt nie daje osobnego celu po pierwszym zwycięstwie.

## 22. Macierz: obecne funkcje a tematy rozwoju

| Obszar | Jest teraz | Brak teraz / temat do zbadania |
|---|---|---|
| Broń | Jedna jajobomba | Różne trajektorie, zapalniki, serie, obszary działania |
| Taktyka | Pozycja, kąt, moc, jedna akcja | Więcej odmiennych decyzji i kontr |
| Wróg | Trzy poziomy HP, wspólne AI | Archetypy, zamiary, ruch, odmienne ataki |
| Boss | 8 HP i osobny model | Fazy, mechanika areny, słabe punkty |
| Teren | Platforma i centralny stopień | Znaczące osłony, interakcje, ewentualna destrukcja |
| Mapa | Cztery warianty trasy | Różne grafy, wydarzenia, biomy, ryzyko tras |
| Build bohatera | 4 zdolności, 6 artefaktów | Synergie, wyraźne style gry, koszty wyborów |
| Ekonomia | Jeden sklep | Wydatki w dalszej kampanii, wycena wartości |
| Kolejne próby | Reset i zmiana seeda | Cele po zwycięstwie, kolekcja lub wyzwania |
| Oprawa | Diorama, 3 modele, 3 klipy | Silniejsza identyfikacja efektów, rozwój wizualny |
| Audio | 5 syntezowanych sygnałów | Motywy muzyczne, ambient, charakterystyczne odgłosy |
| Mobile | Responsywność, przyciski, suwaki | Testy fizycznych urządzeń, ergonomia i bateria |
| Backend | Brak potrzeby dla obecnego trybu | Dopiero po określeniu konkretnej funkcji online |

## 23. Brief do głębokiego researchu — gotowy do przekazania

### 23.1. Zadanie dla badacza

Na podstawie całego tego dokumentu zaprojektuj kierunki rozwoju KURCZOKERA: jednoosobowej przeglądarkowej gry o kurczaku wojowniku, z turami aktywnymi, jajobombami, mapą wyprawy i stylizowanym 3D. Celem jest większa różnorodność, satysfakcja i chęć ponownej gry, przy zachowaniu czytelności na telefonie i wykonalności na obecnym stosie oraz Cloudflare.

Nie zakładaj istnienia frakcji, metaprogresji, wielu broni, destrukcji terenu ani innych systemów wymienionych jako nieobecne. Nie traktuj promocyjnych grafik i dawnych dokumentów jako stanu aktualnego. Oddziel propozycje od faktów i porównuj koszt wdrożenia z korzyścią dla gracza.

### 23.2. Pytania badawcze

1. **Rdzeń walki:** jak osiągnąć ciekawszą decyzję w każdej turze przy jednym bohaterze i małym ekranie? Jaka długość tury i liczba akcji tworzą dobre tempo?
2. **Rola ruchu:** jakie areny i ataki sprawiają, że pozycja ma znaczenie? Czy ruch powinien kończyć się przy strzale, czy potrzebne jest krótkie okno po akcji?
3. **Czytelność trajektorii:** ile informacji powinien dawać podgląd? Jak utrzymać uczciwość trafień, gdy dojdą odbicia, wiatr, zapalniki lub przeszkody?
4. **Bronie:** jaki mały zestaw broni dawałby naprawdę odmienne zastosowania? Dla każdej podaj kontrę, koszt, interakcję z terenem i sposób obsługi dotykiem.
5. **Zdolności:** jak odróżnić ochronę, mobilność, leczenie i ofensywę? Jak zapobiec pętlom bez postępu bez dodawania zbędnych zasobów?
6. **Przeciwnicy:** jakie archetypy można zrealizować przy obecnym silniku? Jak pokazywać zamiar, aby odpowiedź zależała od decyzji gracza?
7. **Bossowie:** jak stworzyć finał z własną zasadą, a nie tylko większym HP? Jak stopniować mechanikę i sygnalizować zagrożenie na mobile?
8. **Mapa:** ile miejsc, rozwidleń i typów wydarzeń potrzeba do odczuwalnie różnych wypraw? Co ma skłaniać do wyboru trudniejszej trasy?
9. **Nagrody:** jaki model synergi i rzadkości wspiera różne style gry? Jak unikać martwych ofert, duplikatów i nagród bezużytecznych pod koniec wyprawy?
10. **Ekonomia:** do czego mają służyć ziarna po pierwszym sklepie? Jak wyceniać leczenie, zdolności i artefakty względem realnej wartości?
11. **Powroty:** czy potrzebna jest metaprogresja, wyzwania, nowe postacie, osiągnięcia czy kolekcja? Jak zachować sens każdej próby bez przymusu codziennego grania?
12. **Oprawa:** jak rozbudować język wizualny drobiowego fantasy przy małym budżecie modeli i tekstur? Jak pokazać build bohatera w samej scenie?
13. **Audio:** jaki minimalny zestaw muzyki i dźwięków daje największy wzrost satysfakcji? Jak zachować szybkie ładowanie i jasną kontrolę głośności?
14. **Mobile:** jak zweryfikować czytelność, sterowanie, czas ładowania, zużycie pamięci i baterii na fizycznych urządzeniach?
15. **Technologia:** które propozycje mieszczą się w obecnym Rapier/Three.js, a które wymagają przebudowy? Jak nie rozjechać podglądu lotu z rzeczywistą fizyką?
16. **Cloudflare:** które funkcje pozostają całkowicie statyczne, a które potrzebują usługi backendowej? Zweryfikuj aktualne limity, koszty i uzasadnij każdy dodatkowy komponent.

### 23.3. Oczekiwany rezultat researchu

Opracowanie powinno zawierać:

- Diagnozę największych ograniczeń obecnej pętli, powiązaną z konkretnymi regułami tego dokumentu.
- Porównanie trafnie dobranych gier odniesienia, z opisem mechanik i źródłami, a nie samą listą tytułów.
- Trzy spójne warianty rozbudowy: mały, średni i ambitny; każdy ze skutkiem dla walki, wyprawy, oprawy i techniki.
- Rekomendowany wariant uzasadniony korzyścią dla gracza, kosztem produkcji i ryzykiem wydajności.
- Katalog proponowanych broni, przeciwników, artefaktów, wydarzeń i bossów; każda pozycja z jasno opisaną rolą i interakcjami.
- Tabelę zależności między systemami oraz wskazanie tego, czego na danym etapie nie warto budować.
- Plan wdrożenia w kolejnych grywalnych fragmentach, z kryteriami odbioru każdego fragmentu.
- Plan testów z graczami, pomiarów balansu, mobile i Cloudflare preview.
- Źródła z linkami, datą dostępu i rozdzieleniem faktów, obserwacji i hipotez. Dla technologii pierwszeństwo mają oficjalne dokumentacje i materiały twórców.

### 23.4. Format pojedynczej proponowanej funkcji

| Pole | Co podać |
|---|---|
| Nazwa i rola | Jedno zdanie: jaki problem gracza rozwiązuje |
| Decyzja gracza | Co gracz wybiera i dlaczego nie jest to zawsze oczywiste |
| Reguły | Parametry, warunki aktywacji, koszt i zakończenie |
| Interakcje | Wpływ na obecne zdolności, osłony, teren i ekonomię |
| Kontra | Jak gracz lub przeciwnik może odpowiedzieć |
| Czytelność | Jak rozpoznać stan w HUD, modelu, efekcie i dźwięku |
| Mobile | Konkretne sterowanie i wymagane miejsce na ekranie |
| Implementacja | Aktywne moduły wymagające zmiany; nowe dane i zasoby |
| Wydajność | Koszt CPU/GPU, pamięci i transferu |
| Weryfikacja | Test zachowania oraz obserwacja, która potwierdzi korzyść |
| Ryzyko | Możliwa dominująca strategia, konflikt lub niepożądana pętla |

### 23.5. Jakie pomiary powinny prowadzić rozwój

Do zaprojektowania, nie jako istniejąca telemetria: czas od wejścia do pierwszej akcji, czas ukończenia wyprawy, liczba tur na typ walki, udział trafień i pudeł, obrażenia otrzymane, wybieralność zdolności i nagród, popularność tras, saldo przy sklepach i finale, przyczyny porażek, odsetek restartów, chęć rozpoczęcia następnej próby oraz FPS/p95/czas ładowania na docelowych urządzeniach.

Najważniejsze pytanie odbioru każdej rozbudowy: **czy gracz podejmuje nową, zrozumiałą i interesującą decyzję, czy tylko ogląda większą liczbę elementów?**

## 24. Pochodzenie informacji i utrzymanie dokumentu

Opis zasad pochodzi przede wszystkim z aktywnych plików wymienionych w sekcji 17. Dokładne parametry walki sprawdzono w `src/engine/tactical/simulation.js`, `arena.js` i `ballistics.js`; mapę i ekonomię w `src/game/map.js`, `run.js`, `abilities.js` oraz `src/engine/store/useGameStore.js`; wygląd w JSX scen, generatorze postaci i `src/styles/game.css`.

Wyniki wcześniejszych testów pochodzą z `docs/research/2026-09-08-makeover-odbior.md`. Kontekst poprzedniej przebudowy znajduje się w `docs/research/2026-09-08-kurczoker-audyt-i-plan-naprawczy.md`, projekcie `docs/superpowers/specs/2026-09-08-kurczoker-makeover-design.md` i planie `docs/superpowers/plans/2026-09-08-kurczoker-makeover.md`. Starszy `docs/KURCZOKER_PRODUCT_SPEC_FOR_DESIGN.md` i katalog `docs/product-spec-assets/` mogą przedstawiać wcześniejszy stan; nie zastępują obecnej inwentaryzacji.

Dokument jest celowo tekstowy i samodzielny: nie wymaga dołączania obrazów ani lokalnych plików. Opisuje wygląd na podstawie aktywnych zasobów i kodu, a link do preview pozwala badaczowi dodatkowo obejrzeć działającą wersję. Przy kolejnej przebudowie należy zaktualizować datę, commit, balans, katalog zawartości i adres wydania, zachowując rozdzielenie stanu aktualnego od propozycji.
