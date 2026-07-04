import { test, expect } from '@playwright/test';

async function loginMerchant(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('[name=email]', 'demo@merchant.test');
  await page.fill('[name=password]', 'demo1234');
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 }),
    page.click('button[type=submit]'),
  ]);
}

test.describe('Merchant plugin marketplace', () => {
  test('owner installs HRM and sees stub page', async ({ page }) => {
    await loginMerchant(page);
    await page.goto('/plugins');
    await expect(page.getByRole('heading', { name: /plugin marketplace|插件市场/i })).toBeVisible({
      timeout: 15_000,
    });

    const hrmCard = page.locator('#plugin-hrm');
    await expect(hrmCard).toBeVisible();
    const installButton = hrmCard.getByRole('button', { name: /install|安装/i });
    if (await installButton.isVisible()) {
      await installButton.click();
      await expect(hrmCard.getByText(/installed|已安装/i)).toBeVisible({ timeout: 10_000 });
    }

    await page.goto('/hrm');
    await expect(page.getByText(/coming soon|即将推出/i)).toBeVisible({ timeout: 15_000 });
  });
});
