import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import type { PlatformCrmContact, PlatformCrmLead } from '@meridian/shared';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { LeadsTable } from './_components/leads-table';

export default async function CrmLeadsPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.crm.leads');
  let leads: PlatformCrmLead[] = [];
  let contacts: PlatformCrmContact[] = [];
  try {
    [leads, contacts] = await Promise.all([
      apiFetch<PlatformCrmLead[]>('/platform/crm/leads', {}, token),
      apiFetch<PlatformCrmContact[]>('/platform/crm/contacts', {}, token),
    ]);
  } catch {
    leads = [];
    contacts = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('title'), value: leads.length, description: t('description') }]}
        />
        <ListPageFrame title={t('title')} description={t('description')}>
          <Suspense>
            <LeadsTable leads={leads} contacts={contacts} token={token} />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
