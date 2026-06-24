import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type MerchantDetail, type PaginatedResponse as ApiPaginatedResponse } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type {
  PaginatedResponse as InventoryPaginated,
  PlatformTenantInventorySummary,
  PurchaseOrder,
  StockAdjustmentWithDetails,
} from '@meridian/shared';

import { TenantInventorySummary } from './_components/tenant-inventory-summary';

interface TenantInventoryPageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function TenantInventoryPage({ params }: TenantInventoryPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { tenantId } = await params;

  let summary: PlatformTenantInventorySummary;
  try {
    summary = await apiFetch<PlatformTenantInventorySummary>(
      `/platform/inventory/tenants/${tenantId}/summary`,
      {},
      token,
    );
  } catch {
    notFound();
  }

  const [adjustmentsRes, purchaseOrdersRes, merchantsRes] = await Promise.all([
    apiFetch<InventoryPaginated<StockAdjustmentWithDetails>>(
      `/platform/inventory/tenants/${tenantId}/adjustments?limit=20`,
      {},
      token,
    ).catch(() => ({ items: [], total: 0, page: 1, limit: 20 })),
    apiFetch<InventoryPaginated<PurchaseOrder>>(
      `/platform/inventory/tenants/${tenantId}/purchase-orders?limit=20`,
      {},
      token,
    ).catch(() => ({ items: [], total: 0, page: 1, limit: 20 })),
    apiFetch<ApiPaginatedResponse<MerchantDetail>>('/platform/merchants?limit=500', {}, token).catch(
      () => ({ data: [], meta: { total: 0, page: 1, limit: 500 } }),
    ),
  ]);

  const merchant = merchantsRes.data.find((m) => m.tenantId === tenantId);
  const businessName = merchant?.businessName ?? `Tenant ${tenantId.slice(0, 8)}`;

  return (
    <AdminShellWrapper>
      <Suspense>
        <TenantInventorySummary
          tenantId={tenantId}
          businessName={businessName}
          summary={summary}
          adjustments={adjustmentsRes.items}
          purchaseOrders={purchaseOrdersRes.items}
        />
      </Suspense>
    </AdminShellWrapper>
  );
}
