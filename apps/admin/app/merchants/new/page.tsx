import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type PlatformDistributor } from '@/lib/api';
import { requireToken } from '@/lib/auth';
import { CreateMerchantForm } from './_components/create-merchant-form';

export default async function CreateMerchantPage() {
  const token = await requireToken();

  const t = await getTranslations('admin.merchants');
  let distributors: PlatformDistributor[] = [];
  try {
    distributors = await apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token);
  } catch {
    distributors = [];
  }

  return (
    <AdminShellWithSession>
      <ListPageFrame title={t('createTitle')} description={t('createDescription')}>
        <CreateMerchantForm token={token} distributors={distributors} />
      </ListPageFrame>
    </AdminShellWithSession>
  );
}
