import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { buildInventoryQuery, emptyInventoryPage, normalizeInventoryPage, type InventoryPaginated } from '@/lib/inventory';
import type { StockTransferWithDetails, Warehouse } from '@meridian/shared';

import { TransfersTable } from './_components/transfers-table';

interface TransfersPageProps {
  searchParams: Promise<{
    fromWarehouseId?: string;
    toWarehouseId?: string;
    page?: string;
  }>;
}
export default async function TransfersPage({ searchParams }: TransfersPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const page = Number(params.page ?? '1');

  const [transfersRes, warehouses, profile] = await Promise.all([
    apiFetch<InventoryPaginated<StockTransferWithDetails>>(
      `/merchant/inventory/transfers${buildInventoryQuery({
        fromWarehouseId: params.fromWarehouseId,
        toWarehouseId: params.toWarehouseId,
        page,
        limit: 20,
      })}`,
      {},
      token,
    ).catch(() => emptyInventoryPage<StockTransferWithDetails>(20)),
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const t = await getTranslations('merchant.inventory.transfers');
  const tWh = await getTranslations('merchant.inventory.warehouses');
  const transfersPage = normalizeInventoryPage(transfersRes);

  const lineCount = transfersPage.items.reduce((sum, tr) => sum + tr.lines.length, 0);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: transfersPage.total },
            { title: tWh('title'), value: warehouses.length },
            { title: t('lineCount'), value: lineCount },
          ]}
        />
        <Suspense>
          <TransfersTable
            transfers={transfersPage.items}
            total={transfersPage.total}
            page={page}
            warehouses={warehouses}
          />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
