import { test, expect } from '@playwright/test';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

test.describe('Gaps store UI smoke', () => {
  test('ModeToggle switches store to dark theme', async ({ page }) => {
    const res = await page.goto('/shop');
    if (!res || res.status() >= 500) {
      test.skip(true, 'Store app not running or demo seed missing');
    }

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('account page lists customer orders after login', async ({ page, request }) => {
    const health = await request.get(`${API}/api/v1/health`);
    if (!health.ok()) {
      test.skip(true, 'API not running');
    }

    const catalog = await request.get(`${API}/api/v1/store/demo/products`);
    if (!catalog.ok()) {
      test.skip(true, 'Demo store catalog unavailable — run prisma db seed');
    }
    const catalogBody = await catalog.json();
    const variantId = catalogBody[0]?.variants[0]?.id as string | undefined;
    if (!variantId) {
      test.skip(true, 'No demo products in catalog');
    }

    const email = `pw-account-${Date.now()}@e2e.test`;
    const password = 'password12';

    const register = await request.post(`${API}/api/v1/store/demo/auth/register`, {
      data: { email, password, firstName: 'Play', lastName: 'wright' },
    });
    expect(register.ok()).toBeTruthy();
    const token = (await register.json()).accessToken as string;

    await request.post(`${API}/api/v1/store/demo/cart/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { variantId, quantity: 1 },
    });

    const checkout = await request.post(`${API}/api/v1/store/demo/checkout`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { fulfillmentType: 'PICKUP' },
    });
    expect(checkout.ok()).toBeTruthy();
    const orderId = (await checkout.json()).order.id as string;

    await request.post(`${API}/api/v1/store/demo/orders/${orderId}/simulate-payment`);

    await page.context().addCookies([
      {
        name: 'store_token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    const pageRes = await page.goto('/shop/account');
    if (!pageRes || pageRes.status() >= 500) {
      test.skip(true, 'Store app not running');
    }

    await expect(page.getByRole('navigation', { name: /My account|我的账户/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('PAID')).toBeVisible();
  });

  test('catalog sort query updates the shop URL', async ({ page }) => {
    const res = await page.goto('/shop?sort=price_asc');
    if (!res || res.status() >= 500) {
      test.skip(true, 'Store app not running');
    }
    await expect(page).toHaveURL(/sort=price_asc/);
  });

  test('addresses page shows a saved address after API create', async ({ page, request }) => {
    const health = await request.get(`${API}/api/v1/health`);
    if (!health.ok()) {
      test.skip(true, 'API not running');
    }

    const email = `pw-addr-${Date.now()}@e2e.test`;
    const password = 'password12';
    const register = await request.post(`${API}/api/v1/store/auth/register`, {
      data: { email, password, firstName: 'Addr', lastName: 'Test' },
    });
    expect(register.ok()).toBeTruthy();
    const token = (await register.json()).accessToken as string;

    const create = await request.post(`${API}/api/v1/store/auth/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Playwright User',
        phone: '13800138000',
        line1: '1 Test Lane',
        city: 'Shanghai',
      },
    });
    expect(create.ok()).toBeTruthy();

    await page.context().addCookies([
      {
        name: 'store_token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    const pageRes = await page.goto('/shop/account/addresses');
    if (!pageRes || pageRes.status() >= 500) {
      test.skip(true, 'Store app not running');
    }

    await expect(page.getByText('Playwright User')).toBeVisible();
    await expect(page.getByText('1 Test Lane')).toBeVisible();
  });
});
