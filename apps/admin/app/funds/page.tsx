import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';
import type { PlatformFundsSummary } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { FundsView } from './_components/funds-view';

export default async function FundsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.funds');
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const path = `/platform/funds/summary${query.toString() ? `?${query}` : ''}`;

  let summary: PlatformFundsSummary | null = null;
  try {
    summary = await apiFetch<PlatformFundsSummary>(path, {}, token);
  } catch {
    summary = null;
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        {summary ? (
          <BentoListHeader
            metrics={[
              { title: t('gmv'), value: String(summary.gmv) },
              { title: t('pendingWithdrawals'), value: String(summary.pendingWithdrawals) },
            ]}
          />
        ) : null}
        <ListPageFrame title={t('title')} description={t('description')}>
          {summary ? <FundsView initialSummary={summary} token={token} /> : null}
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
