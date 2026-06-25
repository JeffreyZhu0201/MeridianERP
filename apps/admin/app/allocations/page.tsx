import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';
import { OnboardingStatus } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import {
  apiFetch,
  type AllocationOrder,
  type MasterSku,
  type MerchantListItem,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { AllocationsView } from './_components/allocations-view';

export default async function AllocationsPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('admin.allocations');

  const [masterSkusRes, allocations, merchantsRes] = await Promise.all([
    apiFetch<{ data: MasterSku[] }>('/platform/allocations/master-skus', {}, token).catch(
      () => ({ data: [] }),
    ),
    apiFetch<AllocationOrder[]>('/platform/allocations', {}, token).catch(() => []),
    apiFetch<PaginatedResponse<MerchantListItem>>(
      `/platform/merchants?status=${OnboardingStatus.APPROVED}&limit=100`,
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 100 } })),
  ]);

  const masterSkus = masterSkusRes.data ?? [];

  const approvedMerchants = merchantsRes.data
    .map((m) => {
      const row = m as MerchantListItem & { tenantId?: string };
      return row.tenantId
        ? { id: row.id, businessName: row.businessName, tenantId: row.tenantId }
        : null;
    })
    .filter((m): m is { id: string; businessName: string; tenantId: string } => m !== null);

  const draftCount = allocations.filter((a) => a.status === 'DRAFT').length;
  const formatMoney = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);

  const metrics: Array<{ title: string; value: number | string; description?: string }> = [
    { title: t('masterSkus'), value: masterSkus.length },
    { title: t('allocationOrders'), value: allocations.length },
    { title: 'Draft', value: draftCount },
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
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame title={t('title')} description={t('description')}>
          <AllocationsView
            masterSkus={masterSkus}
            allocations={allocations}
            merchants={approvedMerchants}
            token={token}
          />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
