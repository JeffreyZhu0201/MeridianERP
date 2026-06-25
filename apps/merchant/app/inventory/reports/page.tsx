import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { buildInventoryQuery, emptyInventoryPage, normalizeInventoryPage, type InventoryPaginated } from '@/lib/inventory';
import type { LowStockAlertItem, StockAdjustmentWithDetails, StockLevelWithDetails } from '@meridian/shared';

import { InventoryReportsTabs } from './_components/inventory-reports-tabs';

interface ReportsPageProps {
  searchParams: Promise<{ tab?: string; from?: string; to?: string }>;
}

/** 商户端 — 库存汇总与调整报表 */
export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;

  const [stockRes, adjustmentsRes, alertsRes, profile] = await Promise.all([
    apiFetch<InventoryPaginated<StockLevelWithDetails>>(
      `/merchant/inventory/reports/stock${buildInventoryQuery({ limit: 500 })}`,
      {},
      token,
    ).catch(() =>
      apiFetch<InventoryPaginated<StockLevelWithDetails>>(
        `/merchant/inventory/stock-levels${buildInventoryQuery({ limit: 500 })}`,
        {},
        token,
      ).catch(() => emptyInventoryPage<StockLevelWithDetails>(500)),
    ),
    apiFetch<InventoryPaginated<StockAdjustmentWithDetails>>(
      `/merchant/inventory/reports/adjustments${buildInventoryQuery({
        from: params.from,
        to: params.to,
        limit: 500,
      })}`,
      {},
      token,
    ).catch(() =>
      apiFetch<InventoryPaginated<StockAdjustmentWithDetails>>(
        `/merchant/inventory/adjustments${buildInventoryQuery({
          from: params.from,
          to: params.to,
          limit: 500,
        })}`,
        {},
        token,
      ).catch(() => emptyInventoryPage<StockAdjustmentWithDetails>(500)),
    ),
    apiFetch<{ items: LowStockAlertItem[] }>('/merchant/inventory/alerts/low-stock', {}, token).catch(
      () => ({ items: [] }),
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const stockPage = normalizeInventoryPage(stockRes);
  const adjustmentsPage = normalizeInventoryPage(adjustmentsRes);
  const totalUnits = stockPage.items.reduce((sum, l) => sum + l.quantityOnHand, 0);
  const skuCount = new Set(stockPage.items.map((l) => l.variantId)).size;
  const t = await getTranslations('merchant.inventory.reports');

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader
          metrics={[
            { title: t('totalSkus'), value: skuCount || stockPage.total },
            { title: t('totalUnits'), value: totalUnits },
            { title: t('lowStockCount'), value: alertsRes.items.length },
          ]}
        />
        <Suspense>
          <InventoryReportsTabs
            stockLevels={stockPage.items}
            adjustments={adjustmentsPage.items}
            metrics={{
              totalSkus: skuCount || stockPage.total,
              totalUnits,
              lowStockCount: alertsRes.items.length,
            }}
            token={token}
          />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
