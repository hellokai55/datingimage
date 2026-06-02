import { test, expect } from '@playwright/test';

test.describe.parallel('Anonymous user gated page access', () => {
  test('is redirected from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
    await expect(page.getByText('Sign in to DatingImage')).toBeVisible();
  });

  test('is redirected from project new to login', async ({ page }) => {
    await page.goto('/project/new');
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
    await expect(page.getByText('Sign in to DatingImage')).toBeVisible();
  });
});
