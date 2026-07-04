import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type PlatformAdmin } from '@/lib/api';
import { requireAdminSession, requireToken } from '@/lib/auth';

import { AdminsView } from './_components/admins-view';

export default async function AdminsPage() {
  const session = await requireAdminSession();

  const token = await requireToken();

  const t = await getTranslations('admin.admins');

  let admins: PlatformAdmin[] = [];
  try {
    admins = await apiFetch<PlatformAdmin[]>('/platform/admins', {}, token);
  } catch {
    admins = [];
  }

  return (
    <AdminShellWithSession session={session}>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('title'), value: admins.length },
            {
              title: t('columns.role'),
              value: new Set(admins.map((a) => a.role)).size,
            },
          ]}
        />
        <ListPageFrame title={t('title')} description={t('description')}>
          <AdminsView admins={admins} token={token} currentAdminId={session.id} />
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
