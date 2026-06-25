import { getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PlatformDistributor } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { DistributorsTable } from './_components/distributors-table';

export default async function DistributorsPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.distributors');
  let distributors: PlatformDistributor[] = [];
  try {
    distributors = await apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token);
  } catch {
    distributors = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('title'), value: distributors.length, description: t('description') }]}
        />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          emptyState={
            distributors.length === 0 ? (
              <EmptyState title={t('empty')} description={t('emptyDescription')} />
            ) : undefined
          }
        >
          <DistributorsTable distributors={distributors} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
