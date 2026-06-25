import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, asList, type Company, type OnboardingProfile, type PaginatedResponse } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CompaniesTable } from './_components/companies-table';

export default async function CompaniesPage() {
  const t = await getTranslations('merchant.crm.companies');
  const token = await getToken();
  if (!token) return null;

  const [companiesRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Company> | Company[]>('/merchant/companies', {}, token).catch(
      () => [] as Company[],
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <CompaniesTable companies={asList(companiesRes)} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
