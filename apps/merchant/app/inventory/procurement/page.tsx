import Link from 'next/link';
import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { BranchProcurementCatalogItem, ProcurementReceivingAddress } from '@meridian/shared';

import { ProcurementShop } from './_components/procurement-shop';

export default async function ProcurementShopPage() {
  const token = await getToken();
  if (!token) return null;

  const [catalog, profile, addresses] = await Promise.all([
    apiFetch<BranchProcurementCatalogItem[]>(
      '/merchant/procurement/catalog',
      {},
      token,
    ).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
    apiFetch<ProcurementReceivingAddress[]>(
      '/merchant/settings/procurement-addresses?activeOnly=true',
      {},
      token,
    ).catch(() => []),
  ]);

  const t = await getTranslations('merchant.inventory.procurement');

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <BentoListHeader metrics={[{ title: t('catalog'), value: catalog.length }]} />
        <ListPageFrame
          title={t('shopTitle')}
          description={t('shopDescription')}
          action={
            <Link
              href="/inventory/procurement/history"
              className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
            >
              {t('historyTitle')}
            </Link>
          }
        >
          <Suspense>
            <ProcurementShop catalog={catalog} addresses={addresses} token={token} />
          </Suspense>
        </ListPageFrame>
      </div>
    </MerchantShellWrapper>
  );
}
