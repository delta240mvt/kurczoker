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
