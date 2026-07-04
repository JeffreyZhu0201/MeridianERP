'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@meridian/ui';
import type { CrmStoreCustomerListItem } from '@meridian/shared';

import { type Contact } from '@/lib/api';
import { ContactsTable } from './contacts-table';
import { StoreCustomersTable } from './store-customers-table';

interface ContactsPanelProps {
  storeCustomers: CrmStoreCustomerListItem[];
  contacts: Contact[];
  token: string;
}

function ContactsPanelInner({
  storeCustomers,
  contacts,
  token,
}: ContactsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('merchant.crm.contacts');
  const tab = searchParams.get('tab') === 'manual' ? 'manual' : 'store';

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.push(`/crm/contacts?${params.toString()}`);
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="store">
          {t('tabs.storeCustomers')} ({storeCustomers.length})
        </TabsTrigger>
        <TabsTrigger value="manual">
          {t('tabs.manualContacts')} ({contacts.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="store" className="mt-4">
        <StoreCustomersTable storeCustomers={storeCustomers} />
      </TabsContent>
      <TabsContent value="manual" className="mt-4">
        <ContactsTable contacts={contacts} token={token} />
      </TabsContent>
    </Tabs>
  );
}

export function ContactsPanel(props: ContactsPanelProps) {
  return (
    <Suspense fallback={null}>
      <ContactsPanelInner {...props} />
    </Suspense>
  );
}
