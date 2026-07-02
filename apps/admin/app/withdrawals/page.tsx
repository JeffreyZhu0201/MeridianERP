import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, Button, EmptyState, formatMoney, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type WithdrawalRequest } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { WithdrawalsTable } from './_components/withdrawals-table';
const CURRENCY = 'CNY';

export default async function WithdrawalsPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('admin.withdrawals');

  let withdrawals: WithdrawalRequest[] = [];
  try {
    withdrawals = await apiFetch<WithdrawalRequest[]>(
      '/platform/withdrawals?status=PENDING',
      {},
      token,
    );
  } catch {
    withdrawals = [];
  }

  const pendingTotal = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

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
