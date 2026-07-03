import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type PlatformAdmin } from '@/lib/api';
import { getAdminSession, getToken } from '@/lib/auth';

import { AdminsView } from './_components/admins-view';

export default async function AdminsPage() {
  const session = await getAdminSession();
  if (!session) return null;

  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.admins');

  let admins: PlatformAdmin[] = [];
  try {
    admins = await apiFetch<PlatformAdmin[]>('/platform/admins', {}, token);
  } catch {
    admins = [];
  }

  return (
    <AdminShellWithSession session={session}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <AdminsView admins={admins} token={token} currentAdminId={session.id} />
      </ListPageFrame>
    </AdminShellWithSession>
  );
}
