import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, asList, type Contact, type Lead, type OnboardingProfile, type PaginatedResponse } from '@/lib/api';
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

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
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
