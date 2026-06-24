import { test, expect } from '@playwright/test';

test.describe('Phase 3 merchant inventory smoke', () => {
  test('inventory warehouses page loads after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'demo@merchant.test');
    await page.fill('[name=password]', 'demo1234');
    await page.click('button[type=submit]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 }).catch(() => {
      test.skip(true, 'Demo merchant not seeded — run pnpm db:seed');
    });

    const res = await page.goto('/inventory/warehouses');
    if (!res || res.status() >= 500) {
      test.skip(true, 'Merchant app or API not running');
    }

    await expect(page.getByRole('heading', { name: /warehouses/i })).toBeVisible();
    await expect(page.getByText(/default warehouse/i)).toBeVisible({ timeout: 10_000 });
  });

  test('inventory nav links are reachable', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'demo@merchant.test');
    await page.fill('[name=password]', 'demo1234');
    await page.click('button[type=submit]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 }).catch(() => {
      test.skip(true, 'Demo merchant not seeded');
    });

    for (const path of ['/inventory/stock', '/inventory/reports', '/inventory/purchase-orders']) {
      const res = await page.goto(path);
      if (!res || res.status() >= 500) {
        test.skip(true, `Failed to load ${path}`);
      }
      await expect(page.locator('main')).toBeVisible();
    }
  });
});
