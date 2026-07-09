import { test, expect } from '@playwright/test';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

test.describe('Phase 2 store smoke', () => {
  test('API checkout flow with paid order', async ({ request }) => {
    const health = await request.get(`${API}/api/v1/health`);
    expect(health.ok()).toBeTruthy();

    const adminLogin = await request.post(`${API}/api/v1/platform/auth/login`, {
      data: { email: 'admin@meridian.test', password: 'admin123' },
    });
    if (!adminLogin.ok()) {
      test.skip(true, 'Admin seed not available — run prisma db seed');
    }
    const adminToken = (await adminLogin.json()).accessToken as string;

    const email = `store-owner-${Date.now()}@e2e.test`;
    const register = await request.post(`${API}/api/v1/merchant/auth/register`, {
      data: {
        businessName: `E2E Store ${Date.now()}`,
        email,
        password: 'secret1234',
      },
    });
    expect(register.ok()).toBeTruthy();
    const merchantToken = (await register.json()).accessToken as string;

    const profileRes = await request.get(`${API}/api/v1/merchant/onboarding`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });
    const profileId = (await profileRes.json()).id as string;

    await request.post(`${API}/api/v1/merchant/onboarding/submit`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });

    const approved = await request.post(`${API}/api/v1/platform/merchants/${profileId}/approve`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(approved.ok()).toBeTruthy();

    const flagship = await request.patch(
      `${API}/api/v1/platform/merchants/${profileId}/store-settings`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { isFlagship: false, storePublished: true },
      },
    );
    expect(flagship.ok()).toBeTruthy();

    const listRes = await request.get(`${API}/api/v1/platform/merchants?limit=100`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const slug = (await listRes.json()).data.find(
      (m: { id: string }) => m.id === profileId,
    )?.slug as string | undefined;
    if (!slug) {
      throw new Error('Merchant slug not found after approval');
    }

    const product = await request.post(`${API}/api/v1/merchant/products`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
      data: {
        name: 'E2E Widget',
        isPublished: true,
        variants: [{ sku: 'E2E-1', name: 'Default', price: 25, inventory: 5 }],
      },
    });
    expect(product.ok()).toBeTruthy();
    const productBody = await product.json();
    const variantId = productBody.variants[0].id as string;

    const sessionId = `e2e-session-${Date.now()}`;

    const addItem = await request.post(`${API}/api/v1/store/${slug}/cart/items`, {
      headers: { 'X-Cart-Session': sessionId },
      data: { variantId, quantity: 2 },
    });
    expect(addItem.ok()).toBeTruthy();

    const checkout = await request.post(`${API}/api/v1/store/${slug}/checkout`, {
      headers: { 'X-Cart-Session': sessionId },
      data: { guestEmail: 'guest@e2e.test', fulfillmentType: 'PICKUP' },
    });
    if (!checkout.ok()) {
      const body = await checkout.text();
      throw new Error(`Checkout failed (${checkout.status()}): ${body}`);
    }
    const { order } = await checkout.json();

    const pay = await request.post(
      `${API}/api/v1/store/${slug}/orders/${order.id}/simulate-payment`,
    );
    expect(pay.ok()).toBeTruthy();

    const merchantOrders = await request.get(`${API}/api/v1/merchant/orders`, {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });
    expect(merchantOrders.ok()).toBeTruthy();
    const ordersBody = await merchantOrders.json();
    const orderList = Array.isArray(ordersBody) ? ordersBody : ordersBody.data;
    expect(orderList.some((o: { id: string }) => o.id === order.id)).toBeTruthy();
  });

  test('store storefront landing page', async ({ page }) => {
    const res = await page.goto('/');
    if (!res || res.status() >= 500) {
      test.skip(true, 'Store app not running');
    }
    await expect(page).toHaveURL(/\/shop\/?$/);
    await expect(page.getByRole('heading', { name: /Shop|商城|选购/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('demo store catalog renders products', async ({ page }) => {
    const res = await page.goto('/shop');
    if (!res || res.status() >= 500) {
      test.skip(true, 'Store app not running or demo seed missing');
    }
    await expect(page.getByRole('heading', { name: /Shop|商城|选购/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('link', { name: 'Starter Widget', exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
