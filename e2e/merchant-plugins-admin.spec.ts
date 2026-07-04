import { test, expect } from '@playwright/test';

test.describe('Admin merchant plugins', () => {
  test('admin merchant detail shows plugin badges', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'admin@meridian.test');
    await page.fill('[name=password]', 'admin123');
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 }),
      page.click('button[type=submit]'),
    ]);

    await page.goto('/merchants');
    await page.getByRole('link', { name: /view|查看/i }).first().click();
    await expect(page.getByText(/installed plugins|已安装插件/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/CRM/i).first()).toBeVisible();
  });
});
