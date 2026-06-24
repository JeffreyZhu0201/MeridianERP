import { Suspense } from 'react';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { buildInventoryQuery, type InventoryPaginated } from '@/lib/inventory';
import type { PurchaseOrder, Warehouse } from '@meridian/shared';

import { PurchaseOrdersTable } from './_components/purchase-orders-table';

interface PurchaseOrdersPageProps {
  searchParams: Promise<{ status?: string; warehouseId?: string; page?: string }>;
}

export default async function PurchaseOrdersPage({ searchParams }: PurchaseOrdersPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const page = Number(params.page ?? '1');

  const [ordersRes, warehouses, profile] = await Promise.all([
    apiFetch<InventoryPaginated<PurchaseOrder>>(
      `/merchant/inventory/purchase-orders${buildInventoryQuery({
        status: params.status,
        warehouseId: params.warehouseId,
        page,
        limit: 20,
      })}`,
      {},
      token,
    ).catch(() => ({ items: [], total: 0, page: 1, limit: 20 })),
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Purchase orders</h1>
        <Suspense>
          <PurchaseOrdersTable
            orders={ordersRes.items}
            total={ordersRes.total}
            page={page}
            warehouses={warehouses}
            token={token}
          />
        </Suspense>
      </div>
    </MerchantShellWrapper>
  );
}
