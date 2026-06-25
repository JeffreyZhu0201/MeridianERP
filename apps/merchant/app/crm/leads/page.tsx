import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  type Contact,
  type Lead,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { LeadsTable } from './_components/leads-table';

export default async function LeadsPage() {
  const t = await getTranslations('merchant.crm.leads');
  const token = await getToken();
  if (!token) return null;

  const [leadsRes, contactsRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Lead> | Lead[]>('/merchant/leads', {}, token).catch(() => [] as Lead[]),
    apiFetch<PaginatedResponse<Contact> | Contact[]>('/merchant/contacts', {}, token).catch(
      () => [] as Contact[],
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <Suspense>
          <LeadsTable leads={asList(leadsRes)} contacts={asList(contactsRes)} token={token} />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
