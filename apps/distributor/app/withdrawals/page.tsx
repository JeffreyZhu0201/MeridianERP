import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, formatMoney, ListPageFrame } from '@meridian/ui/server';
import type { DistributorDashboard, WithdrawalRequestRow } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { WithdrawalsPanel } from './_components/withdrawals-panel';

export default async function WithdrawalsPage() {
  const locale = await getLocale();
  const t = await getTranslations('distributor.withdrawals');
  const token = await getToken();
  if (!token) return null;

  const [withdrawals, dashboard] = await Promise.all([
    apiFetch<WithdrawalRequestRow[]>('/distributor/me/withdrawals', {}, token).catch(() => []),
    apiFetch<DistributorDashboard>('/distributor/me/dashboard', {}, token).catch(() => null),
  ]);

  const availableBalance = Number(dashboard?.availableBalance ?? 0);

  return (
    <div className="space-y-6">
      <BentoListHeader
        metrics={[
          { title: t('title'), value: withdrawals.length },
          {
            title: t('availableBalance'),
            value: formatMoney(availableBalance, locale),
          },
        ]}
      />
      <ListPageFrame title={t('title')} description={t('description')}>
        <WithdrawalsPanel
          withdrawals={withdrawals}
          availableBalance={availableBalance}
          token={token}
        />
      </ListPageFrame>
    </div>
  );
}
