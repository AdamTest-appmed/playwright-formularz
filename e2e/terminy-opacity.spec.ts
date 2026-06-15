import { test, expect, Page } from '@playwright/test';

const adresAplikacji = 'https://rekrutacja-tester-app.vercel.app/?step=1';

type Termin = {
  data: string;
  godzina: string;
  disabled: boolean;
  title: string;
  klasy: string;
  html: string;
  maOpacity40: boolean;
};

const przejdzDoWyboruTerminu = async (page: Page) => {
  await page.goto(adresAplikacji);
  await page.getByRole('button', { name: 'Dalej' }).click();

  await expect(
    page.locator('button[disabled][title="Termin zarezerwowany"]').first()
  ).toBeVisible({ timeout: 5000 });
};

const pobierzTerminyZKalendarza = async (page: Page): Promise<Termin[]> => {
  return page.locator('h3').evaluateAll((naglowkiDat) => {
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
};

const znajdzDostepneTerminyZOpacity40 = (terminy: Termin[]) => {
  return terminy.filter(
    (termin) =>
      termin.maOpacity40 &&
      !termin.disabled &&
      termin.title !== 'Termin zarezerwowany'
  );
};

const utworzKrotkiePodsumowanie = (terminy: Termin[]) => {
  return terminy
    .map((termin) => `${termin.data}, ${termin.godzina}`)
    .join('\n');
};

test.describe('Terminy wizyt - weryfikacja klasy opacity-40', () => {
  test('nie powinien oznaczać dostępnych terminów klasą opacity-40 @known-bug', async ({
  page,
}) => {

    await przejdzDoWyboruTerminu(page);

    const terminy = await pobierzTerminyZKalendarza(page);
    const zbugowaneTerminy = znajdzDostepneTerminyZOpacity40(terminy);

    await test.info().attach('zbugowane-terminy-opacity-40.json', {
      body: JSON.stringify(zbugowaneTerminy, null, 2),
      contentType: 'application/json',
    });

    if (zbugowaneTerminy.length > 0) {
      const pierwszeTerminy = zbugowaneTerminy
        .slice(0, 10)
        .map((termin) => `- ${termin.data}, ${termin.godzina}`)
        .join('\n');

      throw new Error(
        `Znaleziono ${zbugowaneTerminy.length} dostępne terminy błędnie oznaczone klasą opacity-40.\n\n` +
          `Przykłady:\n${pierwszeTerminy}\n\n` +
          `Pełna lista została dodana jako załącznik: zbugowane-terminy-opacity-40.json`
      );
    }
  });
});