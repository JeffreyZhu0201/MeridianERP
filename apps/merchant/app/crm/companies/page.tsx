import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  asListTotal,
  type Company,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
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

  const companies = asList(companiesRes);
  const linkedContacts = companies.reduce((sum, c) => sum + (c._count?.contacts ?? 0), 0);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: asListTotal(companiesRes) },
            { title: t('contacts'), value: linkedContacts },
          ]}
        />
        <CompaniesTable companies={companies} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
