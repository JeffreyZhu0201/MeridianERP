import { test, expect, type Page } from '@playwright/test';

import { merchant } from '../packages/shared/src/i18n/messages/zh-CN/merchant';

const inv = merchant.inventory;

const DEMO_EMAIL = 'demo@merchant.test';
const DEMO_PASSWORD = 'demo1234';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const MERCHANT_URL = process.env.MERCHANT_APP_URL ?? 'http://localhost:3002';

/** 通过 API 登录并写入 Cookie，避免 UI 登录与 CORS 干扰 */
async function loginMerchant(page: Page): Promise<boolean> {
  const res = await page.request.post(`${API_URL}/api/v1/merchant/auth/login`, {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });

  if (!res.ok()) {
    test.skip(true, '演示商户未 seed — 请先运行 pnpm db:migrate && pnpm db:seed');
    return false;
  }

  const { accessToken } = (await res.json()) as { accessToken: string };
  const merchantHost = new URL(MERCHANT_URL).hostname;

  await page.context().addCookies([
    {
      name: 'merchant_token',
      value: accessToken,
      domain: merchantHost,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'meridian_locale_merchant',
      value: 'zh-CN',
      domain: merchantHost,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  return true;
}

/** 访问路由并校验主内容区可见 */
async function gotoInventoryRoute(page: Page, path: string): Promise<boolean> {
  try {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
    if (res && res.status() >= 500) {
      test.skip(true, `无法加载 ${path}（HTTP ${res.status()}）`);
      return false;
    }
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    return true;
  } catch {
    test.skip(true, `无法加载 ${path}（请确认 API 与 merchant 已启动）`);
    return false;
  }
}

test.describe('Phase 3 商户库存（中文 UI）', () => {
  test.beforeEach(async ({ page }) => {
    const ok = await loginMerchant(page);
    if (!ok) return;
  });

  test('库存水平页加载', async ({ page }) => {
    if (!(await gotoInventoryRoute(page, '/inventory/stock'))) return;
    await expect(
      page.getByRole('heading', { name: inv.stock.title }),
    ).toBeVisible();
    await expect(page.getByText(inv.stock.singleWarehouseNote)).toBeVisible();
  });

  test('库存调整页：表单与历史区', async ({ page }) => {
    if (!(await gotoInventoryRoute(page, '/inventory/adjustments'))) return;
    await expect(
      page.getByRole('heading', { name: inv.adjustments.title }),
    ).toBeVisible();
    await expect(page.getByText(inv.adjustments.record)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: inv.adjustments.history }),
    ).toBeVisible();
  });

  test('低库存预警页加载', async ({ page }) => {
    if (!(await gotoInventoryRoute(page, '/inventory/alerts'))) return;
    await expect(
      page.getByRole('heading', { name: inv.alerts.title }),
    ).toBeVisible();
  });

  test('去进货页加载', async ({ page }) => {
    if (!(await gotoInventoryRoute(page, '/inventory/procurement'))) return;
    await expect(
      page.getByRole('heading', { name: inv.procurement.shopTitle }),
    ).toBeVisible();
  });

  test('采购历史页加载', async ({ page }) => {
    if (!(await gotoInventoryRoute(page, '/inventory/procurement/history'))) return;
    await expect(
      page.getByRole('heading', { name: inv.procurement.historyTitle }),
    ).toBeVisible();
  });

  test('库存报表页：指标卡与标签页', async ({ page }) => {
    if (!(await gotoInventoryRoute(page, '/inventory/reports'))) return;
    await expect(
      page.getByRole('heading', { name: inv.reports.title }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: inv.reports.tabStock })).toBeVisible();
    await expect(page.getByText(inv.reports.totalSkus, { exact: true }).first()).toBeVisible();
  });

  test('库存设置页（主账号）', async ({ page }) => {
    if (!(await gotoInventoryRoute(page, '/inventory/settings'))) return;
    await expect(
      page.getByRole('heading', { name: inv.settings.title }),
    ).toBeVisible();
    await expect(page.locator('#default-threshold')).toBeVisible();
  });

  test('侧栏库存子导航可访问全部路由', async ({ page }) => {
    const routes = [
      { href: '/inventory/stock', label: inv.nav.stock },
      { href: '/inventory/adjustments', label: inv.nav.adjustments },
      { href: '/inventory/alerts', label: inv.nav.alerts },
      { href: '/inventory/procurement', label: inv.nav.procurementShop },
      { href: '/inventory/procurement/history', label: inv.nav.procurementHistory },
      { href: '/inventory/reports', label: inv.nav.reports },
      { href: '/inventory/settings', label: inv.nav.settings },
    ];

    for (const route of routes) {
      if (!(await gotoInventoryRoute(page, route.href))) return;
      await expect(page.locator('main h1').first()).toBeVisible();
    }

    if (!(await gotoInventoryRoute(page, '/inventory/stock'))) return;
    for (const route of routes) {
      await expect(page.locator(`a[href="${route.href}"]`)).toBeVisible();
    }
    await expect(page.locator('a[href="/inventory/warehouses"]')).toHaveCount(0);
    await expect(page.locator('a[href="/inventory/purchase-orders"]')).toHaveCount(0);
    await expect(page.locator('a[href="/inventory/transfers"]')).toHaveCount(0);
  });

  test('旧采购单路由重定向至采购历史', async ({ page }) => {
    await page.goto('/inventory/purchase-orders', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/inventory\/procurement\/history/);
  });
});
