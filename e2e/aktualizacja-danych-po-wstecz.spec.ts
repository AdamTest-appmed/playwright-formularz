import { test, expect, Page } from '@playwright/test';

const adresAplikacji = 'https://rekrutacja-tester-app.vercel.app/?step=1';

const pierwotneDanePacjenta = {
  imie: 'Jan',
  nazwisko: 'Kowalski',
  email: 'jan.kowalski@example.com',
  telefon: '123456789',
  notatka: 'Pierwotna notatka',
};

const zaktualizowaneDanePacjenta = {
  imie: 'Adam',
  nazwisko: 'Nowak',
  email: 'adam.nowak@example.com',
  telefon: '987654321',
  notatka: 'Zmieniona notatka po kliknięciu Wstecz',
};

const terminWizyty = {
  data: 'śr. 17 czerwca',
  godzina: '16:00',
};

const pobierzWartoscZPodsumowania = (page: Page, etykieta: string) =>
  page
    .locator('dt')
    .filter({ hasText: new RegExp(`^${etykieta}$`) })
    .locator('xpath=following-sibling::dd[1]');

const wybierzTerminWizyty = async (page: Page, data: string, godzina: string) => {
  const sekcjaWybranejDaty = page.locator('section').filter({
    hasText: data,
  });

  const wybranyTermin = sekcjaWybranejDaty
    .locator('button')
    .filter({ hasText: godzina });

  await expect(wybranyTermin).toBeVisible();
  await expect(wybranyTermin).toBeEnabled();

  await wybranyTermin.click();
};

const uzupelnijDanePacjenta = async (
  page: Page,
  danePacjenta: typeof pierwotneDanePacjenta
) => {
  await page.getByRole('textbox').first().fill(danePacjenta.imie);
  await page.getByRole('textbox').nth(1).fill(danePacjenta.nazwisko);
  await page.locator('input[type="email"]').fill(danePacjenta.email);
  await page.getByRole('textbox', { name: 'np. 123 456' }).fill(danePacjenta.telefon);
  await page
    .getByRole('textbox', { name: 'Dodatkowe informacje dla' })
    .fill(danePacjenta.notatka);
};

const sprawdzDanePacjentaWPodsumowaniu = async (
  page: Page,
  danePacjenta: typeof pierwotneDanePacjenta,
  trybSoftAssertion = false
) => {
  const expectValue = trybSoftAssertion ? expect.soft : expect;

  await expectValue(pobierzWartoscZPodsumowania(page, 'Imię i nazwisko')).toHaveText(
    `${danePacjenta.imie} ${danePacjenta.nazwisko}`
  );

  await expectValue(pobierzWartoscZPodsumowania(page, 'E-mail')).toHaveText(
    danePacjenta.email
  );

  await expectValue(pobierzWartoscZPodsumowania(page, 'Telefon')).toHaveText(
    danePacjenta.telefon
  );

  await expectValue(pobierzWartoscZPodsumowania(page, 'Notatka')).toHaveText(
    danePacjenta.notatka
  );
};

test.describe('Formularz rezerwacji - nawigacja wstecz', () => {
  test('powinien zaktualizować dane pacjenta w podsumowaniu po cofnięciu i zmianie wartości', async ({
    page,
  }) => {
    await page.goto(adresAplikacji);

    await page.getByRole('button', { name: 'Dalej' }).click();

    await wybierzTerminWizyty(page, terminWizyty.data, terminWizyty.godzina);
    await page.getByRole('button', { name: 'Dalej' }).click();

    await uzupelnijDanePacjenta(page, pierwotneDanePacjenta);
    await page.getByRole('button', { name: 'Dalej' }).click();

    await sprawdzDanePacjentaWPodsumowaniu(page, pierwotneDanePacjenta);

    await page.getByRole('button', { name: '← Wstecz' }).click();

    await uzupelnijDanePacjenta(page, zaktualizowaneDanePacjenta);
    await page.getByRole('button', { name: 'Dalej' }).click();

    await sprawdzDanePacjentaWPodsumowaniu(
      page,
      zaktualizowaneDanePacjenta,
      true
    );
  });
});