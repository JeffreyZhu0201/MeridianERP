import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui/server';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PlatformDistributor } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CreateMerchantForm } from './_components/create-merchant-form';

export default async function CreateMerchantPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.merchants');
  let distributors: PlatformDistributor[] = [];
  try {
    distributors = await apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token);
  } catch {
    distributors = [];
  }

  return (
    <AdminShellWrapper>
      <ListPageFrame title={t('createTitle')} description={t('createDescription')}>
        <CreateMerchantForm token={token} distributors={distributors} />
      </ListPageFrame>
    </AdminShellWrapper>
  );
}
