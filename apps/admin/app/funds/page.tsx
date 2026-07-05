import { getTranslations } from 'next-intl/server';
import { Alert, AlertDescription } from '@meridian/ui';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';
import type { PlatformFundsOverview } from '@meridian/shared';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';
import { FundsOverview } from './_components/funds-overview';

export default async function FundsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const token = await requireToken();
  const t = await getTranslations('admin.funds');
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const path = `/platform/funds/overview${query.toString() ? `?${query}` : ''}`;

  let overview: PlatformFundsOverview | null = null;
  try {
    overview = await apiFetch<PlatformFundsOverview>(path, {}, token);
  } catch {
    overview = null;
  }

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        {overview ? (
          <BentoListHeader
            metrics={[
              { title: t('netProfit'), value: overview.netProfit },
              { title: t('inventoryCost'), value: overview.inventoryCost },
            ]}
          />
        ) : null}
        <ListPageFrame title={t('title')} description={t('description')}>
          {overview ? (
            <FundsOverview initialOverview={overview} token={token} />
          ) : (
            <Alert variant="destructive">
              <AlertDescription>{t('loadError')}</AlertDescription>
            </Alert>
          )}
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
