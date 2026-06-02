import { test, expect } from '@playwright/test';

test.describe.parallel('Logged-in user page access', () => {
  test('can access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Your Projects' })
    ).toBeVisible();
  });

  test('can access home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: /photos that get you noticed/i })
    ).toBeVisible();
  });

  test('can access about page', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL('/about');
    await expect(
      page.getByRole('heading', { name: /better photos\. better matches/i })
    ).toBeVisible();
  });
});
