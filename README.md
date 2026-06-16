# Playwright E2E Tests - Formularz rezerwacji wizyty

Repozytorium zawiera automatyczne testy end-to-end napisane w Playwright z użyciem TypeScriptu dla formularza rezerwacji wizyty medycznej.

Celem projektu jest pokazanie moich praktycznych umiejętności w automatyzacji testów, testowania eksploracyjnego, wykrywania defektów oraz konfiguracji testów w GitHub Actions.

## Testowana aplikacja

Aplikacja testowana:

`https://rekrutacja-tester-app.vercel.app/`

Aplikacja umożliwia użytkownikowi przejście przez wieloetapowy formularz rezerwacji wizyty:

1. wybór rodzaju wizyty,
2. wybór daty i godziny,
3. uzupełnienie danych pacjenta,
4. sprawdzenie podsumowania rezerwacji.

## Technologie

* Playwright
* TypeScript
* Node.js
* GitHub Actions
* Chromium

## Zakres testów automatycznych

Testy automatyczne obejmują wybrane obszary istotne z punktu widzenia działania formularza:

* walidację danych w podsumowaniu rezerwacji,
* sprawdzenie aktualizacji danych pacjenta po użyciu przycisku `Wstecz`,
* weryfikację czasu trwania i ceny wizyty,
* wykrywanie dostępnych terminów błędnie oznaczonych wizualnie jako niedostępne.

## Struktura testów

Testy znajdują się w katalogu `e2e`.

Aktualne obszary testowe:

* `podsumowanie-danych-uslugi.spec.ts`
  Sprawdza nazwę usługi, czas trwania, cenę, wybraną datę oraz dane pacjenta w podsumowaniu rezerwacji.

* `aktualizacja-danych-po-wstecz.spec.ts`
  Sprawdza, czy dane pacjenta są poprawnie aktualizowane w podsumowaniu po cofnięciu formularza, zmianie danych i ponownym przejściu dalej.

* `terminy-opacity.spec.ts`
  Wykrywa dostępne terminy wizyt, które są błędnie oznaczone klasą `opacity-40`, przez co mogą wyglądać jak niedostępne.

## Znane defekty pokryte testami

Część testów jest oznaczona tagiem `@known-bug`, ponieważ dokumentuje defekty znalezione podczas testowania.

Testy te nie zostały usunięte z projektu. Są celowo pozostawione, aby pokazać rzeczywiste zachowanie aplikacji w miejscach, w których wykryto problemy.

Pokryte znane defekty:

| Obszar              | Defekt                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Podsumowanie wizyty | `Przegląd okresowy` pokazuje `30 min` zamiast oczekiwanych `60 min`.                                   |
| Podsumowanie wizyty | `Zabieg specjalistyczny` pokazuje cenę `6000 zł` zamiast oczekiwanych `600 zł`.                        |
| Terminy wizyt       | Dostępne terminy są oznaczone klasą `opacity-40`, przez co wyglądają jak niedostępne.                  |
| Nawigacja wstecz    | Po użyciu przycisku `Wstecz` i zmianie danych pacjenta podsumowanie nadal pokazuje pierwotne wartości. |

## Podejście do CI

GitHub Actions zostało skonfigurowane tak, aby oddzielić stabilne testy regresyjne od testów dokumentujących znane defekty.

Testy regresyjne powinny przechodzić poprawnie.

Testy oznaczone jako `@known-bug` są uruchamiane osobno i mogą kończyć się błędem, ponieważ dokumentują potwierdzone problemy w testowanej aplikacji.

Takie podejście pozwala zachować czytelny pipeline CI, a jednocześnie pokazuje defekty wykryte podczas testowania.

## Instalacja

```bash
npm install
npx playwright install
```

## Uruchamianie testów lokalnie

Uruchomienie wszystkich testów w Chromium:

```bash
npx playwright test --project=chromium
```

Uruchomienie tylko testów regresyjnych:

```bash
npx playwright test --project=chromium --grep-invert @known-bug
```

Uruchomienie tylko testów dokumentujących znane defekty:

```bash
npx playwright test --project=chromium --grep @known-bug
```

Otwarcie raportu HTML Playwright:

```bash
npx playwright show-report
```
## Uwagi

Testy celowo nie potwierdzają rezerwacji tam, gdzie mogłoby to tworzyć niepotrzebne rezerwacje. Zauważyłem, że po wykorzystaniu danej godziny figuruje ona jako niedostępna. Nie wiem, czy nie zapisuje się to w backendzie i nie zablokuje testów innych uczestników rekrutacji.

Projekt skupia się na pokazaniu praktycznego podejścia QA, czytelnej automatyzacji testów oraz dokumentowania znalezionych defektów, a nie na pełnym pokryciu całej aplikacji.
