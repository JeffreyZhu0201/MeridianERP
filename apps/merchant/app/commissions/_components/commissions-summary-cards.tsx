'use client';

import { useTranslations } from 'next-intl';
import { MetricCard } from '@meridian/ui';
import type { CommissionSummary } from '@meridian/shared';

interface CommissionsSummaryCardsProps {
  summary: CommissionSummary;
}

function formatMoney(value: string | number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

export function CommissionsSummaryCards({ summary }: CommissionsSummaryCardsProps) {
  const t = useTranslations('merchant.commissions.summary');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard title={t('accrued')} value={formatMoney(summary.accruedTotal)} />
      <MetricCard title={t('settled')} value={formatMoney(summary.settledTotal)} />
      <MetricCard title={t('totalCommission')} value={formatMoney(summary.totalCommission)} />
      <MetricCard title={t('entries')} value={summary.entryCount} />
    </div>
  );
}
