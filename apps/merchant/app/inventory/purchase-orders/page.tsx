import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { buildInventoryQuery, emptyInventoryPage, normalizeInventoryPage, type InventoryPaginated } from '@/lib/inventory';
import type { PurchaseOrder, Warehouse } from '@meridian/shared';

import { PurchaseOrdersTable } from './_components/purchase-orders-table';

interface PurchaseOrdersPageProps {
  searchParams: Promise<{ status?: string; warehouseId?: string; page?: string }>;
}

/** 商户端 — 采购订单列表 */
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
    ).catch(() => emptyInventoryPage<PurchaseOrder>(20)),
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const t = await getTranslations('merchant.inventory.purchaseOrders');

  const ordersPage = normalizeInventoryPage(ordersRes);

  const openCount = ordersPage.items.filter(
    (po) => po.status !== 'RECEIVED' && po.status !== 'CANCELLED',
  ).length;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: ordersPage.total },
            { title: t('warehouse'), value: warehouses.length },
            { title: t('status'), value: openCount },
          ]}
        />
        <Suspense>
          <PurchaseOrdersTable
            orders={ordersPage.items}
            total={ordersPage.total}
            page={page}
            warehouses={warehouses}
            token={token}
          />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
