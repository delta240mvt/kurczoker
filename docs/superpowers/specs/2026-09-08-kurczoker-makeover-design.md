# KURCZOKER — zatwierdzony kierunek przebudowy

2026-09-08. Właściciel zatwierdził taktyczny roguelite z aktywnymi turami, jajobombami, pełnym 3D i kontrolowaną kamerą oraz realizację wszystkich pięciu etapów audytu. Praca inline na `baza080926-makeover`, w bieżącym worktree.

## Produkt i zakres

Mapa wyprawy → walka → wybór nagrody → sklep/skarb → kolejne walki → boss → zwycięstwo lub porażka → restart. Wszystkie oferowane zdolności i artefakty mają rzeczywisty efekt. Gra zapewnia tutorial, pauzę, ustawienia jakości/audio i bezpieczny lokalny checkpoint pomiędzy walkami. Checkpoint sprzed walki pozwala wznowić po odświeżeniu bez serializowania obiektów fizyki.

## Architektura

Astro pozostaje statycznym shellem. Jedna instancja Rapier zarządza całą fizyką aktualnego starcia: postaciami, terenem i pociskami obu stron. Runtime jest niezależny od React i testowany w Node z prawdziwym WASM. Fixed step 1/60 s; renderer czyta transformacje w klatce, React otrzymuje zdarzenia i rzadsze snapshoty HUD. Istniejące funkcje mapy, nagród i sklepu pozostają domeną kampanii.

Pocisk startuje z jawnej prędkości, a predykcja używa tego samego kroku i grawitacji. Kolizja/eksplozja jest jedynym źródłem obrażeń. Ataki przeciwników są widoczne i zapowiadane. Jeden strzał zużywa jedną akcję. Wznowienie, utrata fokusu, restart i resize nie pozostawiają aktywnego inputu ani spóźnionych zdarzeń.

## Sterowanie

Desktop: A/D lub strzałki do ruchu, W/skok, mysz do celu; Space/Enter i przycisk do strzału, Escape do pauzy. Telefon: osobne przyciski ruchu, skoku i strzału oraz suwaki kąta/mocy; dotyk celuje na wspólnej płaszczyźnie świata. Kamera zawsze obejmuje całą arenę, bez swobodnego obracania. Dostępne są jawne ustawienia kąta i mocy na obu platformach.

## Grafika

Stylizowana diorama: przestrzenna wyspa, modularny teren zgodny z colliderami, zamek, roślinność, wyraziste kurczaki, ciepłe światło i chłodne cienie. Mały zestaw prawdziwych modeli, animowane części/klipy, smuga, eksplozja, liczby obrażeń i dźwięk. Źródła starych generacji nie trafiają do paczki gry. Gdy zastępujemy tekstury kolorem materiałów i geometrią, nie dodajemy transkodera tekstur bez potrzeby. Modele produkcyjne otrzymują kompresję geometrii i manifest/licencję.

## Wydajność i wydanie

WebGL2, profile low/high/auto, ograniczone DPR i cienie. Cel pierwszego transferu ≤10 MiB, 60 FPS desktop / 30 FPS mobile; rezultaty raportować na nazwanym środowisku, nie deklarować wyników fizycznego telefonu z emulacji. Test pełnej wyprawy używa wejść, a nie wpisywania HP=0.

Cloudflare Pages: statyczne `dist`, asset ≤25 MiB, haszowane zasoby z cache immutable, dokument/manifest rewalidowany. Preview brancha i realne testy HTTPS przed publikacją. Brak logowania, multiplayer i płatnych usług runtime. R2 tylko jeśli potrzebny; obecny rozmiar po optymalizacji nie wymaga go. Nie publikować produkcji przed ukończeniem testów preview.

## Odbiór

- Zgodna trajektoria, rzeczywiste trafienia/pudła, widoczny atak wroga, spójny teren.
- Pełna wyprawa, wszystkie dostępne nagrody działają, boss, wygrana/porażka/restart.
- Pauza, resize, klawiatura i dotyk, odporny checkpoint i obsługa błędu WebGL/ładowania.
- Testy domeny i rzeczywistej fizyki, build, E2E desktop/mobile, pomiary i preview Cloudflare.

Podstawa dowodowa: [audyt](../../research/2026-09-08-kurczoker-audyt-i-plan-naprawczy.md). Zatwierdzenie w rozmowie obejmuje wykonanie inline bez ponownego pytania o te same etapy.
