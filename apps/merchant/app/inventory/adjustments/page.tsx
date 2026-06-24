import { Suspense } from 'react';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile, type PaginatedResponse, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { buildInventoryQuery, type InventoryPaginated } from '@/lib/inventory';
import type { StockAdjustmentWithDetails, Warehouse } from '@meridian/shared';

import {
  AdjustmentForm,
  AdjustmentsHistoryTable,
  productsToVariantOptions,
} from './_components/adjustment-form';

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

export default async function AdjustmentsPage({ searchParams }: AdjustmentsPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const page = Number(params.page ?? '1');

  const [warehouses, productsRes, historyRes, profile] = await Promise.all([
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<PaginatedResponse<Product>>('/merchant/products?limit=500', {}, token).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 500 },
    })),
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
    ).catch(() => ({ items: [], total: 0, page: 1, limit: 20 })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const defaultWarehouse = warehouses.find((w) => w.isDefault);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stock adjustments</h1>
        <Suspense>
          <AdjustmentForm
            warehouses={warehouses}
            variants={productsToVariantOptions(productsRes.data)}
            token={token}
            defaultWarehouseId={defaultWarehouse?.id}
            prefillVariantId={params.variantId}
            prefillWarehouseId={params.warehouseId}
          />
          <AdjustmentsHistoryTable
            adjustments={historyRes.items}
            total={historyRes.total}
            page={page}
            warehouses={warehouses}
          />
        </Suspense>
      </div>
    </MerchantShellWrapper>
  );
}
