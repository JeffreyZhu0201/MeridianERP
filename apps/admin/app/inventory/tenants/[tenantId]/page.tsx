import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type {
  PlatformTenantInventorySummary,
  PurchaseOrder,
  StockAdjustmentWithDetails,
} from '@meridian/shared';

import { ListPagination } from '@meridian/ui';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type MerchantDetail, type PaginatedResponse as ApiPaginatedResponse } from '@/lib/api';
import { requireToken } from '@/lib/auth';

import { TenantInventorySummary } from './_components/tenant-inventory-summary';

interface TenantInventoryPageProps {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{
    tab?: string;
    adjPage?: string;
    adjLimit?: string;
    adjFrom?: string;
    adjTo?: string;
    poPage?: string;
    poLimit?: string;
    poStatus?: string;
  }>;
}

export default async function TenantInventoryPage({
  params,
  searchParams,
}: TenantInventoryPageProps) {
  const token = await requireToken();

  const { tenantId } = await params;
  const query = await searchParams;
  const t = await getTranslations('admin.inventory');

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

  const adjLimit = query.adjLimit ?? '50';
  const adjPage = query.adjPage ?? '1';
  const adjQuery = new URLSearchParams({ limit: adjLimit, page: adjPage });
  if (query.adjFrom) adjQuery.set('from', query.adjFrom);
  if (query.adjTo) adjQuery.set('to', query.adjTo);

  const poLimit = query.poLimit ?? '50';
  const poPage = query.poPage ?? '1';
  const poQuery = new URLSearchParams({ limit: poLimit, page: poPage });
  if (query.poStatus) poQuery.set('status', query.poStatus);

  const [adjustmentsRes, purchaseOrdersRes, merchantsRes] = await Promise.all([
    apiFetch<ApiPaginatedResponse<StockAdjustmentWithDetails>>(
      `/platform/inventory/tenants/${tenantId}/adjustments?${adjQuery.toString()}`,
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: Number(adjLimit) } })),
    apiFetch<ApiPaginatedResponse<PurchaseOrder>>(
      `/platform/inventory/tenants/${tenantId}/purchase-orders?${poQuery.toString()}`,
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: Number(poLimit) } })),
    apiFetch<ApiPaginatedResponse<MerchantDetail>>('/platform/merchants?limit=500', {}, token).catch(
      () => ({ data: [], meta: { total: 0, page: 1, limit: 500 } }),
    ),
  ]);

  const merchant = merchantsRes.data.find((m) => m.tenantId === tenantId);
  const businessName = merchant?.businessName ?? `Tenant ${tenantId.slice(0, 8)}`;

  return (
    <AdminShellWithSession>
      <div className="space-y-4">
        <TenantInventorySummary
          tenantId={tenantId}
          businessName={businessName}
          summary={summary}
          adjustments={adjustmentsRes.data}
          adjustmentsMeta={adjustmentsRes.meta}
          purchaseOrders={purchaseOrdersRes.data}
          purchaseOrdersMeta={purchaseOrdersRes.meta}
          adjFrom={query.adjFrom ?? ''}
          adjTo={query.adjTo ?? ''}
          poStatus={query.poStatus ?? ''}
        />
        {query.tab === 'adjustments' ? (
          <Suspense>
            <ListPagination
              basePath={`/inventory/tenants/${tenantId}`}
              total={adjustmentsRes.meta.total}
              page={adjustmentsRes.meta.page}
              limit={adjustmentsRes.meta.limit}
              pageParam="adjPage"
              summary={t('adjustmentsPagination', {
                page: adjustmentsRes.meta.page,
                totalPages: Math.max(
                  1,
                  Math.ceil(adjustmentsRes.meta.total / adjustmentsRes.meta.limit),
                ),
                total: adjustmentsRes.meta.total,
              })}
            />
          </Suspense>
        ) : null}
        {query.tab === 'purchase-orders' ? (
          <Suspense>
            <ListPagination
              basePath={`/inventory/tenants/${tenantId}`}
              total={purchaseOrdersRes.meta.total}
              page={purchaseOrdersRes.meta.page}
              limit={purchaseOrdersRes.meta.limit}
              pageParam="poPage"
              summary={t('purchaseOrdersPagination', {
                page: purchaseOrdersRes.meta.page,
                totalPages: Math.max(
                  1,
                  Math.ceil(purchaseOrdersRes.meta.total / purchaseOrdersRes.meta.limit),
                ),
                total: purchaseOrdersRes.meta.total,
              })}
            />
          </Suspense>
        ) : null}
      </div>
    </AdminShellWithSession>
  );
}
