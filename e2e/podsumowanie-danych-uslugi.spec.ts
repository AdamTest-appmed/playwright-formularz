import { test, expect, Page } from '@playwright/test';

const adresAplikacji = 'https://rekrutacja-tester-app.vercel.app/?step=1';

type Wizyta = {
  nazwa: string;
  czasTrwania: string;
  cena: string;
  expectedFailureReason?: string;
};

type DanePacjenta = {
  imie: string;
  nazwisko: string;
  email: string;
  telefon: string;
  notatka: string;
};

const wizyty: Wizyta[] = [
  {
    nazwa: 'Konsultacja ogólna',
    czasTrwania: '30 min',
    cena: '150 zł',
  },
  {
    nazwa: 'Przegląd okresowy',
    czasTrwania: '60 min',
    cena: '280 zł',
    expectedFailureReason:
      'Znany defekt: dla przeglądu okresowego podsumowanie pokazuje czas trwania 30 min zamiast 60 min.',
  },
  {
    nazwa: 'Zabieg specjalistyczny',
    czasTrwania: '60 min',
    cena: '600 zł',
    expectedFailureReason:
      'Znany defekt: dla zabiegu specjalistycznego podsumowanie pokazuje cenę 6000 zł zamiast 600 zł.',
  },
  {
    nazwa: 'Konsultacja online',
    czasTrwania: '30 min',
    cena: '120 zł',
  },
];

const danePacjenta: DanePacjenta = {
  imie: 'Jan',
  nazwisko: 'Kowalski',
  email: 'jan.kowalski@example.com',
  telefon: '123456789',
  notatka: 'Lorem Ipsum',
};

const terminWizyty = {
  data: 'śr. 17 czerwca',
  godzina: '16:00',
};

const escapeRegExp = (tekst: string) =>
  tekst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pobierzWartoscZPodsumowania = (page: Page, etykieta: string) =>
  page
    .locator('dt')
    .filter({ hasText: new RegExp(`^${escapeRegExp(etykieta)}$`) })
    .locator('xpath=following-sibling::dd[1]');

const wybierzRodzajWizyty = async (page: Page, nazwaWizyty: string) => {
  await page.getByText(nazwaWizyty, { exact: true }).click();
  await page.getByRole('button', { name: 'Dalej' }).click();
};

const wybierzTerminWizyty = async (
  page: Page,
  data: string,
  godzina: string
) => {
  await expect(
    page.locator('button[disabled][title="Termin zarezerwowany"]').first()
  ).toBeVisible({ timeout: 5000 });

  const sekcjaWybranejDaty = page.locator('section').filter({
    hasText: data,
  });

  const wybranyTermin = sekcjaWybranejDaty.getByRole('button', {
    name: godzina,
    exact: true,
  });

  await expect(wybranyTermin).toBeVisible();
  await expect(wybranyTermin).toBeEnabled();

  await wybranyTermin.click();
  await page.getByRole('button', { name: 'Dalej' }).click();
};

const uzupelnijDanePacjenta = async (page: Page, pacjent: DanePacjenta) => {
  await page.getByRole('textbox').first().fill(pacjent.imie);
  await page.getByRole('textbox').nth(1).fill(pacjent.nazwisko);
  await page.locator('input[type="email"]').fill(pacjent.email);
  await page.getByRole('textbox', { name: 'np. 123 456' }).fill(pacjent.telefon);
  await page
    .getByRole('textbox', { name: 'Dodatkowe informacje dla' })
    .fill(pacjent.notatka);

  await page.getByRole('button', { name: 'Dalej' }).click();
};

const sprawdzDaneUslugiWPodsumowaniu = async (
  page: Page,
  wizyta: Wizyta,
  oczekiwanyTermin: string
) => {
  await expect(pobierzWartoscZPodsumowania(page, 'Usługa')).toHaveText(
    wizyta.nazwa
  );

  await expect(pobierzWartoscZPodsumowania(page, 'Czas trwania')).toHaveText(
    wizyta.czasTrwania
  );

  await expect(pobierzWartoscZPodsumowania(page, 'Cena')).toHaveText(
    wizyta.cena
  );

  await expect(pobierzWartoscZPodsumowania(page, 'Termin')).toHaveText(
    oczekiwanyTermin
  );
};

const sprawdzDanePacjentaWPodsumowaniu = async (
  page: Page,
  pacjent: DanePacjenta
) => {
  await expect(pobierzWartoscZPodsumowania(page, 'Imię i nazwisko')).toHaveText(
    `${pacjent.imie} ${pacjent.nazwisko}`
  );

  await expect(pobierzWartoscZPodsumowania(page, 'E-mail')).toHaveText(
    pacjent.email
  );

  await expect(pobierzWartoscZPodsumowania(page, 'Telefon')).toHaveText(
    pacjent.telefon
  );

  await expect(pobierzWartoscZPodsumowania(page, 'Notatka')).toHaveText(
    pacjent.notatka
  );
};

test.describe('Podsumowanie rezerwacji - dane usługi', () => {
  for (const wizyta of wizyty) {
    test(`powinno wyświetlać poprawne dane w podsumowaniu dla: ${wizyta.nazwa}${
  wizyta.expectedFailureReason ? ' @known-bug' : ''
}`, async ({ page }) => {
      const oczekiwanyTermin = `${terminWizyty.data}, ${terminWizyty.godzina}`;

      await page.goto(adresAplikacji);

      await wybierzRodzajWizyty(page, wizyta.nazwa);
      await wybierzTerminWizyty(page, terminWizyty.data, terminWizyty.godzina);
      await uzupelnijDanePacjenta(page, danePacjenta);

      await expect(
        page.getByRole('heading', { name: 'Podsumowanie' })
      ).toBeVisible();

      await sprawdzDaneUslugiWPodsumowaniu(page, wizyta, oczekiwanyTermin);
      await sprawdzDanePacjentaWPodsumowaniu(page, danePacjenta);

      // Test celowo nie klika przycisku "Potwierdź rezerwację",
      // aby nie tworzyć rzeczywistej rezerwacji.
    });
  }
});