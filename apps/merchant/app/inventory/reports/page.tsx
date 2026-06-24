import { Suspense } from 'react';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { buildInventoryQuery, type InventoryPaginated } from '@/lib/inventory';
import type { LowStockAlertItem, StockAdjustmentWithDetails, StockLevelWithDetails } from '@meridian/shared';

import { InventoryReportsTabs } from './_components/inventory-reports-tabs';

interface ReportsPageProps {
  searchParams: Promise<{ tab?: string; from?: string; to?: string }>;
}

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
      ).catch(() => ({ items: [], total: 0, page: 1, limit: 500 })),
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
      ).catch(() => ({ items: [], total: 0, page: 1, limit: 500 })),
    ),
    apiFetch<{ items: LowStockAlertItem[] }>('/merchant/inventory/alerts/low-stock', {}, token).catch(
      () => ({ items: [] }),
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const totalUnits = stockRes.items.reduce((sum, l) => sum + l.quantityOnHand, 0);
  const skuCount = new Set(stockRes.items.map((l) => l.variantId)).size;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory reports</h1>
        <Suspense>
          <InventoryReportsTabs
            stockLevels={stockRes.items}
            adjustments={adjustmentsRes.items}
            metrics={{
              totalSkus: skuCount || stockRes.total,
              totalUnits,
              lowStockCount: alertsRes.items.length,
            }}
            token={token}
          />
        </Suspense>
      </div>
    </MerchantShellWrapper>
  );
}
