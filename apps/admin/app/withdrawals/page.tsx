import Link from 'next/link';
import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, formatMoney, ListPageFrame } from '@meridian/ui/server';
import type { PaginatedWithdrawalList, WithdrawalRequestRow } from '@meridian/shared';

import { ListPagination } from '@/components/list-pagination';
import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { WithdrawalsStatusTabs } from './_components/withdrawals-status-tabs';
import { WithdrawalsTable } from './_components/withdrawals-table';

const CURRENCY = 'CNY';

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; distributorId?: string; page?: string }>;
}) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const status = params.status ?? 'PENDING';
  const locale = await getLocale();
  const t = await getTranslations('admin.withdrawals');
  const tc = await getTranslations('common');

  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);
  if (params.distributorId) query.set('distributorId', params.distributorId);
  query.set('page', params.page ?? '1');
  query.set('limit', '20');
  const queryString = query.toString();

  let withdrawals: WithdrawalRequestRow[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  try {
    const res = await apiFetch<PaginatedWithdrawalList>(
      `/platform/withdrawals?${queryString}`,
      {},
      token,
    );
    withdrawals = res.data;
    meta = res.meta;
  } catch {
    withdrawals = [];
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const pendingTotal = withdrawals
    .filter((w) => w.status === 'PENDING')
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const metrics = [
    { title: t('title'), value: meta.total },
    {
      title: t('columns.amount'),
      value: formatMoney(pendingTotal, CURRENCY, locale),
      description: t('description'),
    },
    {
      title: tc('pageOf', { page: meta.page, total: totalPages }),
      value: withdrawals.length,
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
          <Suspense>
            <ListPagination
              basePath="/withdrawals"
              total={meta.total}
              page={meta.page}
              limit={meta.limit}
              summary={t('pagination', { page: meta.page, totalPages, total: meta.total })}
            />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
