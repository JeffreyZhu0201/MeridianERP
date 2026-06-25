import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type FundsSummary } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { FundsSummaryCards } from './_components/funds-summary-cards';

export default async function FundsPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('admin.funds');

  let summary: FundsSummary | null = null;
  try {
    summary = await apiFetch<FundsSummary>('/platform/funds/summary', {}, token);
  } catch {
    summary = null;
  }

  const formatMoney = (value: string | number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(Number(value));

  const metrics = summary
    ? [
        { title: t('gmv'), value: formatMoney(summary.gmvLast30Days) },
        { title: t('wholesaleRevenue'), value: formatMoney(summary.wholesaleRevenueLast30Days) },
        {
          title: t('pendingWithdrawals'),
          value: formatMoney(summary.pendingWithdrawals),
        },
        { title: t('orderCount'), value: summary.orderCountLast30Days },
      ]
    : [{ title: t('title'), value: '—' }];

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame title={t('title')} description={t('description')}>
          {summary ? <FundsSummaryCards summary={summary} /> : null}
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
