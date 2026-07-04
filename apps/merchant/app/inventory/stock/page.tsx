import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import type { OnboardingProfile } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { StockLevelWithDetails, TenantInventorySettings } from '@meridian/shared';

import { StockLevelsTable } from './_components/stock-levels-table';
import { buildInventoryQuery, emptyInventoryPage, normalizeInventoryPage } from '@/lib/inventory';
import type { InventoryPaginated } from '@/lib/inventory';

interface StockPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function StockPage({ searchParams }: StockPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const q = params.q;
  const page = Number(params.page ?? '1');

  const [levelsRes, settings, profile] = await Promise.all([
    apiFetch<InventoryPaginated<StockLevelWithDetails>>(
      `/merchant/inventory/stock-levels${buildInventoryQuery({
        q,
        page,
        limit: 20,
      })}`,
      {},
      token,
    ).catch(() => emptyInventoryPage<StockLevelWithDetails>(20)),
    apiFetch<TenantInventorySettings>('/merchant/inventory/settings', {}, token).catch(() => ({
      defaultReorderThreshold: 5,
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const t = await getTranslations('merchant.inventory.stock');
  const levelsPage = normalizeInventoryPage(levelsRes);

  const lowStockCount = levelsPage.items.filter(
    (l) =>
      l.quantityOnHand <= (l.variant.reorderThreshold ?? settings.defaultReorderThreshold),
  ).length;
  const tDash = await getTranslations('merchant.dashboard');

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader
          metrics={[
            { title: t('sku'), value: levelsPage.total },
            { title: tDash('lowStock'), value: lowStockCount },
          ]}
        />
        <Suspense>
          <StockLevelsTable
            initialLevels={levelsPage.items}
            initialTotal={levelsPage.total}
            token={token}
            isOwner={isMerchantOwner(token)}
            defaultThreshold={settings.defaultReorderThreshold}
          />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
