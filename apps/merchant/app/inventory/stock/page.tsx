import { Suspense } from 'react';

import { ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import type { OnboardingProfile } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { StockLevelWithDetails, TenantInventorySettings, Warehouse } from '@meridian/shared';

import { StockLevelsTable } from './_components/stock-levels-table';
import { buildInventoryQuery, emptyInventoryPage, normalizeInventoryPage } from '@/lib/inventory';
import type { InventoryPaginated } from '@/lib/inventory';

interface StockPageProps {
  searchParams: Promise<{ warehouseId?: string; q?: string; page?: string }>;
}

/** 商户端 — 按仓库查看 SKU 在库数量 */
export default async function StockPage({ searchParams }: StockPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const warehouseId = params.warehouseId;
  const q = params.q;
  const page = Number(params.page ?? '1');

  const [levelsRes, warehouses, settings, profile] = await Promise.all([
    apiFetch<InventoryPaginated<StockLevelWithDetails>>(
      `/merchant/inventory/stock-levels${buildInventoryQuery({
        warehouseId,
        q,
        page,
        limit: 20,
      })}`,
      {},
      token,
    ).catch(() => emptyInventoryPage<StockLevelWithDetails>(20)),
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<TenantInventorySettings>('/merchant/inventory/settings', {}, token).catch(() => ({
      defaultReorderThreshold: 5,
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const t = await getTranslations('merchant.inventory.stock');

  const levelsPage = normalizeInventoryPage(levelsRes);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <Suspense>
          <StockLevelsTable
            initialLevels={levelsPage.items}
            initialTotal={levelsPage.total}
            warehouses={warehouses}
            token={token}
            isOwner={isMerchantOwner(token)}
            defaultThreshold={settings.defaultReorderThreshold}
          />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
