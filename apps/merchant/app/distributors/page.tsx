import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  asListTotal,
  type Distributor,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { DistributorsTable } from './_components/distributors-table';

export default async function DistributorsPage() {
  const t = await getTranslations('merchant.distributors');
  const token = await getToken();
  if (!token) return null;

  const [distributorsRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Distributor> | Distributor[]>(
      '/merchant/distributors',
      {},
      token,
    ).catch(() => [] as Distributor[]),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const distributors = asList(distributorsRes);
  const activeCount = distributors.filter((d) => d.isActive).length;
  const bindingCount = distributors.reduce((sum, d) => sum + (d._count?.bindings ?? 0), 0);
  const tDash = await getTranslations('merchant.dashboard');

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: asListTotal(distributorsRes) },
            { title: tDash('activeDistributors'), value: activeCount },
            { title: t('table.bindings'), value: bindingCount },
          ]}
        />
        <DistributorsTable distributors={distributors} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
