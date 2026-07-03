import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame, formatMoney } from '@meridian/ui/server';
import { OnboardingStatus } from '@meridian/shared';

import { ListPagination } from '@/components/list-pagination';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import {
  apiFetch,
  type AllocationOrder,
  type MasterSku,
  type MerchantListItem,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { AllocationsView } from './_components/allocations-view';

interface AllocationsPageProps {
  searchParams: Promise<{ skuPage?: string; tenantId?: string; status?: string }>;
}

export default async function AllocationsPage({ searchParams }: AllocationsPageProps) {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.allocations');
  const params = await searchParams;
  const skuPage = params.skuPage ?? '1';
  const skuLimit = 20;

  const allocationQuery = new URLSearchParams();
  if (params.tenantId) allocationQuery.set('tenantId', params.tenantId);
  if (params.status) allocationQuery.set('status', params.status);

  const [masterSkusRes, allocations, merchantsRes, flagshipCatalog] = await Promise.all([
    apiFetch<PaginatedResponse<MasterSku>>(
      `/platform/allocations/master-skus?page=${skuPage}&limit=${skuLimit}`,
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: skuLimit } })),
    apiFetch<AllocationOrder[]>(
      `/platform/allocations${allocationQuery.toString() ? `?${allocationQuery.toString()}` : ''}`,
      {},
      token,
    ).catch(() => []),
    apiFetch<PaginatedResponse<MerchantListItem>>(
      `/platform/merchants?status=${OnboardingStatus.APPROVED}&limit=100`,
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 100 } })),
    apiFetch<Array<{ id: string; synced: boolean }>>('/platform/flagship-catalog', {}, token).catch(
      () => [],
    ),
  ]);

  const syncById = new Map(flagshipCatalog.map((row) => [row.id, row.synced]));
  const masterSkus = (masterSkusRes.data ?? []).map((sku) => ({
    ...sku,
    synced: syncById.get(sku.id) ?? false,
  }));
  const skuMeta = masterSkusRes.meta ?? { total: masterSkus.length, page: 1, limit: skuLimit };

  const approvedMerchants = merchantsRes.data
    .map((m) => {
      const row = m as MerchantListItem & { tenantId?: string };
      return row.tenantId
        ? { id: row.id, businessName: row.businessName, tenantId: row.tenantId }
        : null;
    })
    .filter((m): m is { id: string; businessName: string; tenantId: string } => m !== null);

  const draftCount = allocations.filter((a) => a.status === 'DRAFT').length;
  const skuTotalPages = Math.max(1, Math.ceil(skuMeta.total / skuMeta.limit));

  const metrics: Array<{ title: string; value: number | string; description?: string }> = [
    { title: t('masterSkus'), value: skuMeta.total },
    { title: t('allocationOrders'), value: allocations.length },
    { title: t('draftOrders'), value: draftCount },
  ];

  if (masterSkus.length > 0) {
    const onHand = masterSkus.reduce((sum, sku) => sum + sku.quantityOnHand, 0);
    metrics.push({
      title: t('skuColumns.onHand'),
      value: onHand,
      description: formatMoney(
        masterSkus.reduce((sum, sku) => sum + Number(sku.wholesalePrice) * sku.quantityOnHand, 0),
      ),
    });
  }

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame title={t('title')} description={t('description')}>
          <AllocationsView
            masterSkus={masterSkus}
            skuMeta={skuMeta}
            allocations={allocations}
            merchants={approvedMerchants}
            token={token}
            filterTenantId={params.tenantId ?? ''}
            filterStatus={params.status ?? ''}
          />
          <Suspense>
            <ListPagination
              basePath="/allocations"
              total={skuMeta.total}
              page={skuMeta.page}
              limit={skuMeta.limit}
              pageParam="skuPage"
              summary={t('skuPagination', {
                page: skuMeta.page,
                totalPages: skuTotalPages,
                total: skuMeta.total,
              })}
            />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
