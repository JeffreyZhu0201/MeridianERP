'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@meridian/ui';

import type { FundsSummary } from '@/lib/api';

interface FundsSummaryCardsProps {
  summary: FundsSummary;
}

export function FundsSummaryCards({ summary }: FundsSummaryCardsProps) {
  const locale = useLocale();
  const t = useTranslations('admin.funds');

  const formatMoney = (value: string | number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(Number(value));

  const items = [
    { label: t('gmv'), value: formatMoney(summary.gmvLast30Days) },
    { label: t('wholesaleRevenue'), value: formatMoney(summary.wholesaleRevenueLast30Days) },
    { label: t('commissionAccrued'), value: formatMoney(summary.commissionAccruedLast30Days) },
    { label: t('commissionSettled'), value: formatMoney(summary.commissionSettledLast30Days) },
    { label: t('pendingWithdrawals'), value: formatMoney(summary.pendingWithdrawals) },
    { label: t('orderCount'), value: summary.orderCountLast30Days },
    { label: t('deliveryOrders'), value: summary.deliveryOrderCountLast30Days },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="ring-1 ring-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
