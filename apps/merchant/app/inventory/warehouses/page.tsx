import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { OnboardingProfile } from '@/lib/api';
import type { Warehouse } from '@meridian/shared';

import { WarehousesTable } from './_components/warehouses-table';
export default async function WarehousesPage() {
  const token = await getToken();
  if (!token) return null;

  const [warehouses, profile] = await Promise.all([
    apiFetch<Warehouse[]>('/merchant/inventory/warehouses', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const t = await getTranslations('merchant.inventory.warehouses');
  const tCommon = await getTranslations('common');

  const activeCount = warehouses.filter((w) => w.isActive).length;
  const defaultCount = warehouses.filter((w) => w.isDefault).length;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: warehouses.length },
            { title: tCommon('active'), value: activeCount },
            { title: t('defaultBadge'), value: defaultCount },
          ]}
        />
        <Suspense>
          <WarehousesTable
            warehouses={warehouses}
            token={token}
            isOwner={isMerchantOwner(token)}
          />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
