import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type WithdrawalRequest } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { WithdrawalsTable } from './_components/withdrawals-table';

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

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);

  const pendingTotal = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  const metrics = [
    { title: t('title'), value: withdrawals.length },
    {
      title: t('columns.amount'),
      value: formatMoney(pendingTotal),
      description: t('description'),
    },
  ];

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
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
