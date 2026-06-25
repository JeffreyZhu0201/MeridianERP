import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
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

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <DistributorsTable distributors={distributors} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
