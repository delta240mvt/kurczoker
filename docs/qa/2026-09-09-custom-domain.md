# KURCZOKER — uruchomienie własnej domeny

Data: 2026-09-09. Domena: **https://kurczoker.com/**. Gra: https://kurczoker.com/gra/.

## Konfiguracja

- W aktualnym lokalnym `.env` użytkownik wskazał `CF_CUSTOM_DOMAIN=kurczoker.com`. Wcześniejsza wiadomość wymieniała `kurczakar.com`; tej drugiej domeny nie podłączano. Strefa z konfiguracji jest aktywna i należy do konta projektu Pages.
- Projekt: `kurczoker-makeover`, gałąź produkcyjna `main`.
- Najpierw dodano domenę w Cloudflare Pages, następnie rekord DNS: `CNAME kurczoker.com → kurczoker-makeover.pages.dev`, proxy włączone, TTL automatyczny. Przed zmianą nie było rekordów na tej nazwie ani powiązania domeny z innym znalezionym projektem Pages.
- Powiązanie utworzone 2026-09-09 o 08:19:52 UTC. API o 08:23:26 UTC potwierdziło `status=active`, `verification=active`, `validation=active`.
- `.env` pozostaje ignorowany przez Git. `.env.example` zawiera puste pola poświadczeń i opis minimalnych uprawnień tokena; nie zawiera sekretów.

## Wydanie i weryfikacja

- Własna domena obsługuje istniejące, przetestowane wydanie produkcyjne `5735bb5f-7fff-4a74-8d74-50813ef8c8ea`. Nie zmieniano kodu gry ani nie przebudowywano artefaktu.
- Źródło buildu: `43c9c764b3e6d5223e1bd05e7f612247cbd292ec`, `dirty=false`.
- Publiczny Cloudflare DNS over HTTPS zwrócił poprawne rekordy A/AAAA oraz serwery nazw Cloudflare. API potwierdziło właściwy rekord CNAME.
- Weryfikator `tools/verify-preview.mjs` uruchomiony na `https://kurczoker.com`: **64/64 pliki HTTP 200**, poprawne MIME JavaScript/GLB i cache immutable, zgodność raportu wydania oraz sum SHA-256 wszystkich serwowanych plików i modeli z lokalnym, przetestowanym `dist`.
- Lokalny resolver systemowy nie rozpoznawał nowej domeny (`ENOENT`/`Could not resolve host`). Dlatego transport weryfikatora użył adresu uzyskanego przez publiczny DNS over HTTPS, zachowując oryginalny hostname, SNI i pełną walidację certyfikatu TLS. Nie wyłączano walidacji certyfikatów ani nie zmieniano systemowego DNS lub pliku hosts.
- Próba wejścia przez przeglądarkę Codexa zakończyła się `ERR_NAME_NOT_RESOLVED`; nie przedstawiamy jej jako zaliczonego testu interaktywnego na własnej domenie. Poprzedni odbiór tej samej wersji na Pages (desktop/mobile i testy rozgrywki) opisano w `2026-09-08-kurczoker-brand-redesign.md`.
- Lokalne artefakty (ignorowane przez Git): `.superpowers/makeover-qa/domain-binding-before.json`, `domain-binding-created.json`, `domain-binding-status.json`, `custom-domain-http.json`.

## Lista wykonania

- [x] Sprawdzić konto, aktywną strefę i konfigurację lokalną.
- [x] Podłączyć domenę w Pages i utworzyć zgodny rekord DNS.
- [x] Potwierdzić aktywację domeny i HTTPS.
- [x] Zweryfikować wszystkie 64 pliki wydania na własnej domenie.
- [ ] Powtórzyć interaktywny test na własnej domenie po udostępnieniu jej przez lokalny resolver przeglądarki Codexa.

Konfiguracja własnej domeny jest aktywna. Powyższe ograniczenie dotyczy lokalnego testu przeglądarkowego; test HTTPS z publicznym DNS przeszedł.

## Zgłoszenie NXDOMAIN — diagnoza 2026-09-09, 08:30 UTC

- Użytkownik potwierdził, że `kurczakar.com` była literówką. Prawidłowa domena pozostaje `kurczoker.com`.
- RDAP rejestru .com potwierdził rejestrację i delegację na `darl.ns.cloudflare.com` / `harlee.ns.cloudflare.com`; są zgodne z aktywną strefą Cloudflare.
- Google i Cloudflare DNS over HTTPS oraz bezpośrednie `Resolve-DnsName -Type A -Server 8.8.8.8` / `-Server 1.1.1.1` zwracają poprawnie `104.21.35.27` i `172.67.212.72`.
- Domyślny resolver tej maszyny zwracał dla A wyłącznie starszy SOA (serial `2413174027`, brak adresu), z malejącym TTL: 1247 → 1210 → 1147 sekund. Aktualna publiczna odpowiedź SOA przed dodaniem www miała serial `2414427698`. Zapytanie AAAA już zwracało adresy. To wskazuje na utrzymaną negatywną odpowiedź A w pamięci resolvera obsługującego połączenie.
- `Clear-DnsClientCache` zakończyło się poprawnie, ale odpowiedź domyślnego resolvera pozostała stara. Nie zmieniano konfiguracji serwerów DNS w systemie. Pozostały TTL około 20 minut oznacza oczekiwane wygaśnięcie tej odpowiedzi około 10:50 czasu warszawskiego; nie jest gwarancją czasu odświeżenia wszystkich przeglądarek i sieci.
- Osobny, potwierdzony brak: `www.kurczoker.com` zwracało NXDOMAIN w obu publicznych resolverach i nie miało rekordu ani powiązania Pages. Dodano je w Pages i utworzono proxied CNAME na `kurczoker-makeover.pages.dev` o 08:29:53 UTC. O 08:30:25 UTC oba publiczne resolvery zwracały już adresy; Pages miało weryfikację DNS active, aktywację całości/HTTPS jeszcze pending.
- Wcześniejszy komunikat o gotowym wdrożeniu był zbyt szeroki: poprawny HTTPS i identyczny artefakt nie dowodzą dostępności przez domyślny resolver użytkownika. Ograniczenie to pozostaje jawne do pomyślnego zwykłego wejścia w przeglądarce.
- Artefakt diagnozy: `.superpowers/makeover-qa/public-dns-diagnosis.json`; utworzenie www: `www-domain-created.json`.
- Końcowa kontrola około 08:31 UTC: obie domeny mają `status=active`, `verification=active`, `validation=active`. `curl --resolve` na publiczny adres DNS dla `https://www.kurczoker.com/` zwrócił HTTP 200 z pełną weryfikacją certyfikatu. Zwykły curl nadal nie rozpoznawał nazwy przez domyślny resolver; nie zaliczono zwykłego wejścia jako działającego.
