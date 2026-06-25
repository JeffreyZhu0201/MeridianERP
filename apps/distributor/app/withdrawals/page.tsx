import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';
import type { DistributorDashboard, WithdrawalRequestRow } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { WithdrawalsPanel } from './_components/withdrawals-panel';

export default async function WithdrawalsPage() {
  const t = await getTranslations('distributor.withdrawals');
  const token = await getToken();
  if (!token) return null;

  const [withdrawals, dashboard] = await Promise.all([
    apiFetch<WithdrawalRequestRow[]>('/distributor/me/withdrawals', {}, token).catch(() => []),
    apiFetch<DistributorDashboard>('/distributor/me/dashboard', {}, token).catch(() => null),
  ]);

  const availableBalance = Number(dashboard?.availableBalance ?? 0);

  return (
    <ListPageFrame title={t('title')} description={t('description')}>
      <WithdrawalsPanel
        withdrawals={withdrawals}
        availableBalance={availableBalance}
        token={token}
      />
    </ListPageFrame>
  );
}
