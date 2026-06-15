import { test, expect, Page } from '@playwright/test';

const adresAplikacji = 'https://rekrutacja-tester-app.vercel.app/?step=1';

type DanePacjenta = {
  imie: string;
  nazwisko: string;
  email: string;
  telefon: string;
  notatka: string;
};

type DanePacjentaZPodsumowania = {
  imieINazwisko: string;
  email: string;
  telefon: string;
  notatka: string;
};

const pierwotneDanePacjenta: DanePacjenta = {
  imie: 'Jan',
  nazwisko: 'Kowalski',
  email: 'jan.kowalski@example.com',
  telefon: '123456789',
  notatka: 'Pierwotna notatka',
};

const zaktualizowaneDanePacjenta: DanePacjenta = {
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

const escapeRegExp = (tekst: string) =>
  tekst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pobierzWartoscZPodsumowania = (page: Page, etykieta: string) =>
  page
    .locator('dt')
    .filter({ hasText: new RegExp(`^${escapeRegExp(etykieta)}$`) })
    .locator('xpath=following-sibling::dd[1]');

const wybierzTerminWizyty = async (page: Page, data: string, godzina: string) => {
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
};

const uzupelnijDanePacjenta = async (
  page: Page,
  danePacjenta: DanePacjenta
) => {
  await page.getByRole('textbox').first().fill(danePacjenta.imie);
  await page.getByRole('textbox').nth(1).fill(danePacjenta.nazwisko);
  await page.locator('input[type="email"]').fill(danePacjenta.email);
  await page.getByRole('textbox', { name: 'np. 123 456' }).fill(danePacjenta.telefon);
  await page
    .getByRole('textbox', { name: 'Dodatkowe informacje dla' })
    .fill(danePacjenta.notatka);
};

const pobierzDanePacjentaZPodsumowania = async (
  page: Page
): Promise<DanePacjentaZPodsumowania> => {
  return {
    imieINazwisko: await pobierzWartoscZPodsumowania(
      page,
      'Imię i nazwisko'
    ).innerText(),
    email: await pobierzWartoscZPodsumowania(page, 'E-mail').innerText(),
    telefon: await pobierzWartoscZPodsumowania(page, 'Telefon').innerText(),
    notatka: await pobierzWartoscZPodsumowania(page, 'Notatka').innerText(),
  };
};

const oczekiwaneDanePacjenta = (
  danePacjenta: DanePacjenta
): DanePacjentaZPodsumowania => ({
  imieINazwisko: `${danePacjenta.imie} ${danePacjenta.nazwisko}`,
  email: danePacjenta.email,
  telefon: danePacjenta.telefon,
  notatka: danePacjenta.notatka,
});

test.describe('Formularz rezerwacji - nawigacja wstecz', () => {
  test('powinien zaktualizować dane pacjenta w podsumowaniu po cofnięciu i zmianie wartości @known-bug', async ({
    page,
  }) => {

    await page.goto(adresAplikacji);

    await page.getByRole('button', { name: 'Dalej' }).click();

    await wybierzTerminWizyty(page, terminWizyty.data, terminWizyty.godzina);
    await page.getByRole('button', { name: 'Dalej' }).click();

    await uzupelnijDanePacjenta(page, pierwotneDanePacjenta);
    await page.getByRole('button', { name: 'Dalej' }).click();

    await expect(
      page.getByRole('heading', { name: 'Podsumowanie' })
    ).toBeVisible();

    await expect(await pobierzDanePacjentaZPodsumowania(page)).toEqual(
      oczekiwaneDanePacjenta(pierwotneDanePacjenta)
    );

    await page.getByRole('button', { name: '← Wstecz' }).click();

    await uzupelnijDanePacjenta(page, zaktualizowaneDanePacjenta);
    await page.getByRole('button', { name: 'Dalej' }).click();

    const aktualneDanePacjenta = await pobierzDanePacjentaZPodsumowania(page);
    const oczekiwaneZaktualizowaneDane = oczekiwaneDanePacjenta(
      zaktualizowaneDanePacjenta
    );

    expect(
      aktualneDanePacjenta,
      'Podsumowanie powinno pokazywać dane wprowadzone po cofnięciu formularza i ponownym przejściu dalej.'
    ).toEqual(oczekiwaneZaktualizowaneDane);
  });
});