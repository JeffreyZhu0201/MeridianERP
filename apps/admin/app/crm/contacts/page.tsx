import { getTranslations } from 'next-intl/server';
import type { PlatformCrmCompany, PlatformCrmContact } from '@meridian/shared';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ContactsTable } from './_components/contacts-table';

export default async function CrmContactsPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.crm.contacts');
  let contacts: PlatformCrmContact[] = [];
  let companies: PlatformCrmCompany[] = [];
  try {
    [contacts, companies] = await Promise.all([
      apiFetch<PlatformCrmContact[]>('/platform/crm/contacts', {}, token),
      apiFetch<PlatformCrmCompany[]>('/platform/crm/companies', {}, token),
    ]);
  } catch {
    contacts = [];
    companies = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('title'), value: contacts.length, description: t('description') }]}
        />
        <ListPageFrame title={t('title')} description={t('description')}>
          <ContactsTable contacts={contacts} companies={companies} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
