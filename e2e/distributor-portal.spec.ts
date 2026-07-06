import { test, expect } from '@playwright/test';

test.describe('Distributor portal smoke', () => {
  test('promoter login and view commissions', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'promoter@meridian.test');
    await page.fill('[name=password]', 'promo1234');
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 }),
      page.click('button[type=submit]'),
    ]);
    await page.goto('/commissions');
    await expect(page.getByRole('heading', { name: /commission/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.goto('/withdrawals');
    await expect(page.getByRole('heading', { name: /withdrawal/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
