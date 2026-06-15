import { test, expect } from '@playwright/test';

test.describe('Terminy wizyt - weryfikacja klasy opacity-40', () => {
  test('nie powinien oznaczać dostępnych terminów klasą opacity-40', async ({ page }) => {
    await page.goto('https://rekrutacja-tester-app.vercel.app/?step=1');

    // Krok 1: przejście do wyboru terminu
    await page.getByRole('button', { name: 'Dalej' }).click();

    // Krok 2: czekamy, aż aplikacja zaktualizuje listę terminów
    // Markerem zaktualizowanej listy są poprawnie zablokowane terminy.
    await expect(
      page.locator('button[disabled][title="Termin zarezerwowany"]').first()
    ).toBeVisible({ timeout: 5000 });

    // Krok 3: pobranie HTML wszystkich przycisków godzin wraz z dniem
    const terminy = await page.locator('h3').evaluateAll((naglowkiDat) => {
      return naglowkiDat.flatMap((naglowekDaty) => {
        const kontenerDnia = naglowekDaty.parentElement;
        const data = naglowekDaty.textContent?.trim() ?? 'Brak rozpoznanej daty';

        if (!kontenerDnia) {
          return [];
        }

        const przyciskiGodzin = Array.from(
          kontenerDnia.querySelectorAll('button')
        ) as HTMLButtonElement[];

        return przyciskiGodzin.map((przycisk) => {
          const klasy = przycisk.getAttribute('class') ?? '';
          const title = przycisk.getAttribute('title') ?? '';

          return {
            data,
            godzina: przycisk.textContent?.trim() ?? '',
            disabled: przycisk.disabled || przycisk.hasAttribute('disabled'),
            title,
            klasy,
            html: przycisk.outerHTML,
            maOpacity40: przycisk.classList.contains('opacity-40'),
          };
        });
      });
    });

    // Krok 4: szukamy tylko błędnego wzorca:
    // opacity-40 + brak disabled + brak title="Termin zarezerwowany"
    const zbugowaneTerminy = terminy.filter(
      (termin) =>
        termin.maOpacity40 &&
        !termin.disabled &&
        termin.title !== 'Termin zarezerwowany'
    );

    console.table(
      zbugowaneTerminy.map((termin) => ({
        data: termin.data,
        godzina: termin.godzina,
        disabled: termin.disabled,
        title: termin.title,
        klasy: termin.klasy,
      }))
    );

    await test.info().attach('zbugowane-terminy-opacity-40.json', {
      body: JSON.stringify(zbugowaneTerminy, null, 2),
      contentType: 'application/json',
    });

    expect(
      zbugowaneTerminy,
      `Znaleziono dostępne terminy błędnie oznaczone klasą opacity-40:\n${JSON.stringify(
        zbugowaneTerminy,
        null,
        2
      )}`
    ).toHaveLength(0);
  });
});