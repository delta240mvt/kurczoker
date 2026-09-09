# Polityka prywatności KURCZOKER — ustalenia i odbiór

## Uzgodniony zakres

Użytkownik zlecił przygotowanie polityki na podstawie raportu RODO oraz wzoru Creativa Legal, przeprowadzenie wywiadu i podłączenie dokumentu do serwisu. Potwierdził administratora i adres do publikacji, kontakt hello@frinter.app, działalność nierejestrowaną, brak IOD, osobistą obsługę poczty, brak CRM/AI oraz darmową grę bez kont, newslettera, reklam i dodatkowego zbierania danych. Końcowa skrzynka: prywatny Gmail za Cloudflare Email Routing. Zaakceptował usuwanie zwykłej korespondencji najpóźniej 12 miesięcy po zamknięciu sprawy, z odrębną retencją uzasadnionych roszczeń/obowiązków.

Źródłem treści jest `src/content/polityka-prywatnosci.md`, renderowany przez istniejącą stronę Astro. Link w stopce prowadzi do polityki, a menu i pauza otwierają ją w nowej karcie, zachowując rozgrywkę. Dokument nie importuje skryptu analitycznego. Nie dodano formularzy ani mechanizmu zbierania zgód.

## Podstawa faktyczna

- Kod: IndexedDB `kurczoker-v2`/`saves` (`latest`, `previous`), localStorage `kurczoker.settings.v2`, `kurczoker.help.v2`; rozpoznanie starszych zapisów. Brak synchronizacji i serwerowej bazy graczy. Brak TTL zapisów lokalnych.
- Build i publiczny HTML: brak Umami, reklam i skryptów Cloudflare Web Analytics; API projektu Pages nie ma tokena/tagu Web Analytics. W sprawdzonej odpowiedzi strony głównej nie wystąpił Set-Cookie.
- Token nie ma dostępu do pełnej konfiguracji Zaraz/ochrony botowej (403). Użytkownik nie zna tych ustawień. Dlatego dokument warunkowo opisuje techniczne cookies ochrony Cloudflare i nie przedstawia wszystkich możliwych cookies dostawcy jako zawsze używanych. Pojedyncza odpowiedź bez cookies nie stanowi pełnego audytu funkcji ochrony.
- Publiczne MX frinter.app potwierdzają Email Routing. Docelowy Gmail i zasady obsługi wiadomości potwierdził użytkownik.

## Zasady do stosowania przez administratora

- Przyjęte 12 miesięcy to obowiązek organizacyjny. Publikacja polityki nie ustawia automatycznego kasowania w Gmailu. Usuwać również własne kopie/załączniki, gdy przestają być potrzebne; osobno oceniać rzeczywiste spory i obowiązki prawne.
- Prywatny Gmail nie jest Google Workspace. Nie potwierdzono odrębnej umowy powierzenia dla konsumenckiego konta. Polityka opisuje stan faktyczny i nie zastępuje sprawdzenia zgodności warunków dostawcy z rolą i obowiązkami administratora, w szczególności art. 28 RODO. Przed deklarowaniem pełnej zgodności należy rozstrzygnąć tę kwestię; nie wpisywać fikcyjnej umowy Workspace.
- Przy zmianie dostawcy poczty, włączeniu analityki, reklam lub eksportu logów trzeba ponownie ustalić przepływy, podstawy, retencję i ewentualne zgody. Nie włączać Umami samą zmianą env bez dostosowania informacji i mechanizmu zgody, jeśli jest wymagany.
- Nie deklarowano, że hosting pozostawia wszystkie dane w Polsce/EOG, ani arbitralnego okresu 30 dni na wszystkie logi Cloudflare.

## Materiały

Materiały użytkownika: raport „RODO (GDPR) i polityka prywatności dla strony internetowej działającej w Polsce” oraz „2026.08.03-Polityka-prywatnosci-Creativa-Legal.pdf” (11 stron). Nie kopiowano danych kancelarii, jej listy narzędzi ani nieadekwatnych procesów.

Zweryfikowane źródła:

- [Prawo komunikacji elektronicznej, art. 399–400](https://api.sejm.gov.pl/eli/acts/DU/2024/1221/text.html).
- [UODO — obowiązki informacyjne](https://uodo.gov.pl/pl/645/4097).
- [Cloudflare DPA — zakres, transfery, kryteria retencji](https://www.cloudflare.com/cloudflare-customer-dpa/).
- [Cloudflare — prywatność](https://www.cloudflare.com/privacypolicy/) i [cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/).
- [Google — polityka prywatności](https://policies.google.com/privacy?hl=pl) i [zasady transferów](https://policies.google.com/privacy/frameworks?hl=pl).

## Weryfikacja

- Testy `analytics-privacy.test.js`: 4/4 PASS po aktualizacji historycznych oczekiwań testu do nowej treści. Początkowo stary test wymagał skryptu Umami także na stronie polityki; usunięto to nieaktualne wymaganie dla tej strony, zachowując test opcjonalnej konfiguracji na landing/game.
- Build Astro z importem Markdown: PASS. Pierwszy odbiór 360×800 potwierdził wszystkie 10 sekcji i brak poziomego overflow; tabela została następnie poprawiona do czytelnych kart na telefonie, z zachowaniem układu tabeli na desktopie.
- Końcowy odbiór lokalnego buildu w przeglądarce Codexa: 360×800 oraz 1440×900, wszystkie 10 sekcji dostępne, brak poziomego overflow. Na telefonie tabela ma czytelne karty (16 px), na desktopie trzy kolumny. Odnośniki do obu domen używają HTTPS.
- Kliknięcie linku w stopce prowadzi do polityki. Menu i pauza zawierają wspólny link z target="_blank" i rel="noopener noreferrer"; kliknięcie nie opuszcza gry, pauza pozostaje aktywna. Narzędzie Codexa nie pokazało nowej karty po kliknięciu target="_blank", więc otwarcia dodatkowej karty nie zaliczono jako potwierdzonego testu. Bezpośrednia nawigacja do celu działa. Na ekranie 360×800 link mieści się w panelu pauzy.
- Konsola areny: brak błędów; istniejące ostrzeżenie Three.js o przestarzałym THREE.Clock. `git diff --check` bez błędów.
