import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { requireToken } from '@/lib/auth';
import { AiCallsPanel } from './_components/ai-calls-panel';

export default async function AiCallsPage ()
{
  const token = await requireToken();
  const t = await getTranslations('admin.aiCalls');

  return (
    <AdminShellWithSession>
      <ListPageFrame title={ t('title') } description={ t('description') }>
        <div className="mb-4">
          <Link
            href="/diagnosis"
            className="text-sm font-medium text-primary hover:underline"
          >
            { t('diagnosisLink') }
          </Link>
        </div>
        <AiCallsPanel token={ token } />
      </ListPageFrame>
    </AdminShellWithSession>
  );
}
