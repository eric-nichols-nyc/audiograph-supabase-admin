import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://open.spotify.com/artist/1HY2Jd0NmPuamShAr6KMms');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Lady Gaga Songs, Albums, Bio & More | Spotify/);
  await page.getByRole('button', { name: 'Lady Gaga', exact: true }).click();
  await page.getByText('#3in the world34,837,').click();
  await page.getByText('#3in the world34,837,').click();
  await page.getByText('34,837,969').click();
  await page.getByText('121,885,160', { exact: true }).click();
  await page.getByText('Jakarta, ID').click();
  await page.getByText('São Paulo, BR').click();
  await page.getByText('Santiago, CL').click();
  await page.getByText('Mexico City, MX').click();
  await page.getByText('London, GB').click();
});

test('get started link', async ({ page }) => {
  await page.goto('https://open.spotify.com/artist/1HY2Jd0NmPuamShAr6KMms');
  
  // Click the get started link.

  // Expects page to have a heading with the name of Installation.
});
