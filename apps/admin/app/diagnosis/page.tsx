import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { requireToken } from '@/lib/auth';
import { DiagnosisPanel } from './_components/diagnosis-panel';

export default async function DiagnosisPage() {
  const token = await requireToken();
  const t = await getTranslations('admin.diagnosis');

  return (
    <AdminShellWithSession>
      <ListPageFrame title={t('title')} description={t('description')}>
        <DiagnosisPanel token={token} />
      </ListPageFrame>
    </AdminShellWithSession>
  );
}
