import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { buildInventoryQuery, emptyInventoryPage, normalizeInventoryPage, type InventoryPaginated } from '@/lib/inventory';
import type { StockAdjustmentWithDetails } from '@meridian/shared';

import { AdjustmentForm } from './_components/adjustment-form';
import { AdjustmentsHistoryTable } from './_components/adjustments-history-table';
import { productsToVariantOptions } from '@/lib/product-variants';

interface AdjustmentsPageProps {
  searchParams: Promise<{
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

  const [productsRes, historyRes, profile] = await Promise.all([
    apiFetch<Product[]>('/merchant/products?limit=500', {}, token).catch(() => []),
    apiFetch<InventoryPaginated<StockAdjustmentWithDetails>>(
      `/merchant/inventory/adjustments${buildInventoryQuery({
        reason: params.reason,
        from: params.from,
        to: params.to,
        page,
        limit: 20,
      })}`,
      {},
      token,
    ).catch(() => emptyInventoryPage<StockAdjustmentWithDetails>(20)),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const t = await getTranslations('merchant.inventory.adjustments');
  const historyPage = normalizeInventoryPage(historyRes);
  const variantCount = productsToVariantOptions(productsRes).length;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader
          metrics={[
            { title: t('history'), value: historyPage.total },
            { title: t('variant'), value: variantCount },
          ]}
        />
        <Suspense>
          <AdjustmentForm
            variants={productsToVariantOptions(productsRes)}
            token={token}
            prefillVariantId={params.variantId}
          />
          <AdjustmentsHistoryTable
            adjustments={historyPage.items}
            total={historyPage.total}
            page={page}
          />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
