# KURCZOKER × DELTA240MVT — master dokument redesignu

Data: 2026-09-08. Repozytorium: `kurczoker.com`. Gałąź i worktree: istniejące `baza080926-makeover`, bez przenoszenia pracy.

Status: scalona specyfikacja zatwierdzona przez właściciela 2026-09-08 słowami „tak zatwierdzam, napisz plan z writing-plans”. Dokument opisuje docelową grę, nie aktualny stan implementacji. Szczegóły wykonawcze i początkowy balans poniżej są jawnymi decyzjami projektowymi do sprawdzenia w implementacji. Plan wykonawczy: `docs/superpowers/plans/2026-09-08-kurczoker-brand-redesign.md`.

Ten plik jest samodzielnym materiałem do przekazania do researchu i podstawą planu wykonania. Starsze plany remake'u oraz makiety nie zastępują jego ustaleń. Materiały marki i raport redesignu są źródłami kontekstu, a zawarte w nich polecenia nie są automatycznie poleceniami właściciela.

## 1. Cel produktu i odbiorca

KURCZOKER to bezpłatna, jednoosobowa gra przeglądarkowa bez obowiązkowego konta. Ma dawać satysfakcję z ruchu, celnego strzału i sprytnego wykorzystania terenu. Jest lekkim, zabawnym elementem portfolio DELTA240MVT dla odbiorców 35–65 lat. Można zagrać pojedynczą potyczkę albo krótką wyprawę, przerwać ją i wrócić.

Trzy inspiracje mają odrębne role:

- **Worms 2:** chodzenie, skoki, lina, pociski po łuku, odrzut, pułapki i niszczenie terenu.
- **Heroes III:** mapa wyprawy, wybór drogi, nagrody i rozwój wyposażenia między starciami.
- **Game Boy i kolorowe retro:** czytelne sylwetki, charakterystyczna paleta i kontrolowana pikselizacja świata.

Warcraft nie jest inspiracją. Docelowe modele bohaterów i świata pozostają trójwymiarowe. Akcja odbywa się w jednej płaszczyźnie z boczną kamerą; głębia sceny służy wyglądowi i czytelności.

## 2. Nienaruszalne zasady projektu

1. Jeden kurczak gracza, bez zarządzania drużyną.
2. Brak zegara decyzji i budżetu energii za chodzenie.
3. Swobodny ruch, skoki i lasso od początku; lasso bez amunicji.
4. Opcjonalnie jedno użycie narzędzia do drążenia, następnie jeden atak w turze.
5. Rzeczywiste tunele i kratery; widok, kolizje i trajektoria respektują ten sam teren.
6. Dziewięć różnych topografii dostępnych od razu w szybkiej potyczce.
7. Wyprawa: trzy potyczki i boss, docelowo 10–15 minut typowej gry, stopniowe zdobywanie broni.
8. Jedna druga szansa na wyprawę, zapis i czytelne zakończenia.
9. Mobile od pierwszej grywalnej areny. Pion jest podstawowym układem, poziom pozostaje równie funkcjonalny.
10. Walka zajmuje cały dostępny viewport. Kontrolki i HUD są nakładkami; nie ma otaczającego walkę landingu ani obowiązku obrotu telefonu.
11. Wybrany kierunek wizualny A: jasny interfejs marki i ciepły, kolorowy świat retro.
12. Odbiór wymaga rozegrania gry, nie samego sprawdzenia builda albo makiety.

## 3. Ekrany, adresy i ścieżki gracza

Zachowujemy istniejące adresy `/` (landing), `/gra` (aplikacja gry) i `/polityka-prywatnosci`. Stany gry są obsługiwane w aplikacji. Parametr `mode=quick` lub `mode=expedition` może określać wejście z landingu; jest wskazówką nawigacji, nie źródłem zapisu ani wyniku.

| Ekran | Zawartość | Dalsza droga |
|---|---|---|
| Landing | Obietnica, demonstracja, dwa tryby, wznowienie, mapy, autor, FAQ | Szybka potyczka / wyprawa / wznowienie |
| Menu gry | Dwa tryby, zapis, pomoc i ustawienia | Selektor map albo mapa wyprawy |
| Selektor szybkiej potyczki | Dziewięć miniatur topografii, opis trudności, wyposażenie | Wybrana arena |
| Mapa wyprawy | Aktualne miejsce, dostępne trasy, zdrowie, zapasy i waluta | Walka / nagroda / sklep / boss |
| Walka | Świat, HUD, sterowanie, ekwipunek, przegląd areny | Nagroda, wynik albo druga szansa |
| Nagroda | Jasno opisane korzyści i wybór | Mapa lub sklep |
| Sklep | Ceny, stan waluty, efekty zakupu | Kolejna walka |
| Pauza | Wznów, ustawienia, pomoc, wyjście | Powrót bez utraty rozliczonego postępu |
| Wynik | Zwycięstwo/porażka, wyposażenie i statystyki | Rewanż, nowa wyprawa lub wybór map |

Szybka potyczka nigdy nie nadpisuje wyprawy. Przy istniejącym zapisie główną akcją wyprawy jest wznowienie; rozpoczęcie nowej wymaga czytelnego potwierdzenia zastąpienia postępu. Odświeżenie strony odtwarza spójny zapis, nie arbitralny ekran wybrany z URL.

## 4. Szybka potyczka

Wybór mapy prowadzi bezpośrednio do pojedynczej walki. Wszystkie mapy i sześć broni są dostępne od startu. Gracz może wybrać aktywną broń; nie musi przechodzić kreatora zestawu, aby rozpocząć. Limitowane bronie i narzędzia dostają standardowy zapas.

Selektor pokazuje prawdziwy przekrój topografii, a nie dziewięć podobnych ilustracji. Każda karta zawiera nazwę, cechę mapy i opis wymagających elementów, np. przepaści lub ciasne tunele. Rekomendowany pierwszy wybór to Podwórze. Na telefonie karty pozostają czytelne i przewijalne.

Po starciu dostępne są rewanż na tej samej mapie oraz powrót do wyboru map. Rewanż odtwarza bazowy teren, pozycje i zapasy. Nie ma limitu ponowień tego trybu. W odróżnieniu od wyprawy wynik potyczki nie zmienia kampanijnej ekonomii.

## 5. Biblioteka dziewięciu map

Nazwy są roboczym nazewnictwem produktu. Każdy typ ma własną geometrię, punkty zaczepienia i co najmniej dwie sensowne możliwości taktyczne. Rozmiary startowe w tabeli podano w jednostkach świata dla bohatera wysokiego około 1,1 jednostki; to parametry prototypu, nie obietnica konkretnego rozmiaru na ekranie.

| ID i mapa | Rozmiar startowy | Teren i trasy | Szczególny odbiór |
|---|---|---|---|
| `yard` — Podwórze | 48 × 18 | Dolina, niskie stopnie, płoty, skrzynie; przejście dołem lub górą | Pierwszy skok, zaczep, krater i łatwy dostęp do wroga |
| `hills` — Dwa wzgórza | 64 × 24 | Dwa zbocza, środkowe obniżenie, półki; ostrzał z góry albo podejście | Strzał z obu wysokości, lądowanie w dolinie |
| `roofs` — Dachy kurnika | 60 × 24 | Schodkowe dachy i belki; przejście ulicą lub dachami | Lina między budynkami, zniszczenie osłony na dachu |
| `ravine` — Wąwóz | 56 × 30 | Przepaść, most i dolne półki; górna i dolna przeprawa | Zniszczenie mostu nie usuwa wszystkich dostępnych dróg |
| `mill` — Stary młyn | 48 × 36 | Wysoka konstrukcja, balkony, belki i boczne przejścia | Kamera pionowa, zmiana strony ostrzału, powrót z wysokości |
| `caves` — Podziemny kurnik | 64 × 24 | Komory, sufity i cienkie przegrody; korytarze i skróty | Zaczep pod sufitem, rykoszet granatu i tunel przez ścianę |
| `quarry` — Kamieniołom | 64 × 28 | Tarasy, słupy i drążone warstwy; zejście schodami lub wiertłem | Aktualizacja kolizji po wielu sąsiadujących wybuchach |
| `islands` — Trzy wyspy | 72 × 26 | Trzy masy gruntu, mostki i zaczepy; różne wysokości | Przelot liną, odrzut przy brzegu i bezpieczny powrót po upadku |
| `fortress` — Twierdza Jajokróla | 64 × 32 | Wieże, dziedziniec, mury i dolne korytarze | Boss ma dostępne pozycje ataku po destrukcji osłon |

Każda arena ma materiały podatne na drążenie i oznaczone odporne fundamenty. Początkowe trasy są wykonalne bez znalezienia konkretnego limitowanego narzędzia; gracz ma lasso i podstawową broń. Spawny nie nakładają się na teren, miny ani siebie. Najmniejszy użytkowy tunel mieści collider bohatera z marginesem. Dekoracyjne tło nie jest niewidzialną ścianą ani fałszywym zaczepem.

W wyprawie korzystamy z tej samej biblioteki, dobierając przeciwników i trudność do etapu. Nie trzeba przejść dziewięciu aren w jednej sesji. Pierwsza walka wybiera łatwy wariant; finał odbywa się w Twierdzy.

## 6. Przebieg pojedynczej tury

Fazy: **decyzja gracza → rozliczenie ataku → kolejne akcje wrogów → rozliczenie skutków → nowa tura lub wynik**.

Podczas decyzji gracz chodzi, skacze i korzysta z lassa bez kosztu energii i bez zegara. Może raz użyć kilofa lub wiertła, jeśli ma zapas. Może dalej zmienić pozycję, wybrać broń i wykonać jeden atak. Kopnięcie i postawienie miny też są atakami. Dostępna jest jawna akcja „Zakończ turę” bez strzału.

Celowanie i podgląd narzędzia można anulować bez kosztu. Zapasy są pobierane raz, dopiero przy zatwierdzeniu prawidłowej akcji. Powtórzony event dotyku, kliknięcia lub wznowienia nie może powielić ataku.

Po ataku sterowanie ruchem gracza jest wyłączone, lecz pęd, grawitacja, naprężenie liny i wybuchy nadal działają. Po rozliczeniu aktywnego pocisku i krótkich reakcji łańcuchowych wrogowie odpowiadają kolejno. Nie czekamy na idealny bezruch wiszącej na linie postaci. Nieuzbrojona jeszcze mina kończy swoje uzbrajanie, a później pozostaje elementem areny; jej obecność nie blokuje końca tury.

Przed kolejną decyzją gracza zapisujemy pełny stan, w tym niezerowe prędkości i stan liny, jeśli nadal ma znaczenie. Cele fizyczne i wizualne efekty dekoracyjne są rozdzielone: wygasający dym nie zatrzymuje tury. Zwycięstwo następuje po rozliczeniu obrażeń, gdy wszyscy przeciwnicy nie żyją i bohater żyje. Jednoczesna śmierć bohatera i ostatniego wroga jest porażką, z dostępną drugą szansą w wyprawie.

## 7. Ruch, skoki i lasso

Ruch musi być przewidywalny na płaskim gruncie, po zboczu, przy ścianie i na krawędzi. Wymagane są kolizje stóp, boków i głowy, wykrywanie lądowania oraz brak przypadkowego przeskakiwania przez cienkie ściany. Krótka tolerancja naciśnięcia skoku przy krawędzi może poprawiać obsługę; nie wprowadza dodatkowego skoku w powietrzu.

Lasso obejmuje: wybór widocznego punktu w zasięgu, zaczepienie, naprężenie, huśtanie, zmianę długości, kontakt z narożnikami oraz puszczenie z zachowaniem pędu. Nie zaczepia przez ścianę ani o dekorację tła. Początkowo można celować ręcznie, a podświetlone poprawne zaczepy są pomocą, nie teleportacją.

Lina respektuje przeszkody przez punkty prowadzenia na narożnikach; punkty są dodawane i zwalniane po zmianie widoczności odcinka. Długość dotyczy całej trasy liny, nie tylko odległości od pierwotnego zaczepu. Przebudowa terenu ponownie sprawdza zaczep i punkty prowadzenia. Zniknięcie zaczepu odczepia bohatera, zachowując jego aktualną prędkość.

Poza granicą areny bohater traci część zdrowia i wraca do najbliższego sprawdzonego bezpiecznego miejsca. Punkt jest ponownie weryfikowany po destrukcji: wolna przestrzeń, stabilna podstawa, brak aktywnej pułapki. Jeśli ostatnia półka zniknęła, wykorzystujemy bezpieczny odporny obszar mapy. Koszt może doprowadzić do porażki. Wrogowie podlegają tej samej zasadzie kosztu upadku i walidacji miejsca powrotu.

## 8. Broń, narzędzia i trafienia

| Broń | Mechanika | Zapas |
|---|---|---|
| Jajooka | Pocisk balistyczny, wybuch przy trafieniu, krater w miękkim terenie i odrzut | Bez limitu |
| Granajko | Rzut odbijającym się granatem; wybuch po zapalniku | Limitowany |
| Dubeltówka | Krótki stożek śrutu, blokowany przez teren; silna z bliska | Limitowany |
| Kopniak | Bezpośredni kontakt i mocny odrzut, wykorzystanie krawędzi | Bez limitu |
| Mina-jajo | Widoczna pułapka, uzbraja się po postawieniu; zagraża obu stronom | Limitowany |
| Jajo kasetowe | Ładunek rozpadający się na ograniczoną liczbę mniejszych bomb | Rzadki, limitowany |

Kilof usuwa krótki obszar w poziomie, wiertło w dół. Łącznie jedno użycie narzędzia na turę, przed atakiem. Narzędzia pokazują przewidywany obszar usunięcia i przyczynę odmowy, jeśli materiał jest odporny lub zapas wyczerpany.

Podgląd lotu i rzeczywisty pocisk korzystają z tych samych parametrów broni, grawitacji, startowej pozycji i kolizji. Podgląd kończy się na pierwszym zderzeniu; nie obiecuje dokładnego końca wszystkich odbić, odłamków i reakcji łańcuchowych. Pociski mogą lecieć w lewo, prawo i w dół do dostępnego celu; stary limit kąta 10–80° nie może blokować walki w jaskini.

Eksplozje mogą zranić strzelającego. Teren osłania przed obrażeniami i odrzutem zgodnie z raycastem do collidera postaci przed wycięciem tego wybuchu; następny wybuch widzi już nową geometrię. Jeden wybuch nalicza obrażenia raz na postać. Pozwala to odsłaniać cele kolejnymi atakami bez tajnego przenikania przez ściany.

Twardy fundament jest odporny na drążenie i krater, lecz nie jest niewidzialną barierą. Skrzynie, płoty, mostki i wskazane platformy można zniszczyć. Odłamki dekoracyjne mają ograniczony czas życia i liczbę; nie każdy odłamek tworzy collider. Zawieszony fragment gruntu może pozostać statyczny w stylistyce gry; pierwsze wydanie nie obiecuje pełnej symulacji zawalania całej geologii.

## 9. Startowe wartości balansu do testów

Poniższe liczby nie pochodzą z zatwierdzonej makiety. Są punktem startowym dla jednej areny i czterech walk wyprawy; można je zmieniać na podstawie pomiarów bez zmiany zasad produktu. Wspólna konfiguracja zawiera HP, obrażenia, promienie, siły odrzutu, amunicję, zapalniki i ceny.

| Parametr | Wartość startowa |
|---|---|
| Bohater | 100 HP |
| Zwykły wróg | 45 HP; trudniejszy wariant 60 HP |
| Jajokról | 140 HP; bez dodatkowej fali wrogów w pierwszym wydaniu |
| Jajooka | Do 30 obrażeń od wybuchu, malejąco z odległością |
| Granajko | Do 35 obrażeń, zapalnik 2,5 s |
| Dubeltówka | Do 40 łącznie za cały strzał, spadek ze zasięgiem |
| Kopniak | 10 obrażeń, większy odrzut niż podstawowy pocisk |
| Mina-jajo | Do 35 obrażeń, uzbrojenie po 0,8 s czasu symulacji |
| Jajo kasetowe | 5 odłamków do 12 obrażeń każdy; suma wymaga kontroli skupienia trafień |
| Upadek poza arenę | 20% maksymalnego HP postaci za jedno zdarzenie |
| Zapas szybkiej potyczki | 3 granaty, 3 strzały dubeltówki, 2 miny, 1 kasetowe, 2 kilofy, 2 wiertła |
| Nagroda za potyczkę wyprawy | 30 ziarenek; trudniejsza droga +15 |
| Sklep | Leczenie 30 HP: 20 ziarenek; pakiet amunicji: 20; narzędzie: 20; nowa broń z zapasem: 40 |

Zwykły przeciwnik ma być pokonywany kilkoma sensownymi trafieniami; odrzut i teren mogą przyspieszyć wynik. Pomiar ma sprawdzić, czy dwaj wrogowie nie uzyskują zbyt dużej przewagi liczby akcji. Bez zegara nie można zagwarantować zakończenia każdej wyprawy w kwadrans. Wiatr nie jest częścią pierwszego wydania: wcześniejszy przykładowy wskaźnik w makiecie nie zatwierdza tej mechaniki.

## 10. Przeciwnicy i boss

Zwykła walka zawiera 1–2 wrogów. Każdy żywy wróg wykonuje po turze gracza krótki ruch i najwyżej jeden atak. AI używa tych samych ograniczeń ruchu, kolizji, pocisków i obrażeń; różnią je intencje, wyposażenie i parametry trudności.

- **Strzelec:** szuka widocznego celu i pozycji do ostrzału.
- **Grenadier:** wybiera rzut nad osłoną albo do komory.
- **Szturmowiec:** skraca dystans, podchodzi i spycha.

AI nie musi używać lassa w pierwszym wydaniu; ma jawnie określony zakres chodzenia i skakania oraz ataki pozwalające niszczyć przeszkody. Po destrukcji aktualizuje dostępne trasy. Jeśli dojście nie istnieje, rozważa strzał otwierający drogę. Gdy nie ma legalnej akcji, kończy turę, zamiast blokować grę. Walidacja map sprawdza, czy taka sytuacja nie jest trwałym impasem dla obu stron.

Przygotowanie ataku jest widoczne: ruch, ustawienie broni, krótka animacja i lot pocisku. Wróg nie teleportuje się do korzystnej pozycji, nie trafia przez nieusuniętą ścianę i nie koryguje pocisku po wystrzeleniu.

Jajokról zapowiada następny rodzaj działania podczas decyzji gracza: **salwa granatów** albo **szarża z odrzutem**. Poniżej połowy HP zmienia rytm salwy, ale nie uzyskuje ukrytej nietykalności. Szarża respektuje teren i może zostać zatrzymana przeszkodą. Jeżeli nie ma przejezdnej trasy, zamiast ruchu przez ścianę wykonuje zapowiedzianą akcję zastępczą dopiero po nowej zapowiedzi. Finał ma czytelny wynik i krótką animację.

## 11. Wyprawa, nagrody i rozwój

Wyprawa ma cztery walki. Widoki łupu i sklepu nie są dodatkowymi potyczkami.

1. Start z Jajooką, Kopniakiem i lassem. Łatwa arena z jednym wrogiem.
2. Pierwsza nagroda gwarantuje Granajko z trzema sztukami amunicji oraz wybór jednego użycia kilofa lub wiertła.
3. Rozwidlenie przed drugą walką: spokojniejsza albo trudniejsza droga, z widoczną topografią, rodzajem wroga i korzyścią.
4. Druga walka, wybór jednej z trzech nagród, następnie sklep.
5. Trzecia walka, wybór nagrody i ostatni sklep.
6. Jajokról w Twierdzy, zakończenie i podsumowanie.

Jedna waluta to ziarenka. Zdrowie i zapasy przechodzą między walkami. Brak automatycznego pełnego leczenia po każdej potyczce nadaje znaczenie nagrodom i sklepowi. Leczenie jest osiągalne z gwarantowanego łupu; zakupy są dobrowolne, a podstawowe ataki nie wymagają amunicji.

Nagrody oferują trzy różne korzyści: broń z zapasem, ulepszenie oraz leczenie lub narzędzie. Nowa broń nigdy nie jest pusta. Duplikat jest jasno opisanym uzupełnieniem amunicji. Przykładowe ulepszenia: pancerz łagodzący pierwsze trafienie w walce, buty zmniejszające koszt upadku, dodatkowy zapas narzędzi. Identyczne ulepszenia nie kumulują się; oferta zastępuje je użytecznym zasobem.

Sklep ma kilka ofert ze stałymi cenami i opisem rezultatu przed zakupem. Zakup i odjęcie waluty są jedną operacją. Nie ma płatnego losowania, drugiej waluty ani odświeżania sklepu za opłatą.

Nowa wyprawa zaczyna się z tym samym podstawowym wyposażeniem. Powodem powrotu są inne połączenia map, wrogów i nagród oraz lokalne rekordy. Pierwsze wydanie nie wymaga grindu, codziennych logowań ani stałych premii siły za liczbę sesji.

## 12. Porażka, druga szansa i zakończenia

Pierwsza porażka wyprawy proponuje przycisk „Druga szansa”. Użycie przywraca stan początku przegranej walki: zdrowie, zapasy, teren, pozycje, przeciwników i stan losowości. Gracz może zmienić aktywną broń i taktykę w ramach posiadanych zasobów. Nie otrzymuje nowej nagrody i nie powtarza wcześniej rozliczonego sklepu.

Wykorzystanie szansy i odtworzony stan zapisujemy razem, zanim gracz odzyska kontrolę. Drugą szansę można odrzucić. Następna porażka kończy wyprawę. Odświeżenie nie przywraca wykorzystanej szansy w normalnym przepływie zapisu; lokalny zapis nie jest zabezpieczeniem przed świadomą edycją danych przez użytkownika.

Po zwycięstwie: animacja utraty korony, krótka kwestia i statystyki przebiegu. Po porażce: spokojne podsumowanie oraz nowa wyprawa lub szybka potyczka. Brak ekranu promocji blokującego wynik. Rekordy są lokalne, bez publicznego rankingu i synchronizacji między urządzeniami.

## 13. Zapis i odporność na błędy

Docelowy zapis obejmuje wersję schematu, wersję danych map, seed i stan generatora, tryb, etap wyprawy, ekwipunek, HP, walutę, nagrodę/sklep, wykorzystaną drugą szansę oraz snapshot początku aktualnej walki. Snapshot bieżącej tury obejmuje materiałową maskę zmian terenu, niszczalne obiekty, miny, postacie, prędkości, stan liny, kolejkę faz i licznik tury.

Checkpoint powstaje przed decyzją gracza oraz po zatwierdzonym wyborze poza walką. Zamknięcie podczas wybuchu odtwarza ostatni spójny checkpoint. Pauza w tej samej otwartej karcie zachowuje dokładny stan pamięci. Wznowienie strony nie wymaga rekonstrukcji połowy eksplozji.

Zapis używa stabilnych identyfikatorów domeny, nie uchwytów colliderów Rapiera. Dane mają limity wielkości, walidację wartości i sumę kontrolną integralności. Dla większych snapshotów terenu preferowane jest IndexedDB z transakcją na stan i znacznik szansy; ustawienia mogą pozostać w localStorage. Zachować poprzedni poprawny checkpoint do odzyskania po nieudanym zapisie.

Brak miejsca lub blokada pamięci wyświetla jasny komunikat o niedostępnym zapisie; nie pokazujemy fałszywego „zapisano”. Uszkodzony zapis nie zawiesza gry i nie jest po cichu kasowany. Stary format zapisujący tylko mapę/nagrodę/sklep pozostaje kopią; jeśli brak bezpiecznej migracji do nowych map, komunikat wyjaśnia konieczność nowej wyprawy. Szybka potyczka ma osobny stan.

## 14. Sterowanie mobilne i kamera

W pionie górny HUD pokazuje HP, turę i pauzę. U dołu lewo/prawo znajduje się pod lewym kciukiem; skok i lasso pod prawym. Ekwipunek otwiera kontekstowy panel. Cele dotykowe mają startowo co najmniej 48 CSS px, etykiety i marginesy od krawędzi urządzenia.

| Akcja | Obsługa |
|---|---|
| Ruch/skok | Jednoczesne trzymanie kierunku i naciśnięcie skoku |
| Lasso | Włącz tryb, wskaż osiągalny punkt terenu |
| Huśtanie | Lewo/prawo, góra/dół do długości, „Puść” do odczepienia |
| Celowanie | Przeciąganie w wydzielonej strefie ustawia kąt; suwak siłę, gdy dotyczy |
| Atak | Jawny przycisk „Strzel” lub odpowiednik broni; puszczenie palca nie atakuje |
| Narzędzie | Podgląd obszaru i osobne zatwierdzenie |
| Przegląd | „Mapa”, przesuwanie i zoom, „Do kurczaka” przywraca śledzenie |

Gest przeglądu mapy nie jest gestem celowania ani wyboru zaczepu. W trybie przeglądu dotknięcie terenu nie wykonuje akcji bojowej. Panel ekwipunku nie przepuszcza kliknięć do świata. Anulowanie dotyku, utrata fokusu i obrót czyszczą wciśnięte kierunki.

Kamera utrzymuje czytelną wielkość bohatera zamiast ściskać całą mapę w pionowym ekranie. Śledzi z łagodnym wyprzedzeniem ruchu, poszerza kadr podczas huśtania i podąża za pociskiem. Po efekcie wraca do właściwej aktywnej postaci. Minimapę/przegląd i oznaczenia celów poza kadrem dobiera się tak, aby gracz mógł zrozumieć położenie wroga bez walki z kamerą.

Poziom rozsuwa kontrolki na boki i zachowuje te same zasady. Obrót nie rozpoczyna walki od nowa ani nie strzela. Układ korzysta z dostępnego viewportu i safe-area; systemowy Fullscreen API jest opcją, nie warunkiem gry. Nie przewijamy dokumentu podczas obsługi areny, ale nie blokujemy przewijania menu i ustawień.

## 15. Desktop, pomoc, dostępność i audio

Desktop: A/D lub strzałki — ruch; Spacja — skok; R — lasso/puszczenie; W/S lub góra/dół — długość liny; mysz — celowanie i wybór zaczepu. Escape zamyka panel kontekstowy, a z podstawowego widoku otwiera pauzę. Skróty nie przechwytują wpisywania w kontrolkach formularza. Menu jest obsługiwalne klawiaturą i ma widoczny fokus.

Pauza zatrzymuje fizykę, AI i zapalniki. Utrata widoczności karty automatycznie pauzuje i czyści wejścia; powrót wymaga jawnego wznowienia. Audio nie odtwarza zaległej serii efektów po wznowieniu.

Pierwszy start pokazuje krótkie, pomijalne wskazówki przy ruchu, skoku, linie i strzale. Narzędzie ma wskazówkę przy pierwszym zdobyciu. Pomoc jest dostępna z pauzy, bez obowiązkowego wielostronicowego samouczka.

Ustawienia: większy HUD, lustrzany układ dotykowy, osobna głośność muzyki i efektów, wyłączenie wstrząsów i ograniczenie ruchu, jakość Auto/Oszczędna/Wysoka. Preferencje są zapamiętywane. Materiały, zagrożenia i role wrogów różnią się kształtem/ikoną oraz kolorem.

Muzyka jest lekka, inspirowana brzmieniem retro. Skok, napięcie liny, trafienie i wybuch mają krótkie odgłosy. Każda istotna informacja audio ma odpowiednik wizualny. Audio uruchamia się po interakcji gracza. Nie deklarujemy pełnej dostępności przestrzennej walki dla czytnika ekranu bez odrębnego projektu i testów.

## 16. Wygląd 3D i system marki

| Warstwa | Kierunek |
|---|---|
| Tło UI | Ivory `#F8F7F3`, paper `#FFFEFA` |
| Tekst i kontury | Ink `#020304` |
| Główne akcje | Turkus `#00D6D8`, ciemny tekst |
| Akcenty | Żółty `#F2E500`, fiolet `#8F5BFF`, ciepłe czerwienie w świecie |
| Typografia | Inter dla tekstu, IBM Plex Mono dla krótkich metadanych |
| Komponenty | Czytelna hierarchia, ostre krawędzie, oszczędne cienie |
| Świat | Kremowe kurczaki, zielono-turkusowa przyroda, drewno, złote detale |

Pełne modele 3D mają czytelne sylwetki i animacje bezruchu, chodzenia, skoku, lotu na linie, lądowania, ataku, trafienia i porażki. Strzelec, Grenadier, Szturmowiec i Jajokról są rozpoznawalni bez odczytywania małej etykiety. Tło z młynem, drzewami i zabudową daje głębię, lecz nie zasłania krawędzi terenu gry.

Retro wynika z palety, formy modeli i kontrolowanej rozdzielczości świata. Interfejs HTML jest renderowany ostro nad sceną. Prosty render w mniejszej rozdzielczości porównujemy z postprocessingiem pikselizacji; wybór wynika z czytelności i pomiaru. Obraz nie może migotać przy powolnym ruchu kamery ani ukrywać min i krawędzi.

Format modeli: glTF/GLB, wspólne materiały i atlasy tam, gdzie to pomaga. Kompresja meshopt i KTX2 wymaga właściwych dekoderów i testu ładowania. Profile jakości ograniczają bufor obrazu, cienie i dekoracyjne efekty; nie zmieniają colliderów, obrażeń, trajektorii ani dostępnych map.

## 17. Landing, fabuła i głos marki

Pierwszy ekran:

> KURCZOKER / gra od DELTA240MVT
>
> **Mała przerwa. Wielka rozróba w kurniku.**
>
> Wskocz na dach, rozhuśtaj lasso i poślij jajobombę za osłonę. Jedna potyczka albo wyprawa na 10–15 minut. Grasz we własnym tempie.

Akcje: „Szybka potyczka”, „Wyprawa · 10–15 min” oraz „Wznów wyprawę”, gdy istnieje zapis. Dalej: prawdziwy fragment rozgrywki, krótkie zasady, przegląd dziewięciu map, autor i FAQ. Demonstracja pokazuje skok, linę, tunel i atak. Materiał promocyjny nagrywamy z działającego buildu; makieta nie udaje gotowej gry.

Z dostarczonych stron sprzedażowych bierzemy kolejność obietnica → demonstracja → wyjaśnienie → odpowiedzi. Nie dodajemy fikcyjnych opinii, presji czasowej ani liczników. FAQ wyjaśnia: bezpłatność, telefon i orientacje, sterowanie, lokalny zapis oraz orientacyjny czas wyprawy.

Fabuła: Jajokról ogłosił się właścicielem całego podwórza. Bohater rusza odebrać mu koronę. Humor jest ciepły i sytuacyjny: za duży hełm, puszenie się wroga, zdziwienie po utracie podestu. Przykłady: „Jajko z niespodzianką”, „Korona spadła. Można wracać na grzędę”, „Tym razem kurnik górą”. Obok zawsze konkretna akcja, np. „Spróbuj ponownie”.

Marka występuje podpisem w menu i na landingu, krótką notą autora oraz linkiem do pozostałych projektów. Promocja nie przerywa walki. Gra ma być przyjemną przerwą, bez pouczania o produktywności i obietnic korzyści zdrowotnych.

## 18. Architektura i odpowiedzialności

Zachowujemy Astro static, React, Three.js/R3F i Rapier. Pełne 3D z dowolnym ruchem wymagałoby innego sterowania; całkowite 2D odchodziłoby od modeli 3D. Wybrana architektura zachowuje jedną płaszczyznę walki przy przestrzennym renderingu.

| Moduł | Odpowiedzialność i interfejs | Zależności |
|---|---|---|
| Terrain | Materiały, wycinanie obszaru, wersja geometrii, snapshot; zwraca zmienione fragmenty | Dane map, adapter kolizji |
| BattleSimulation | Polecenia, stały krok, fazy, obrażenia, zapasy, wynik i zdarzenia | Terrain, Character/Rope, Weapons, EnemyAI |
| Character/Rope | Ruch, skoki, pęd, zaczep i prowadzenie liny | Rapier, zapytania Terrain |
| Weapons | Parametry i wykonanie ataku, bez osobnej fizyki dla podglądu | Wspólny model pocisków i kolizji |
| EnemyAI | Wybór legalnego ruchu i ataku | Obserwacja bitwy i geometria, bez dostępu do UI |
| Campaign | Trasy, łupy, sklep, druga szansa i wyniki | Dane treści, wynik bitwy, Save |
| Save | Wersjonowanie, walidacja i atomowy zapis danych domenowych | Adapter pamięci przeglądarki |
| Renderer/Camera | Obraz, animacje, efekty i kadrowanie | Odczyt stanu symulacji i zdarzeń |
| HUD/Input | Dostępne działania, dotyk/klawiatura, menu | Polecenia symulacji i kampanii |

Jedna instancja symulacji jest właścicielem fizyki. React nie nalicza obrażeń i nie przestawia postaci równolegle z Rapierem. Efekty otrzymują stabilne identyfikatory zdarzeń, aby re-render nie odtworzył ataku. Zakończenie bitwy jest przekazywane kampanii raz.

### Teren

Źródłem prawdy jest dwuwymiarowa maska materiałów podzielona na fragmenty. Po wycięciu fragment jest przebudowywany na widoczną bryłę z głębią i odpowiadające kolizje. Początkowy wariant to scalanie wypełnionych obszarów w proste bryły kolizji; unika osobnego ciała dla każdej małej komórki. Jeśli wynik pomiaru uzasadnia siatkę trójkątów dla statycznego terenu, pozostaje ona adapterem tej samej maski.

Przy starcie prototypu sprawdzamy komórkę około 0,125 jednostki i fragment 32 × 32 komórki. Test obejmuje wielokrotne wybuchy, wąski tunel, kontakty na granicy fragmentów i usunięcie gruntu spod postaci. Aktualizacja jest wspólna dla obrazu, colliderów i cache trajektorii przed kolejnym krokiem symulacji. Nie wprowadzamy Web Workera ani rozbudowanego CSG bez pomiaru wskazującego potrzebę.

### Fizyka i lina

Stały krok 1/60 s, ograniczone nadrabianie po długiej klatce oraz pauza przy ukrytej karcie. Kontroler dynamicznej postaci blokuje ruch w osi głębi i obrót, a ruch po podłożu steruje prędkością/siłami. Lina wymaga ograniczenia długości oraz prowadzenia po narożnikach. Obecnego kinematycznego kontrolera nie można jedynie połączyć jointem i oczekiwać reakcji na siły.

Raycasty zaczepu, trafienia i podglądu korzystają z aktualnej rewizji geometrii. Ponowne obliczenia AI oraz trajektorii są uruchamiane po zmianie danych, nie bezwarunkowo w każdej klatce Reacta. Budżet planowania AI i maksymalny czas życia pocisków chronią przed zawieszeniem fazy; przekroczenie kończy legalnie daną akcję, nie przyznaje automatycznego zwycięstwa.

## 19. Mapa istniejącego repozytorium i migracja

Poniższe ścieżki są względne do repozytorium. Wskazują bieżące punkty integracji, nie wymóg pozostawienia wszystkich plików bez podziału.

| Ścieżka | Stan / działanie |
|---|---|
| `src/pages/index.astro` | Nowy landing zgodny z marką i wejścia do dwóch trybów |
| `src/pages/gra.astro` | Pełnoekranowa powłoka aplikacji i stan ładowania/błędu |
| `src/engine/KurczokerCanvas.jsx` | Integracja renderera, wejścia i domeny |
| `src/engine/GameRuntime.jsx` | Zastąpienie kamery dopasowującej całą arenę przez śledzenie i przegląd |
| `src/engine/tactical/simulation.js` | Przebudowa faz, wielu wrogów, ruchu, liny i broni |
| `src/engine/tactical/arena.js` | Zastąpienie stałych platform biblioteką dziewięciu map i materiałami |
| `src/engine/tactical/ballistics.js` | Wspólny model broni, pełny potrzebny zakres celowania |
| `src/engine/tactical/Controls.jsx` | Dotyk, keyboard, jawne tryby i kontekstowe zatwierdzanie |
| `src/engine/tactical/World.jsx`, `Chicken.jsx`, `Effects.jsx` | Świat, modele i efekty wynikające z symulacji |
| `src/engine/tactical/checkpoint.js` | Wersjonowany zapis walki i zmian terenu zamiast tylko mapy/sklepu |
| `src/engine/scenes/MapScene.jsx`, `BattleScene.jsx` | Mapa wyprawy i scena walki |
| `src/game/state.js`, `map.js`, `run.js`, `abilities.js` | Dwa tryby, nowa ekonomia, arsenał i przebieg wyprawy |
| `src/engine/store/useGameStore.js` | Most do UI bez drugiego źródła prawdy |
| `tools/build-game-assets.mjs` | Pipeline modeli, manifestów i kompresji |
| `tools/prepare-release.mjs`, `tools/deploy-pages.mjs` | Sprawdzenie buildu, preview i publikacja |
| `test/`, `test/visual/` | Regresje domeny, fizyki, zapisu i przepływu w przeglądarce |

Bieżący kod ma 20-sekundowy limit, małą arenę z kilku brył, jednego wroga i zapis wyłącznie poza walką. Testy opisujące stare wymagania trzeba ocenić i zaktualizować, a nie zachowywać sprzeczne zachowanie tylko po to, by pozostawały zielone. Starsze równoległe implementacje nie są automatycznie aktywnym silnikiem; przed usunięciem lub edycją sprawdzamy importy.

## 20. Cloudflare i ładowanie gry

Pierwsze wydanie pozostaje na istniejącym Cloudflare Pages. Astro generuje `dist`; symulacja singleplayer działa w przeglądarce. Konta, synchronizacja zapisu i publiczny ranking wymagałyby dodatkowego backendu i nie są częścią tego wydania.

Landing nie powinien pobierać całego silnika i dziewięciu aren przed decyzją o grze. Start gry ładuje wspólne zasoby oraz wybraną mapę, z widocznym postępem i ponowieniem po błędzie. Przy niedostępnym WebGL wyświetlamy zrozumiały komunikat, a nie pusty ekran. Utrata kontekstu renderera pauzuje grę i daje próbę odtworzenia lub powrót do checkpointu.

Pojedynczy plik Pages nie może przekraczać 25 MiB. To limit platformy, nie budżet docelowego pobrania. Własny budżet początkowy: do 10 MiB transferu skompresowanych zasobów potrzebnych do pierwszej walki, bez niepotrzebnych map i ciężkiego filmu promocyjnego. Przekroczenie wymaga optymalizacji i zapisanego uzasadnienia, nie przemilczenia.

Assety z hashem mogą być długo cache'owane; HTML i manifest wydania muszą pozwalać na aktualizację bez mieszania wersji. Test obejmuje poprawne ścieżki modeli, tekstur, dekoderów i WASM po publikacji. Nie zakładamy, że odświeżenie strony naprawi zły cache.

Znany projekt to `kurczoker-makeover`; gałąź produkcyjna była `main`. Aktualne powiązanie domen i projektu należy odczytać przed wydaniem. Adres preview i adres produkcji to odrębne wyniki. Zachowujemy tożsamość testowanego buildu i commita; przejście na produkcję nie może po cichu publikować innych plików.

## 21. Master plan realizacji — TODO i bramki jakości

Kolejność jest zatwierdzonym kierunkiem. Po przeglądzie tego pliku powstanie wykonawcza lista małych zadań i commitów. Poniższe etapy obejmują cały zakres pierwszego wydania, nie obietnicę ukończenia po samej pierwszej arenie.

- [ ] **M0 — baza i kontrakty:** potwierdź aktywny runtime, wersje lockfile i testy bazowe; wprowadź schemat map, materiałów, broni, stanu bitwy i zapisu. Odbiór: jeden zestaw danych, wskazane punkty migracji, brak przypadkowej zmiany gałęzi.
- [ ] **M1 — grywalny fundament:** Podwórze, ruch, skok, kamera, lasso z narożnikami, krater, tunel, jedna broń i wróg, tury bez zegara, pauza, wynik. Dotyk w pionie i poziomie od tego etapu. Odbiór: pełna sekwencja ruch → lina → drążenie → atak → odpowiedź → zakończenie przez normalne sterowanie.
- [ ] **M2 — szybka potyczka:** sześć broni, dwa narzędzia, trzy role AI, dziewięć topografii, selector i rewanż. Odbiór: każda mapa rozegrana, wszystkie mechaniki działają w aktualnym terenie, brak trwałych impasów w scenariuszach regresji.
- [ ] **M3 — wyprawa:** trzy potyczki, boss, rozwidlenie, nagrody, sklepy, zapis i druga szansa, oba zakończenia. Odbiór: wyprawa wygrana i przegrana normalną ścieżką, wznowienie po odświeżeniu, brak podwójnych łupów.
- [ ] **M4 — oprawa i produkt:** docelowe modele i animacje, audio, landing, pomoc, dostępność menu, profile jakości i balans. Podstawowy styl obowiązuje od M1; ten etap go dopracowuje. Odbiór: czytelna gra, spójna marka, pomiary na urządzeniach i rzeczywisty materiał rozgrywki.
- [ ] **M5 — wydanie:** build i testy, przegląd zmian, odbiór w Codexie, publikacja preview, ponowny odbiór zdalnego buildu, commit/push i produkcja sprawdzonej wersji. Odbiór: identyfikator commita, URL preview/produkcji, raport testów i możliwość powrotu do poprzedniego wydania.

Commit/push/deploy były wcześniej zlecone przez właściciela. Wykonanie pozostaje na bieżącej gałęzi i w tym worktree; integracja z produkcyjną `main` nie może nadpisać cudzych zmian ani wymagać force push. Dokumentacja może być commitowana wcześniej. Gra trafia do wydania dopiero po wymaganej weryfikacji.

## 22. Macierz testów i definicja ukończenia

| Obszar | Minimalny dowód |
|---|---|
| Fizyka | Ruch po zboczu, skok pod sufitem, cienka ściana, lądowanie na krawędzi, brak zależności reguł od FPS |
| Lina | Poprawny/błędny zaczep, ściana na drodze, narożnik, skracanie, puszczenie, zniszczenie zaczepu |
| Teren | Krater i tunel widoczne i przechodnie; brak starych kolizji na granicy fragmentów |
| Broń | Każda broń, zużycie zapasu raz, obrażenia/odrzut/osłona, podgląd do pierwszego zderzenia |
| AI | Każda rola, zmieniona trasa po destrukcji, legalne pominięcie akcji, obie fazy bossa |
| Tura/pauza | Brak zegara decyzji, jedno narzędzie i jeden atak, pauza w locie i podczas zapalnika |
| Wyprawa | Cztery walki, wybór trasy, użyteczna nagroda, zakup, druga szansa, oba zakończenia |
| Zapis | Odtworzenie maski terenu i min, amunicja/HP, uszkodzony zapis, brak miejsca, stary format |
| Mobile | Jednoczesny ruch/skok, lina i strzał bez myszy, obrót, safe-area, cancel dotyku |
| Przeglądarka | Brak krytycznych błędów konsoli/zasobów, ponowienie ładowania, odświeżenie i powrót |
| Cloudflare | Te same ścieżki na preview; modele/dekodery/audio, cache i zgodna wersja buildu |

Automatyczne testy sprawdzają zachowanie i nie dublują wyłącznie konstrukcji kodu. Utrzymujemy przydatne obecne testy Node i browserowe; zmieniamy oczekiwania sprzeczne z nowym projektem. Testy nie mogą uznawać gry za wygraną wyłącznie przez wpisanie wyniku do store.

Codex: desktop 1440 × 900, mobile pion 390 × 844 i 360 × 800, poziom 844 × 390; dodatkowo sprawdzenie zmiany rozmiaru i większego HUD. To weryfikacja układów i przepływów, nie dowód wydajności fizycznego telefonu. Potwierdzenie dotyku i płynności wymaga realnego Androida i iPhone'a, z zapisanym modelem, przeglądarką i profilem jakości.

Cele pomiarowe: stabilne co najmniej 30 FPS w profilu oszczędnym na wybranym średnim telefonie, cel 60 FPS na desktopie; raport czasu klatki p95, startu gry i przycięć przy kasetowym wybuchu. Wykonać dłuższą sesję obejmującą co najmniej pełną wyprawę i rewanż. Nie obiecujemy tych wyników przed pomiarem.

Tempo: zapisać czas trzech ukończonych wypraw osoby znającej sterowanie, osobno naukę i drugą szansę. Jeżeli typowy przebieg przekracza 15 minut, stroić HP, długość reakcji AI i liczbę ekranów; nie dodawać zegara decyzji wbrew ustaleniom.

Ukończenie oznacza działające oba tryby, dziewięć map, cały arsenał i ruch, pełną wyprawę, zapis, markowy landing, oprawę, przeprowadzony odbiór oraz opublikowany sprawdzony build. Jeżeli brak dostępu do realnego urządzenia, raport wskazuje tę lukę zamiast deklarować pełną weryfikację mobile.

## 23. Granice pierwszego wydania i ryzyka

Zakres pierwszego wydania obejmuje wszystko wymienione w zasadach produktu. Poza nim pozostają: multiplayer, publiczny ranking, konta i synchronizacja, swobodne poruszanie po głębi 3D, edytor map dla graczy, proceduralny nieskończony świat, dodatkowi bossowie i monetyzacja. To nie są domyślnie zaplanowane kolejne funkcje.

Największe ryzyka to geometria po wielokrotnej destrukcji, lina na narożnikach, kontroler dynamicznej postaci, czytelność szerokiej mapy w pionie oraz przewaga dwóch wrogów. M1 musi sprawdzić pierwsze cztery przed produkcją całej biblioteki map. Wydajność wymaga pomiaru; wybór Three/Rapier lub kompresji sam w sobie jej nie gwarantuje.

Zakres i preferencje właściciela mają pierwszeństwo przed skrótami implementacyjnymi. Nie zastępujemy lassa animacją, tunelu teksturą ani odbioru grywalności zrzutem ekranu. Jednocześnie nie rozbudowujemy usług serwerowych bez potrzeby wynikającej z uzgodnionych trybów.

## 24. Źródła i kontekst researchu

Materiały właściciela:

- `C:/Users/delta/Downloads/KURCZOKER — głęboki raport redesignu Heroes III × Worms 2 × retro Game Boy.md` — inspiracje mechanik i techniki. Sześć broni w tym projekcie zatwierdzono w rozmowie; trzy biomy i trzech bossów z raportu nie weszło automatycznie do zakresu.
- `C:/Users/delta/Downloads/DELTA240MVT-DESIGN-MASTER.md` — system wizualny.
- `C:/Users/delta/Desktop/FRINTER.APP + PERSONAL BRAND/FRINTER - CURSOR - 26.11.25/PERSONAL ASSISTANT/work-projects/delta240mvt/DELTA240MVT-MASTER-BRAND.md` — głos marki i odbiorcy.
- `C:/Users/delta/Desktop/FRINTER.APP + PERSONAL BRAND/FRINTER - CURSOR - 26.11.25/PERSONAL ASSISTANT/work-projects/strony-sprzedażowe` — wzorce narracji landingu.

W repo: `docs/KURCZOKER_KOMPLETNY_OPIS_GRY_DO_RESEARCHU.md` opisuje poprzednią implementację; `2026-09-08-kurczoker-brand-redesign-notes.md` w tym katalogu jest historią decyzji. Zatwierdzona makieta A znajduje się lokalnie w `.superpowers/brainstorm/1784-1788858312/content/02-visual-directions-refined.html`, poza buildem i Git. Master dokument zawiera jej istotne ustalenia i nie wymaga działającego lokalnego serwera makiet.

Weryfikacja techniczna 2026-09-08, źródła pierwotne:

- [Cloudflare: Astro na Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/) — build i katalog publikacji.
- [Cloudflare: limity Pages](https://developers.cloudflare.com/pages/platform/limits/) — limit 25 MiB pojedynczego pliku.
- [Astro: Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) — aktualna rekomendacja Workers dla nowych projektów; utrzymanie istniejącego Pages jest decyzją tego projektu.
- [Three: GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) i [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html) — podłączenie dekoderów meshopt/KTX2 i detekcja wsparcia tekstur.
- [Three: RenderPixelatedPass](https://threejs.org/docs/pages/RenderPixelatedPass.html) oraz [responsive design](https://threejs.org/manual/en/responsive.html) — narzędzia pikselizacji i kontrola rozdzielczości bufora.
- [Rapier: typy ciał](https://rapier.rs/docs/user_guides/javascript/rigid_body_type/), [collidery](https://rapier.rs/docs/user_guides/javascript/colliders/) i [JointData](https://rapier.rs/javascript3d/classes/JointData.html) — ograniczenia kontrolera i geometrii, podstawy jointów.

Dodatkowe ustalenia zapisano w `docs/research/2026-09-08-kurczoker-rendering-cloudflare.md`. Dokumentacja internetowa i wersja repo mogą się różnić; przed implementacją sprawdzamy API z wersją lockfile. Powyższe źródła uzasadniają możliwości narzędzi, nie dowodzą gotowości gry ani jej wydajności.
