import { test, expect, type Page } from '@playwright/test';

const DEMO_EMAIL = 'demo@merchant.test';
const DEMO_PASSWORD = 'demo1234';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const MERCHANT_URL = process.env.MERCHANT_APP_URL ?? 'http://localhost:3002';
const STORE_URL = process.env.STORE_APP_URL ?? 'http://localhost:3003';

async function loginMerchant(page: Page): Promise<boolean> {
  const res = await page.request.post(`${API_URL}/api/v1/merchant/auth/login`, {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });
  if (!res.ok()) return false;
  const { accessToken } = (await res.json()) as { accessToken: string };
  await page.context().addCookies([
    {
      name: 'merchant_token',
      value: accessToken,
      domain: new URL(MERCHANT_URL).hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'meridian_locale_merchant',
      value: 'zh-CN',
      domain: new URL(MERCHANT_URL).hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
  return true;
}

test.describe('Locale switching (merchant)', { tag: '@merchant-app' }, () => {
  test('merchant sidebar shows Chinese when locale cookie is zh-CN', async ({ page }) => {
    const health = await page.request.get(`${API_URL}/api/v1/health`);
    if (!health.ok()) test.skip(true, 'API not running');

    if (!(await loginMerchant(page))) {
      test.skip(true, 'Demo merchant not seeded');
    }

    await page.goto(`${MERCHANT_URL}/`);
    await expect(page.getByRole('button', { name: '库存' })).toBeVisible({ timeout: 10000 });
  });

});

test.describe('Locale switching (store)', { tag: '@store-app' }, () => {
  test('store nav shows Chinese after locale toggle', async ({ page }) => {
    const res = await page.goto(`${STORE_URL}/shop`);
    if (!res || res.status() >= 500) {
      test.skip(true, 'Store app not running or demo seed missing');
    }

    await page.getByRole('button', { name: /语言|Language/i }).click();
    await page.getByRole('menuitem', { name: '中文' }).click();

    await expect(
      page.getByRole('navigation').getByRole('link', { name: '购物车' }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
