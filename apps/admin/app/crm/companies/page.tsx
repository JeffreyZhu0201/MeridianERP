import { getTranslations } from 'next-intl/server';
import type { PlatformCrmCompany } from '@meridian/shared';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CompaniesTable } from './_components/companies-table';

export default async function CrmCompaniesPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.crm.companies');
  let companies: PlatformCrmCompany[] = [];
  try {
    companies = await apiFetch<PlatformCrmCompany[]>('/platform/crm/companies', {}, token);
  } catch {
    companies = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('title'), value: companies.length, description: t('description') }]}
        />
        <ListPageFrame title={t('title')} description={t('description')}>
          <CompaniesTable companies={companies} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
