import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, asList, type Contact, type OnboardingProfile, type PaginatedResponse } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ContactsTable } from './_components/contacts-table';

export default async function ContactsPage() {
  const t = await getTranslations('merchant.crm.contacts');
  const token = await getToken();
  if (!token) return null;

  const [contactsRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Contact> | Contact[]>('/merchant/contacts', {}, token).catch(
      () => [] as Contact[],
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <ContactsTable contacts={asList(contactsRes)} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
