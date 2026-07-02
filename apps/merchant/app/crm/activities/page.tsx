import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, asList, asListTotal, type Contact, type Lead, type OnboardingProfile, type PaginatedResponse } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { CrmActivity } from '@meridian/shared';
import { ActivitiesPanel } from './_components/activities-panel';

export default async function ActivitiesPage() {
  const t = await getTranslations('merchant.crm.activities');
  const token = await getToken();
  if (!token) return null;

  const [activities, contactsRes, leadsRes, profile] = await Promise.all([
    apiFetch<CrmActivity[]>('/merchant/activities', {}, token).catch(() => []),
    apiFetch<PaginatedResponse<Contact> | Contact[]>('/merchant/contacts', {}, token).catch(
      () => [] as Contact[],
    ),
    apiFetch<PaginatedResponse<Lead> | Lead[]>('/merchant/leads', {}, token).catch(() => [] as Lead[]),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const tDash = await getTranslations('merchant.dashboard');

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: activities.length },
            { title: tDash('contacts'), value: asListTotal(contactsRes) },
            { title: tDash('openLeads'), value: asListTotal(leadsRes) },
          ]}
        />
        <ActivitiesPanel
          activities={activities}
          contacts={asList(contactsRes)}
          leads={asList(leadsRes)}
          token={token}
        />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
