import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';
import { LeadStage } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  asListTotal,
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

  const leads = asList(leadsRes);
  const openLeads = leads.filter(
    (lead) => lead.stage !== LeadStage.WON && lead.stage !== LeadStage.LOST,
  ).length;
  const tDash = await getTranslations('merchant.dashboard');

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('title'), value: asListTotal(leadsRes) },
            { title: tDash('openLeads'), value: openLeads },
            { title: tDash('contacts'), value: asListTotal(contactsRes) },
          ]}
        />
        <ListPageFrame title={t('title')} description={t('description')}>
          <Suspense>
            <LeadsTable leads={leads} contacts={asList(contactsRes)} token={token} />
          </Suspense>
        </ListPageFrame>
      </div>
    </MerchantShellWrapper>
  );
}
