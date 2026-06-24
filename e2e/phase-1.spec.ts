import { test, expect } from '@playwright/test';

test.describe('Phase 1 smoke', () => {
  test('admin login and view merchants', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'admin@meridian.test');
    await page.fill('[name=password]', 'admin123');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/');
    await page.goto('/merchants');
    await expect(page.getByRole('heading', { name: /merchants/i })).toBeVisible();
  });

  test('API health endpoint', async ({ request }) => {
    const res = await request.get('http://localhost:3001/api/v1/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
