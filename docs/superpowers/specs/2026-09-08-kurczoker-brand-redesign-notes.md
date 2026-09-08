# KURCZOKER × DELTA240MVT — ustalenia brainstormingu

Data: 2026-09-08. Gałąź: `baza080926-makeover`. Status: historyczny zapis rozmowy i kolejnych propozycji. Ustalenia scalono w `2026-09-08-kurczoker-brand-redesign-design.md` w tym katalogu; ten master dokument jest aktualną specyfikacją do końcowego przeglądu. Wcześniejsze oznaczenia „do projektu” w niniejszym dzienniku opisują moment rozmowy i nie zastępują rozstrzygnięć master dokumentu.

## Cel właściciela

Kompletna przebudowa landingu, dynamiki i wyglądu gry. KURCZOKER ma być zabawną, grywalną grą przeglądarkową i przyjemnym akcentem w portfolio produktowym DELTA240MVT. Odbiorcy: osoby 35–65 lat, zgodnie z kontekstem marki. Uzgodnienia i master plan powstają wspólnie z właścicielem.

Inspiracje wskazane przez właściciela: **Worms 2 — dynamika walki; Heroes of Might and Magic / Heroes III — wyprawa; Game Boy — wygląd.** Właściciel wyraźnie skorygował wcześniejsze słowo Warcraft: Warcraft nie jest inspiracją tego projektu.

## Zatwierdzone decyzje

| Nr | Decyzja | Znaczenie |
|---|---|---|
| 1 | Krótka wyprawa | Docelowo 10–15 minut, możliwość przerwania i powrotu. Jest to cel tempa projektu, nie limit czasu sesji. |
| 2 | Bez zegara | Domyślnie brak odliczania podczas własnej tury; fizyka pocisków i eksplozji działa w czasie rzeczywistym. |
| 3 | Jeden bohater | Jeden kurczak, którego styl rozwijają zdobywane bronie i przedmioty; bez pary ani drużyny gracza. |
| 4 | Destrukcja i drążenie przejść — zakres rozszerzony | Początkowo wybrano modularne osłony i stabilny grunt. Późniejsza dyspozycja właściciela wymaga również narzędzi do robienia dziur i przebijania się przez teren. Wcześniejsze ograniczenie do niszczenia propsów nie opisuje już całego wymaganego zakresu. Dokładna reprezentacja deformowalnego terenu wymaga projektu i weryfikacji technicznej. |
| 5 | Jedna druga szansa | Po przegranej można raz na wyprawę powtórzyć starcie i zmienić wyposażenie. Następna porażka kończy wyprawę. Upadek poza arenę odbiera HP i przenosi do bezpiecznego miejsca. |
| 6 | Kierunek wizualny A — Kolorowa przygoda | Właściciel po obejrzeniu makiet: „a jest super!”. Jasna rama DELTA240MVT, turkusowe akcje, mocna typografia, ciepły kolorowy świat retro. Wariant B monochromatyczny i C nocny nie są wybranym kierunkiem domyślnym. |
| 7 | Stopniowe zdobywanie broni | Właściciel wybrał zdobywanie kolejnych broni podczas wyprawy zamiast całego arsenału od początku. Dokładny katalog i kolejność odblokowań pozostają do projektu. |
| 8 | Ruch jako rdzeń gry | Właściciel wymaga chodzenia kurczakiem jak w Worms, wskakiwania na przeszkody i przemieszczania po zróżnicowanej, dość dużej planszy. |
| 9 | Obowiązkowe „lasso” | Właściciel wymaga lassa jak w Worms. Interpretacja robocza: lina z hakiem, zaczepianie o teren, huśtanie, regulacja długości i odczepianie; to mechanika przemieszczania, nie dekoracja. |
| 10 | Dostępność liny i narzędzi | Właściciel zaakceptował linę od początku bez amunicji, do swobodnego ćwiczenia przemieszczania. Narzędzia do drążenia są zdobywane podczas wyprawy i mają ograniczoną liczbę użyć. Nie oznacza to jeszcze zatwierdzenia kosztu akcji tych narzędzi. |
| 11 | Mobile od początku | Bezpośrednia dyspozycja: „gra musi byc mobile ready od razu!”. Sterowanie dotykowe i mobilny rendering należą do pierwszego grywalnego fragmentu i kryteriów odbioru każdego następnego etapu, nie do końcowego dostosowania desktopu. |
| 12 | Pion priorytetowy, walka na cały ekran | Właściciel wymaga równie wygodnej walki w obu orientacjach, z preferencją pionu i zajęciem całego ekranu. Nie wymuszamy obrotu telefonu. Układ walki projektujemy najpierw w pionie, a poziom adaptuje kontrolki i kadr. |
| 13 | Zasady tury | Zaakceptowano: swobodny ruch, skoki i lina → opcjonalnie jedno użycie narzędzia do drążenia → jeden strzał → odpowiedź przeciwnika. Bez zegara i bez paska energii za chodzenie. Narzędzie zużywa zapas, lecz pozwala jeszcze oddać strzał w tej samej turze. |
| 14 | Dwa tryby i dziewięć map | Właściciel wymaga szybkiego trybu z bezpośrednim wyborem różnych map — dziewięciu map o różnym ukształtowaniu terenu — oraz osobnej opcji wyprawy na 10–15 minut. Dziewięć map nie ma być wyłącznie zmianami kolorów tej samej geometrii. |
| 15 | Rozwinięcie dwóch trybów | Odpowiedź „ok” na przedstawiony projekt: szybka potyczka z wyborem mapy i dostępem do całego arsenału, ograniczone zapasy mocniejszych broni i narzędzi, rewanż lub zmiana mapy; wyprawa obejmuje trzy potyczki i bossa, wybory trasy, nagrody i sklep. Przyjęto dziewięć przedstawionych typów topografii. Szczegóły geometrii i balans wymagają testów. |

## Przedstawione propozycje, które wymagają dopracowania

- Wyprawa: zatwierdzono trzy potyczki i bossa, przeplatane wyborami trasy, nagrodami i sklepem. Dokładna długość ma wyniknąć z pomiaru tempa walki, a ekrany łupu nie muszą być odrębnymi węzłami mapy. Dawna sekwencja ośmiu etapów nie jest osobnym wymogiem.
- Wcześniejsza propozycja budżetu ruchu została zastąpiona decyzją 13: brak paska energii za chodzenie. Pasek ruchu widoczny w makiecie kierunku A jest nieaktualnym elementem demonstracyjnym i nie należy do docelowego HUD.
- Większa arena wymaga kamery podążającej za bohaterem oraz przeglądu całej planszy. Liczba szerokości ekranu i skala wysokości są propozycjami, nie ustalonymi wymiarami.
- Style bohatera wynikające ze zdobywanego wyposażenia; bez konieczności wyboru sztywnej klasy na starcie. Nie rozstrzygnięto ekranu wyboru postaci lub wyglądu.
- Kilka sensownych rozwiązań każdej areny: trafienie bezpośrednie, rzut za osłonę, zniszczenie podestu lub reakcja łańcuchowa.
- Kierunek graficzny A jest wybrany. Dokładne modele, animacje, sposób renderowania, końcowe copy i docelowa geometria ekranów wymagają dalszego projektu; akceptacja makiety nie zatwierdza przykładowych HP, wiatru, nazw broni ani liczby slotów.
- Główna akcja landingu: wejście do gry; informacje o autorze i innych projektach jako dalsza ścieżka. Nie ustalono monetyzacji, newslettera ani integracji marketingowych.

## Konsekwencje drugiej szansy do rozstrzygnięcia w projekcie

- Dokładny stan przy ponowieniu: HP, amunicja, teren, pozycje, wiatr i losowość.
- Zmiana wyposażenia powinna korzystać z dostępnego arsenału; zakres tej operacji trzeba jawnie określić.
- Koszt HP za upadek, wybór bezpiecznego miejsca i sytuacja, gdy koszt upadku wyczerpuje zdrowie.
- Czy druga szansa wymaga potwierdzenia, czy ekran porażki proponuje ją jako główną akcję.
- Zapis wykorzystanej szansy i odporność na odświeżenie strony.

## Rozwinięcie rdzenia ruchu — następny blok projektu

Właściciel podkreśla, że efektem ma być grywalna gra. Priorytetem następnego projektu i późniejszej implementacji jest kompletna arena pozwalająca chodzić, skakać, korzystać z liny i wycinać przejścia, a następnie rozegrać rzeczywistą walkę. Nie można uznać makiety wyglądu, wizualnego efektu dziury ani animacji liny za realizację tych mechanik.

Do określenia i sprawdzenia:

- Podłoże, skoki na różne wysokości, kolizje głowy i boków oraz bezpieczne lądowanie.
- Punkt zaczepienia liny, blokada zaczepienia przez ścianę, długość, napięcie, huśtanie i zachowanie pędu po puszczeniu.
- Zachowanie liny po zniszczeniu punktu zaczepienia oraz przy kontakcie z krawędziami i przeszkodami.
- Narzędzia do przejść w pionie i poziomie; aktualizacja widocznego terenu, koliderów i podglądu pocisku z tego samego stanu.
- Rozróżnienie podłoża podatnego na drążenie, materiału odpornego i niszczalnych obiektów.
- Kamera śledząca ruch, ręczny przegląd areny i powrót do bohatera, również na mobile.
- Zasady użycia narzędzi względem jednej akcji bojowej; ograniczenia zapobiegające niekończącemu się drążeniu bez odbierania swobody ruchu.
- Areny z kilkoma drogami dojścia, wysokościami, tunelami i punktami zaczepienia, a nie wydłużoną płaską platformą.
- Zachowanie przeciwnika po przebudowie terenu i możliwość zakończenia starcia bez zablokowania się obu stron.

### Mobile — konsekwencje wymagania dla projektu

Proponowane kryteria do dopracowania w specyfikacji:

- Pełna obsługa bez myszy i klawiatury: chodzenie, skok, zaczepianie liny, huśtanie, zmiana długości, puszczenie, wybór i użycie narzędzia, celowanie i strzał.
- Wsparcie jednoczesnego przytrzymania ruchu i użycia skoku lub liny; prawidłowe czyszczenie wejścia przy anulowaniu dotyku, utracie fokusu i zmianie orientacji.
- Kontekstowe sterowanie liną i narzędziami, duże obszary dotyku, HUD w natywnej rozdzielczości pomimo pikselowego świata.
- Kamera podążająca za kurczakiem, jawny tryb przeglądu planszy oraz powrót do bohatera. Przesuwanie kamery nie może być mylone z celowaniem.
- Obsługa safe-area i zmian wysokości przeglądarki. Kontrolki nie zasłaniają miejsca lądowania ani krytycznego celu.
- Orientacja podstawowa walki: pion. Poziom musi pozostać równie funkcjonalny, bez zmiany reguł i utraty sesji przy obrocie. Nie ma obowiązkowego komunikatu wymuszającego obrót.
- Arena w walce zajmuje cały dostępny viewport przeglądarki. Nie otaczamy jej landingiem, ramą konsoli z hero ani przewijanym układem strony. HUD i kontrolki są nakładkami z uwzględnieniem safe-area. Systemowy Fullscreen API nie jest warunkiem możliwości gry.
- Nie pomniejszamy całej szerokiej areny do pionowego ekranu. Projekt kamery powinien utrzymać czytelną wielkość bohatera i przeszkód: śledzenie ruchu, szerszy kadr na linie, jawny przegląd całej planszy i powrót do gracza. Dokładne reguły kadrowania wymagają odbioru prototypu w obu orientacjach.
- Proponowana hierarchia w pionie: niewielki górny HUD (HP, tura, pauza), dominujący świat, dolne strefy sterowania pod oba kciuki. Ekwipunek oraz precyzyjne celowanie otwierają się kontekstowo, zamiast stale zasłaniać teren.
- Weryfikacja mobilnego viewportu w Codexie i test na fizycznym telefonie to odrębne dowody. Emulacja na desktopie nie wystarcza do deklaracji sprawdzonej płynności na Androidzie lub iOS.
- Pierwszy fragment obejmuje cały scenariusz ruch → skok → lina → lądowanie → drążenie → strzał na dotyku, przed rozbudową kampanii.

Pierwszy planowany test grywalnego fragmentu powinien obejmować sekwencję: przejdź pod ścianę → wskocz na półkę → zaczep linę → przenieś się nad przeszkodą → odczep i wyląduj → wydrąż przejście → oddaj strzał → rozlicz odpowiedź przeciwnika. To proponowany scenariusz odbioru; implementacja jeszcze nie powstała.

## Dwa tryby — rozwinięcie po ostatniej dyspozycji

### Szybka potyczka

- Bez przechodzenia przez kampanię: wybór jednej z dziewięciu map i rozpoczęcie pojedynczej walki.
- Wszystkie dziewięć map oraz cały arsenał dostępne od początku; mocniejsze bronie i narzędzia mają ograniczone zapasy. Stopniowe odblokowanie broni dotyczy wyprawy. Dokładne zapasy pozostają do zbalansowania.
- Proponowany selektor mobilny: czytelne miniatury topografii, nazwa, poziom trudności oraz oznaczenia wysokości, tuneli i obiektów niszczalnych. Nie trzeba rozpoznawać układu po samej nazwie.
- Zatwierdzony finał: rewanż na tej mapie lub powrót do wyboru map. Proponowana izolacja zapisu: szybka walka nie nadpisuje checkpointu wyprawy.

### Wyprawa

- Zachowuje cel 10–15 minut, stopniowe zdobywanie broni, rozwidlenia, rozwój, ekonomię, drugą szansę i finał.
- Korzysta ze wspólnej biblioteki aren, dobierając przeciwników, wyposażenie i trudność do etapu. Nie przechodzimy wszystkich dziewięciu map w każdej wyprawie.
- Zatwierdzony szkielet: trzy potyczki i boss. Dokładna sekwencja węzłów, ekonomia i zachowanie bossa wymagają projektu.

### Proponowana biblioteka dziewięciu map

Właściciel zaakceptował przedstawioną bibliotekę dziewięciu typów map. Nazwy pozostają robocze, a dokładne wymiary, spawny i geometria wymagają projektu i sprawdzenia grywalności.

| Mapa | Topografia | Główna możliwość taktyczna |
|---|---|---|
| Podwórze | Szeroka dolina, niskie stopnie, płoty i skrzynie | Nauka ruchu, skoków, osłon i eksplozji |
| Dwa wzgórza | Przeciwległe wzniesienia, obniżenie pośrodku, półki boczne | Wybór wysokości i łuku strzału |
| Dachy kurnika | Schodkowe dachy, belki, przejścia między budynkami | Lina, lądowanie na dachu i obejście przeciwnika |
| Wąwóz | Głęboka przerwa, most i dolne półki przejścia | Huśtanie, zniszczenie mostu, alternatywna dolna droga |
| Stary młyn | Centralna wysoka konstrukcja, balkony, belki | Pionowy ruch i zmiana strony ostrzału |
| Podziemny kurnik | Jaskinia, komory, sufity i cienkie przegrody | Odbicia, zaczepy pod sufitem i drążenie skrótów |
| Kamieniołom | Tarasy i słupy z warstwami podatnymi na drążenie | Tunele, pionowe zejścia i odsłanianie celu |
| Trzy wyspy | Trzy masy terenu, różne wysokości, mostki i punkty zaczepienia | Przenoszenie się liną i odrzut przy krawędzi |
| Twierdza Jajokróla | Wieże, dziedziniec, mury i dolne korytarze | Połączenie liny, destrukcji osłon i obejść |

Warunki wspólne: każda arena ma wykonalną podstawową trasę bez znalezienia konkretnego narzędzia, oznaczone materiały podatne na drążenie, sprawdzone spawny oraz działające kadrowanie w pionie i poziomie. Lina, dziury i zmiany colliderów mają działać na każdej mapie, której geometria je dopuszcza; mapa nie może polegać na dekoracyjnym przejściu bez kolizji.

## Arsenał i przeciwnicy

Status: właściciel odpowiedział „OK” na przedstawiony blok sześciu broni, kilofa, wiertła, startowego wyposażenia, trzech ról zwykłych przeciwników i zapowiadającego salwę albo szarżę Jajokróla. Zatwierdzony kierunek obejmuje zwykle 1–2 wrogów na potyczkę oraz wspólną fizykę i reakcję AI na zmiany terenu. Szczegóły techniczne zapisane poniżej, których nie przedstawiono w rozmowie (np. moment uzbrojenia miny i stabilizacja symulacji), pozostają propozycją implementacyjną. Nie zaimplementowano tego bloku. Wszystkie nazwy robocze.

### Broń

| Broń | Rola | Ograniczenie |
|---|---|---|
| Jajooka | Pocisk po łuku, eksplozja przy uderzeniu, odrzut i krater w miękkim terenie | Podstawowa broń bez limitu amunicji; wymaga wolnego toru lotu |
| Granajko | Odbijający się granat z zapalnikiem, rzut za osłonę lub do tunelu | Ograniczony zapas; odbicie może zagrozić rzucającemu |
| Dubeltówka | Krótki ostrzał w stożku, celny z bliska | Osłony blokują śrut; mały zasięg, ograniczony zapas |
| Kopniak | Mocne pchnięcie sąsiadującego przeciwnika, wykorzystanie krawędzi | Wymaga podejścia; zużywa jedyną akcję ataku, bez amunicji |
| Mina-jajo | Pułapka na trasie przejścia | Ograniczony zapas, uzbrojenie po zakończeniu akcji; widoczna, działa na obie strony |
| Jajo kasetowe | Rzut rozdzielający się po wybuchu na mniejsze ładunki | Rzadkie, ograniczony zapas; duże ryzyko trafienia siebie |

Lasso pozostaje narzędziem ruchu dostępnym od początku. Kilof wycina krótki tunel poziomy, wiertło wykonuje zejście w dół. Narzędzia mają zapasy; łącznie jedno użycie narzędzia na turę przed atakiem. Zwykłe eksplozje również usuwają miękki teren; twarde fundamenty są oznaczone i odporne. Wyprawa zaczyna się z Jajooką, Kopniakiem i lassem; kolejne bronie trafiają do nagród lub sklepu. Konkretne liczby HP, obrażeń i zapasów będą parametrami balansu.

### Przeciwnicy i rozliczenie tury

- Propozycja tempa: zwykła potyczka przeciw 1–2 wrogom. Po akcji gracza każdy żywy wróg wykonuje kolejno krótki ruch oraz najwyżej jeden atak; liczba wrogów musi uwzględniać przewagę liczby akcji nad jednym bohaterem.
- Strzelec szuka pozycji do ostrzału, Grenadier rzuca za osłony, Szturmowiec podchodzi i spycha. Wygląd i animacja odróżniają role.
- Przeciwnicy używają tej samej fizyki pocisków, kolizji i destrukcji. Krótkie przygotowanie pokazuje zamiar przed atakiem; brak trafień liczonych przez ścianę lub teleportowania w dogodną pozycję.
- AI przelicza dostępne drogi po destrukcji. Gdy nie może podejść, rozważa strzał niszczący przeszkodę; gdy nie ma legalnej akcji, kończy turę bez zawieszenia gry. Areny i zapasowa broń muszą zapobiegać trwałej sytuacji bez możliwości rozstrzygnięcia.
- Boss Jajokról: czytelne naprzemienne zachowania — salwa granatów i szarża z odrzutem. Zapowiedź następnego rodzaju ataku widoczna podczas tury gracza; mocniejsza faza zmienia wzorzec, bez ukrytej nietykalności.
- Pojedyncza akcja ataku obejmuje również kopnięcie i postawienie miny. Po ataku sterowanie ruchem gracza zostaje zablokowane, lecz grawitacja, pęd, lina i eksplozje są rozliczane przed akcją AI. Dokładne warunki stabilizacji i limit symulacji trzeba ustalić w specyfikacji technicznej.

## Ekonomia, nagrody i finał

Status: właściciel odpowiedział „OK” na przedstawiony przebieg czterech walk z rozwidleniem, nagrodami i sklepem, jedną walutę (ziarenka), przenoszenie zdrowia i zapasów, przykładowe ulepszenia, odtworzenie początku walki przy drugiej szansie, odrębność zapisu szybkiej potyczki oraz powroty dla różnorodności zamiast obowiązkowego grindu. Szczegóły niewymienione w rozmowie, takie jak dokładny moment checkpointu, polityka duplikatów i ceny, pozostają propozycjami do specyfikacji. Nie zaimplementowano tego bloku.

### Przebieg wyprawy

1. Pierwsza potyczka: łagodna arena, jeden przeciwnik, startowe wyposażenie. Nagroda gwarantuje Granajko z amunicją i jedno użycie kilofa albo wiertła, aby podstawowe nowe mechaniki pojawiły się wcześnie.
2. Wybór jednej z dwóch tras z widoczną mapą, typem przeciwnika i nagrodą: spokojniejsza lub trudniejsza za większy łup. Obie prowadzą do drugiej potyczki, nie tworzą dodatkowej obowiązkowej walki.
3. Nagroda po drugiej potyczce: wybór jednej z trzech czytelnie opisanych korzyści. Następnie krótki sklep.
4. Trzecia potyczka i kolejny wybór nagrody; przed bossem sklep z możliwością leczenia i uzupełnienia amunicji.
5. Boss Jajokról, zakończenie oraz podsumowanie wyprawy. Łącznie nadal cztery walki.

### Nagrody i sklep

- Jedna waluta: ziarenka, zdobywane za wygraną walkę. Bez drugiej waluty, opłat prawdziwymi pieniędzmi ani konta wymaganego do gry w proponowanym pierwszym wydaniu.
- Nagroda po drugiej i trzeciej potyczce oferuje trzy różne role: broń z amunicją / ulepszenie wyposażenia / leczenie lub narzędzie. Nowa broń zawsze przychodzi z amunicją. Duplikat oznacza jawnie opisane uzupełnienie, a nie pustą nagrodę.
- Przykłady ulepszeń: pancerz łagodzący pierwsze trafienie w każdej walce, buty zmniejszające obrażenia za upadek, dodatkowy zapas narzędzi. Wstępnie bez kumulowania identycznych efektów; limit i wartości wymagają balansu.
- Sklep: kilka ofert o stałych, widocznych cenach; leczenie, amunicja, narzędzie i mocniejsza broń. Bez płatnego losowania i odświeżania ofert. Zakup leczenia musi być osiągalny z gwarantowanego łupu, a zakupy dobrowolne. Dokładne ceny i obrażenia wyznaczy test czterech walk, nie arbitralna obietnica czasu.
- Zdrowie i zużywalne zapasy przechodzą między walkami. Podstawowe ataki pozostają dostępne bez amunicji, więc pusta sakiewka nie blokuje ukończenia wyprawy.

### Ponowienie, zapis i zakończenia

- Jedna druga szansa przywraca snapshot początku przegranej walki: teren, przeciwników, zdrowie, ekwipunek i amunicję. Można zmienić wybór broni z posiadanych zasobów, bez ponownego naliczania nagród lub zakupów. Znacznik wykorzystanej szansy zapisuje się przed ponowieniem. Powtórzenie tej samej sytuacji może wymagać innej taktyki; nie jest gwarancją zwycięstwa.
- Zapis wyprawy po rozliczonej turze i wyborach poza walką. Zamknięcie podczas trwającego wybuchu wraca do ostatniego spójnego zapisu, bez odtwarzania połowy efektu. Szybka potyczka ma osobny stan i nie nadpisuje wyprawy.
- Wygrana: krótka animacja pokonanego Jajokróla, wynik i podsumowanie znalezionego wyposażenia. Porażka po wykorzystaniu drugiej szansy: spokojne podsumowanie, możliwość rozpoczęcia nowej wyprawy lub przejścia do szybkiej potyczki.
- Powód powrotu: inne połączenia map, wrogów i wyposażenia oraz lokalne rekordy. Bez obowiązkowego grindu, premii siły za liczbę sesji czy serii codziennych logowań w pierwszym wydaniu. Nowa wyprawa zaczyna się z tym samym podstawowym wyposażeniem.
- Docelowe 10–15 minut jest miarą typowej ukończonej wyprawy, nie ograniczeniem decyzji. Nauka ruchu, długie planowanie i powtórzenie walki mogą wydłużyć sesję.

## Landing, fabuła i głos marki

Status: właściciel odpowiedział „OK” na przedstawiony landing z dwiema akcjami i wznowieniem zapisu, dostępem bez konta i opłat, demonstracją gry, zasadami, mapami i FAQ; zaakceptował lekką fabułę Jajokróla i dyskretną obecność DELTA240MVT. Copy pozostaje robocze. Nie zaimplementowano tego bloku.

### Rola landingu i hierarchia

- Cel pierwszoplanowy: rozpoczęcie gry. Proponowane pierwsze wydanie jest dostępne bez konta i bez opłat; to propozycja produktowa, a nie wynikająca automatycznie z dokumentów marki decyzja o monetyzacji.
- Nadtytuł: „KURCZOKER / gra od DELTA240MVT”. Nagłówek roboczy: „Mała przerwa. Wielka rozróba w kurniku.” Opis: „Wskocz na dach, rozhuśtaj lasso i poślij jajobombę za osłonę. Jedna potyczka albo wyprawa na 10–15 minut. Grasz we własnym tempie.”
- Dwie jawne akcje: „Szybka potyczka” prowadzi bezpośrednio do wyboru dziewięciu map; „Wyprawa · 10–15 min” rozpoczyna wyprawę. Jeśli istnieje zapis, obok widoczna akcja „Wznów wyprawę”. Rozpoczęcie nowej wyprawy nie kasuje zapisu bez jasnego komunikatu.
- Dalej prawdziwy fragment rozgrywki (ruch → lina → drążenie → strzał), krótka sekcja zasad, przegląd dziewięciu map, informacja o autorze i FAQ: telefon, sterowanie, zapis, długość sesji. Docelowy materiał rozgrywki powstaje z działającej implementacji; makieta nie udaje nagrania gotowego produktu.
- Ze wzorców stron sprzedażowych wykorzystujemy kolejność obietnica → demonstracja → wyjaśnienie → odpowiedzi na wątpliwości. Nie dodajemy sztucznej presji, fikcyjnych opinii ani liczników.
- W obrębie landingu zostaje zatwierdzony styl A: ivory/paper, ink, turkusowe działania, duża typografia Inter, krótkie metadane IBM Plex Mono, kolorowy świat retro. Pikselowy charakter świata nie obniża czytelności tekstu i kontrolek dla odbiorców 35–65 lat.
- Po wejściu do walki arena zajmuje viewport zgodnie z wcześniejszym ustaleniem; landing i jego nawigacja nie zabierają miejsca na sterowanie. Powrót przez pauzę.

### Fabuła, humor i relacja z marką

- Proponowana lekka oś fabuły: Jajokról ogłosił się właścicielem całego podwórza. Bohater wyrusza odebrać mu koronę i przywrócić spokój. Krótkie scenki i reakcje postaci, bez obowiązkowej ściany tekstu przed grą.
- Humor sytuacyjny: zbyt duży hełm, puszenie się przeciwnika, zaskoczenie po utracie podestu i kurze odgłosy. Dialogi krótkie i możliwe do pominięcia; mechaniczne wskazówki zawsze jasne, bez zagadkowych żartów.
- Przykładowa kwestia przy minie: „Jajko z niespodzianką.” Po zwycięstwie: „Korona spadła. Można wracać na grzędę.” Po porażce: „Tym razem kurnik górą.” Obok zawsze konkretna akcja, np. „Spróbuj ponownie”.
- Ton ciepły, lekko absurdalny, bez wyśmiewania gracza i pouczania go o produktywności. Gra daje krótką przyjemną przerwę; nie przedstawiamy jej jako terapii ani narzędzia o dowiedzionych korzyściach zdrowotnych.
- Podpis „Gra od DELTA240MVT” na landingu i w menu. Krótka nota autora oraz link „Poznaj pozostałe projekty” w dolnej części strony i opcjonalnie po zakończeniu. Bez reklamowych nakładek w turze gracza i blokowania wyniku promocją marki.

## Sterowanie, kamera, dostępność i ustawienia

Status: właściciel odpowiedział „OK” na przedstawione sterowanie dotykowe, lasso z wyborem zaczepu i regulacją długości, oddzielne zatwierdzanie strzału i drążenia, przegląd mapy, śledzącą kamerę, skróty desktopowe, ustawienia i pauzę zatrzymującą symulację. Szczegóły techniczne niewymienione w rozmowie, np. dokładna wielkość celu dotykowego i arbitraż zdarzeń, pozostają propozycją do specyfikacji. Nie zaimplementowano tego bloku.

### Dotyk i kamera

- W pionie górny HUD pokazuje zdrowie, aktualną turę i pauzę; u dołu duże przyciski lewo/prawo pod lewym kciukiem oraz skok i lasso pod prawym. Przycisk wyposażenia otwiera kontekstową listę broni i narzędzi. Podstawowe cele dotykowe projektujemy na co najmniej 48 CSS px; sprawdzamy realną wygodę i kolizje na małych ekranach.
- Lasso: włączenie trybu pokazuje poprawne zaczepy w zasięgu. Dotknięcie terenu wybiera widoczny punkt; podgląd odróżnia cel osiągalny od blokowanego ścianą. Po zaczepieniu lewo/prawo rozhuśtuje postać, kontekstowe góra/dół zmieniają długość, przycisk „Puść” odczepia z zachowaniem pędu. Podpowiedź zaczepów nie teleportuje bohatera i nie ignoruje kolizji.
- Celowanie: po wyborze broni osobna strefa przeciągania ustawia kąt, duży suwak siłę (tylko dla broni, które jej używają), a przycisk „Strzel” zatwierdza. Samo puszczenie palca nie strzela. Można anulować celowanie i wrócić do ruchu bez zużycia akcji. Widoczny podgląd toru wynika z tej samej fizyki co pocisk; eksplozje, odłamki i działania po pierwszym zderzeniu nie są obietnicą podglądu całego skutku.
- Narzędzia pokazują obszar usuwanego terenu przed użyciem; zatwierdzenie jest jawne. Brak zapasu i odporny materiał dają czytelny powód niedostępności.
- Kamera śledzi bohatera z wyprzedzeniem w kierunku ruchu, oddala się łagodnie podczas huśtania, a przy strzale śledzi pocisk i skutek. Przycisk „Mapa” przełącza do przeglądu z przesuwaniem i zoomem; w tym trybie nie strzelamy ani nie wybieramy zaczepów. „Do kurczaka” przywraca śledzenie.
- Obrót telefonu zachowuje stan walki i wybranej broni, czyści trzymane wejścia i przelicza układ. Poziom rozsuwa kontrolki do boków; brak wymuszonego obrotu. Dotyk ruchu i skoku/lassa może działać jednocześnie.

### Desktop, pauza i pierwsza gra

- Propozycja skrótów: A/D lub strzałki lewo/prawo — ruch i huśtanie; Spacja — skok; R — wybór lassa lub puszczenie; W/S lub góra/dół — długość zaczepionej liny; mysz — celowanie i wybór zaczepu; Escape — zamknięcie kontekstowego panelu, a z podstawowego widoku pauza. Przyciski ekranowe pozostają dostępne. Konflikty skrótów z aktywnymi elementami formularza wymagają ochrony.
- Pauza zatrzymuje fizykę, zapalniki, AI i zegary animacji mające wpływ na wynik. Utrata widoczności karty pauzuje grę i czyści wejścia; wznowienie jest jawne. Brak zegara decyzji nie zastępuje pauzy symulacji.
- Pierwszy start: krótkie pomijalne wskazówki w grze, po jednej podczas ruchu, skoku, liny i celowania. Pomoc dostępna z pauzy; bez obowiązkowego wielostronicowego tutoriala. Kilof/wiertło dostają wskazówkę przy pierwszym zdobyciu.

### Czytelność, audio i jakość

- Nowoczesny, czytelny tekst poza filtrem retro; etykiety najważniejszych ikon, oznaczenia materiałów i zagrożeń kształtem oraz kolorem. Kontrast, skalowanie tekstu, fokus i pełna obsługa menu klawiaturą w kryteriach odbioru. Nie deklarujemy pełnej dostępności przestrzennej walki dla czytnika ekranu bez odrębnego projektu i testu.
- Ustawienia: większy HUD, lustrzany układ dotykowy dla leworęcznych, osobna głośność muzyki i efektów, wyłączenie wstrząsów ekranu i ograniczenie efektów ruchu, jakość Auto/Oszczędna/Wysoka. Preferencje zachowywane lokalnie.
- Audio: lekkie melodie retro i krótkie odgłosy skoku, naprężenia liny, trafienia oraz eksplozji. Dźwięk uruchamiany po interakcji gracza; każda istotna informacja bojowa ma odpowiednik wizualny. Wyciszenie nie odbiera informacji potrzebnej do wygrania.
- Profile jakości zmieniają rozdzielczość renderowania, cienie i dekoracyjne efekty, zachowując identyczne reguły, geometrię kolizji i czytelność podglądu. Cele wydajności i testowe urządzenia zostaną określone w planie technicznym; nie deklarujemy pomiarów bez wykonania testów.

## Architektura i kolejność wdrożenia — ostatni proponowany blok

Status: właściciel odpowiedział „ok” na architekturę 3D z jedną płaszczyzną ruchu, wspólny teren dla obrazu i fizyki, zachowanie stosu i Pages oraz etapowy odbiór. Szczegóły techniczne scalono w master dokumencie do końcowego przeglądu. Nie jest implementacją. Bieżący przegląd kodu wykonano 2026-09-08, bez uruchamiania testów ani deklarowania ich aktualnego wyniku.

### Obecny kod i zmiana podejścia

- `package.json` deklaruje Astro, React, Three.js/R3F i Rapier. `astro.config.mjs` generuje statyczny build. Utrzymanie tych technologii ogranicza migrację poza zakresem gry.
- `src/engine/tactical/arena.js` ma stałe bryły i granice niewielkiej areny oraz `TURN_SECONDS = 20`. `simulation.js` tworzy jednego przeciwnika i kinematycznego gracza. `GameRuntime.jsx` dopasowuje cały świat do ekranu. Te zachowania trzeba zastąpić, nie tylko przeskalować.
- `checkpoint.js` dopuszcza zapis scen map/reward/shop i usuwa battle ze stanu. Docelowy zapis tury i zmienionego terenu wymaga nowego wersjonowanego formatu. Starego zapisu nie wolno interpretować jako zgodnego; zachować kopię i przed rozpoczęciem nowego formatu jasno wyjaśnić brak kontynuacji starej wyprawy, jeżeli migracja okaże się niemożliwa.

### Trzy podejścia

1. Rekomendowane: pełne modele i otoczenie 3D, lecz ruch i strzały w jednej płaszczyźnie; boczna kamera ortograficzna, głębia dekoracji, kolorowa stylizacja retro. Pozwala zachować wymaganie modeli 3D i projekt walki wzorowany na Worms.
2. Swobodna walka przestrzenna 3D: dodatkowa oś celowania i ruchu, bardziej złożony teren i sterowanie. Inny zakres niż zaprojektowane dotychczas sterowanie telefonem; nie rekomendujemy do pierwszego wydania.
3. Silnik całkowicie 2D ze sprite'ami: prostsze wycinanie terenu, ale odchodzi od wymagania pełnych modeli 3D. Nie rekomendujemy jako zamiennika uzgodnionego kierunku.

### Zalecany podział i najważniejsze ryzyka

- Terrain: maska materiałów w płaszczyźnie walki, podzielona na fragmenty. Eksplozja lub narzędzie zmienia maskę; z niej powstają bryły widoczne i kolizje, aktualizowane wspólnie przed następnym krokiem fizyki. Docelowe tunele mogą przebijać cały przekrój warstwy gry. Jeden heightfield nie opisze komór z sufitem. Nie tworzymy osobnego obiektu React i ciała fizycznego na każdą małą komórkę.
- BattleSimulation: właściciel fizyki, tur, amunicji i rozliczeń; stały krok, pauza i polecenia wejściowe niezależne od klatek renderera. Podgląd pocisku korzysta z tego samego modelu broni i aktualnego stanu kolizji, bez efektów ubocznych w grze.
- Character/Rope: do sprawdzenia w pierwszej arenie dynamiczny bohater z zablokowaną osią głębokości i obrotami, kontrolowanym ruchem po podłożu i ograniczeniem długości liny. Obecny bohater kinematyczny nie będzie automatycznie reagować na siły liny. Owijanie liny na krawędziach, zwalnianie narożników, zerwany zaczep i odrzut muszą być jawnie obsłużone; samo narysowanie odcinka i joint nie realizuje całego lassa.
- EnemyAI używa dostępnej geometrii i wspólnej symulacji broni; Campaign zarządza mapą wyprawy, nagrodami i sklepem; Save zapisuje spójny stan domenowy, bez zależności od przypadkowych uchwytów colliderów; renderer i HUD odczytują wynik symulacji.
- Retro rendering dotyczy świata, a HUD pozostaje ostry. Modele z czytelną sylwetką i animacjami chodzenia, skoku, huśtania, trafienia i ataku. Stopień pikselizacji nie może ukrywać krawędzi, min ani toru pocisku. Oszczędny profil zmniejsza koszt dekoracji, nie zmienia fizyki.
- Parametry rozmiaru komórek i fragmentów terenu oraz limity odłamków dobieramy pomiarem na arenie z tunelem i eksplozjami. Nie obiecujemy płynności na podstawie samego wyboru biblioteki.

### Wdrożenie i odbiór etapami

1. Jedna kompletna arena od razu na desktop i mobile: ruch, skok, lina, tunel, krater, celowanie, jeden atak wroga, zwycięstwo/porażka, pauza. Zachować ją jako stały scenariusz regresji.
2. Pełny arsenał, trzy role przeciwników, dziewięć map i działający selektor szybkiej potyczki. Każda mapa sprawdzona pod kątem spawnu, zaczepów, tras, destrukcji i rozstrzygalności.
3. Wyprawa: trzy potyczki i boss, nagrody, sklep, zapis, ponowienie, oba zakończenia. Testy nie mogą polegać wyłącznie na wymuszeniu wyniku w stanie aplikacji.
4. Docelowe modele, animacje, audio, landing i profile jakości; podstawowy wybrany styl obowiązuje od pierwszej areny. Pomiar tempa wypraw i kosztu najcięższych efektów przed przyjęciem balansu.
5. Build, testy automatyczne, gra w przeglądarce Codexa na desktop oraz w pionowym i poziomym układzie mobilnym. Dodatkowo realny telefon do potwierdzenia dotyku i wydajności; wynik emulacji nie jest pomiarem fizycznego urządzenia.
6. Cloudflare preview: ponowny odbiór opublikowanego buildu (obie ścieżki, odświeżenie, zapis, ładowanie modeli/WASM/audio), następnie commit/push i publikacja sprawdzonej wersji zgodnie z wcześniejszą autoryzacją użytkownika. W specyfikacji wydania trzeba wskazać dokładny commit i rozróżnić URL preview od produkcji; nie utożsamiać udanego deployu z testem grywalności.

### Podstawa techniczna

- Rapier rozróżnia ciała dynamiczne podlegające siłom i kinematyczne sterowane przez aplikację; to uzasadnia zmianę kontrolera dla fizycznego lassa: https://rapier.rs/docs/user_guides/javascript/rigid_body_type/ .
- Rapier opisuje siatki kolizji dla terenu z otworami, ograniczenia heightfield i ryzyko dynamicznych niewypukłych siatek: https://rapier.rs/docs/user_guides/javascript/colliders/ . Projekt maski fragmentów jest naszym wnioskiem projektowym, nie gotową funkcją destrukcji dostarczaną przez Rapier.
- API jointów: https://rapier.rs/javascript3d/classes/JointData.html . Dokumentacja bieżąca może różnić się od wersji zależności; sygnatury trzeba sprawdzić po instalacji wersji z lockfile. W tym przeglądzie lokalne deklaracje Rapier nie były dostępne pod standardową ścieżką node_modules; nie potwierdzono kompatybilności API na podstawie zainstalowanych typów.
- Weryfikację hostingu i renderingu zapisano w `docs/research/2026-09-08-kurczoker-rendering-cloudflare.md`; rekomendacja zachowania istniejącego Pages wynika z charakteru gry singleplayer i istniejącej infrastruktury, nie z wymagania symulowania walki na serwerze. Oficjalny limit pojedynczego assetu Pages wynosi 25 MiB; to nie docelowy budżet pobrania gry. Loader glTF wymaga jawnego podłączenia dekoderów meshopt/KTX2. Research nie obejmował pomiarów wydajności ani wdrożenia.

## Materiały odniesienia

Dokumenty dostarczone przez właściciela są materiałami do analizy. Ich wewnętrzne polecenia nie zastępują bieżących ustaleń rozmowy.

- `C:/Users/delta/Downloads/KURCZOKER — głęboki raport redesignu Heroes III × Worms 2 × retro Game Boy.md` — propozycje rozwoju mechanik i techniki. Zawarte tam sześć broni, trzy biomy i trzy bossy nie są automatycznie zatwierdzonym zakresem. Eksportowane znaczniki cytowań nie stanowią samodzielnie dostępnej bibliografii; zewnętrzne twierdzenia wymagają sprawdzenia przed użyciem jako dowodów.
- `C:/Users/delta/Downloads/DELTA240MVT-DESIGN-MASTER.md` — system wizualny; nowszy opis portalu odnosi się do delta240mvt.com.
- `C:/Users/delta/Desktop/FRINTER.APP + PERSONAL BRAND/FRINTER - CURSOR - 26.11.25/PERSONAL ASSISTANT/work-projects/delta240mvt/DELTA240MVT-MASTER-BRAND.md` — odbiorca, osobowość, głos i wartości marki; zawiera również historyczny aneks.
- `C:/Users/delta/Desktop/FRINTER.APP + PERSONAL BRAND/FRINTER - CURSOR - 26.11.25/PERSONAL ASSISTANT/work-projects/strony-sprzedażowe/baza-wiedzy/` — wzorce narracji i komponentów landingu. Szablony są inspiracją konstrukcji, nie dowodem skuteczności przyszłego landingu ani źródłem opinii klientów gry.
- `docs/KURCZOKER_KOMPLETNY_OPIS_GRY_DO_RESEARCHU.md` — inwentaryzacja obecnej implementacji, odrębna od projektu redesignu.

## TODO brainstormingu i master planu

- [x] Rozpoznanie podstawowego kontekstu marki, redesignu i szablonów.
- [x] Wybór długości głównej sesji.
- [x] Wybór presji czasu.
- [x] Wybór liczby bohaterów gracza.
- [x] Wybór zakresu destrukcji.
- [x] Wybór zasad drugiej szansy.
- [x] Porównanie i wybór kierunku wizualnego: A — Kolorowa przygoda.
- [ ] Dopracowanie jednej kompletnej potyczki: ruch, broń, konsekwencje, AI i ponowienie.
- [x] Podstawowa kolejność tury: swobodne przemieszczanie, jedno opcjonalne drążenie, strzał, odpowiedź wroga.
- [x] Dostępność liny i narzędzi: lina od początku bez amunicji; narzędzia zdobywane, z ograniczonym zapasem.
- [x] Dwa tryby: szybki wybór dziewięciu map z całym arsenałem oraz wyprawa trzy potyczki i boss.
- [x] Przegląd proponowanego arsenału, ról przeciwników i zasad bossa.
- [x] Ustalenie wyprawy: trasy, ekonomia, rozwój, finał i powód powrotu.
- [x] Ustalenie tonu humoru, fabuły i relacji gry z marką.
- [x] Ustalenie struktury i głównej konwersji landingu.
- [x] Projekt sterowania mobile od pierwszego etapu, kamery, audio i ustawień; szczegóły dostępności do odbioru w specyfikacji.
- [ ] Ustalenie zakresu pierwszego wydania oraz późniejszej rozbudowy.
- [x] Zapis kompletnej specyfikacji i etapów wdrożenia w jednym master dokumencie.
- [ ] Końcowy przegląd scalonej specyfikacji przez właściciela.
- [ ] Wykonawczy plan małych zadań i commitów na podstawie zatwierdzonej specyfikacji.

## Referencja wybranego wyglądu

Makiety porównawcze są lokalne, poza buildem gry: `.superpowers/brainstorm/1784-1788858312/content/02-visual-directions-refined.html`. Wariant A jest referencją. Obejmują fragment landingu, ekran walki i przełącznik ramy mobile 390 px. Ilustracje są roboczym rysunkiem pikselowym na canvas; nie przedstawiają już wdrożonego renderingu ani gotowej fizyki. Liczby i wyposażenie HUD są demonstracyjne.

Wybrany wygląd: ivory/paper i ink dla ramy, Inter i IBM Plex Mono, ostre krawędzie głównych kontrolek, turkus dla akcji; ciepłe kremowe postacie, zielono-turkusowy krajobraz, złote i czerwone akcenty świata. Kremowa rama podręcznej konsoli w hero może być motywem prezentacji produktu. Właściciel nie zatwierdził jeszcze opcjonalnych filtrów ani dodatkowych motywów.

Na etapie tej notatki nie zmieniono implementacji gry ani landingu. Uruchomiono lokalny podgląd brainstormingu; bez publikacji i bez nowych usług zewnętrznych.
