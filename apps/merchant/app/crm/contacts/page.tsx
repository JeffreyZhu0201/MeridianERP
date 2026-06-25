import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  asListTotal,
  type Contact,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
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

  const contacts = asList(contactsRes);
  const withCompany = contacts.filter((c) => c.companyId).length;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: asListTotal(contactsRes) },
            { title: t('company'), value: withCompany },
          ]}
        />
        <ContactsTable contacts={contacts} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
