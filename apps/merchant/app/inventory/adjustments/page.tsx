import { Suspense } from 'react';

import { PageHeader } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { inventoryZh } from '@/lib/i18n/inventory-zh';
import { buildInventoryQuery, emptyInventoryPage, normalizeInventoryPage, type InventoryPaginated } from '@/lib/inventory';
import type { StockAdjustmentWithDetails, Warehouse } from '@meridian/shared';

import {
  AdjustmentForm,
  AdjustmentsHistoryTable,
} from './_components/adjustment-form';
import { productsToVariantOptions } from '@/lib/product-variants';

interface AdjustmentsPageProps {
  searchParams: Promise<{
    warehouseId?: string;
    reason?: string;
    from?: string;
    to?: string;
    page?: string;
    variantId?: string;
  }>;
}

/** 商户端 — 库存调整录入与历史查询 */
export default async function AdjustmentsPage({ searchParams }: AdjustmentsPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const page = Number(params.page ?? '1');

  const [warehouses, productsRes, historyRes, profile] = await Promise.all([
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<Product[]>('/merchant/products?limit=500', {}, token).catch(() => []),
    apiFetch<InventoryPaginated<StockAdjustmentWithDetails>>(
      `/merchant/inventory/adjustments${buildInventoryQuery({
        warehouseId: params.warehouseId,
        reason: params.reason,
        from: params.from,
        to: params.to,
        page,
        limit: 20,
      })}`,
      {},
      token,
    ).catch(() => emptyInventoryPage<StockAdjustmentWithDetails>(20)),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const defaultWarehouse = warehouses.find((w) => w.isDefault);
  const zh = inventoryZh.adjustments;

  const historyPage = normalizeInventoryPage(historyRes);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <PageHeader title={zh.title} description={zh.description} />
        <Suspense>
          <AdjustmentForm
            warehouses={warehouses}
            variants={productsToVariantOptions(productsRes)}
            token={token}
            defaultWarehouseId={defaultWarehouse?.id}
            prefillVariantId={params.variantId}
            prefillWarehouseId={params.warehouseId}
          />
          <AdjustmentsHistoryTable
            adjustments={historyPage.items}
            total={historyPage.total}
            page={page}
            warehouses={warehouses}
          />
        </Suspense>
      </div>
    </MerchantShellWrapper>
  );
}
