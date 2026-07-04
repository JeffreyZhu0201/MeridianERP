import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';
import type { CrmStoreCustomerListItem } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  type Contact,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ContactsPanel } from './_components/contacts-panel';

export default async function ContactsPage() {
  const t = await getTranslations('merchant.crm.contacts');
  const token = await getToken();
  if (!token) return null;

  const [contactsRes, storeCustomersRes, profile] = await Promise.all([
    apiFetch<PaginatedResponse<Contact> | Contact[]>('/merchant/contacts', {}, token).catch(
      () => [] as Contact[],
    ),
    apiFetch<CrmStoreCustomerListItem[]>('/merchant/crm/store-customers', {}, token).catch(
      () => [] as CrmStoreCustomerListItem[],
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const contacts = asList(contactsRes);
  const storeCustomers = storeCustomersRes ?? [];

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')}>
        <BentoListHeader
          metrics={[
            { title: t('metrics.storeCustomers'), value: storeCustomers.length },
            { title: t('metrics.manualContacts'), value: contacts.length },
          ]}
        />
        <ContactsPanel
          storeCustomers={storeCustomers}
          contacts={contacts}
          token={token}
        />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
