import Link from 'next/link';
import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, formatMoney, ListPageFrame } from '@meridian/ui/server';
import type { WithdrawalRequestRow } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { WithdrawalsStatusTabs } from './_components/withdrawals-status-tabs';
import { WithdrawalsTable } from './_components/withdrawals-table';

const CURRENCY = 'CNY';

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; distributorId?: string }>;
}) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const status = params.status ?? 'PENDING';
  const locale = await getLocale();
  const t = await getTranslations('admin.withdrawals');

  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);
  if (params.distributorId) query.set('distributorId', params.distributorId);
  const queryString = query.toString();

  let withdrawals: WithdrawalRequestRow[] = [];
  try {
    withdrawals = await apiFetch<WithdrawalRequestRow[]>(
      `/platform/withdrawals${queryString ? `?${queryString}` : ''}`,
      {},
      token,
    );
  } catch {
    withdrawals = [];
  }

  const pendingTotal = withdrawals
    .filter((w) => w.status === 'PENDING')
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const metrics = [
    { title: t('title'), value: withdrawals.length },
    {
      title: t('columns.amount'),
      value: formatMoney(pendingTotal, CURRENCY, locale),
      description: t('description'),
    },
  ];

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <p>{t('settlementHint')}</p>
          <Link
            href="/settlements"
            className="inline-flex h-8 items-center rounded-md border border-input px-3 text-sm hover:bg-muted"
          >
            {t('goToSettlements')}
          </Link>
        </div>
        <Suspense fallback={null}>
          <WithdrawalsStatusTabs />
        </Suspense>
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          emptyState={
            withdrawals.length === 0 ? <EmptyState title={t('empty')} /> : undefined
          }
        >
          <WithdrawalsTable withdrawals={withdrawals} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
