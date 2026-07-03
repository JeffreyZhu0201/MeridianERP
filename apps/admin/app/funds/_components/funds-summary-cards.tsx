'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@meridian/ui';
import type { PlatformFundsSummary } from '@meridian/shared';

interface FundsSummaryCardsProps {
  summary: PlatformFundsSummary;
  formatMoney: (value: string | number) => string;
}

export function FundsSummaryCards({ summary, formatMoney }: FundsSummaryCardsProps) {
  const t = useTranslations('admin.funds');

  const items = [
    { label: t('consumerGmv'), value: formatMoney(summary.consumerGmv ?? summary.gmv) },
    { label: t('wholesaleRevenue'), value: formatMoney(summary.wholesaleRevenue) },
    {
      label: t('wholesaleFromAllocations'),
      value: formatMoney(summary.wholesaleFromAllocations ?? 0),
    },
    {
      label: t('wholesaleFromDelivery'),
      value: formatMoney(summary.wholesaleFromDelivery ?? 0),
    },
    {
      label: t('pickupMarginAcrossBranches'),
      value: formatMoney(summary.pickupMarginAcrossBranches ?? 0),
    },
    {
      label: t('distributorCommissionAccrued'),
      value: formatMoney(
        summary.distributorCommissionAccrued ?? summary.commissionAccrued,
      ),
    },
    {
      label: t('distributorCommissionSettled'),
      value: formatMoney(
        summary.distributorCommissionSettled ?? summary.commissionSettled,
      ),
    },
    { label: t('commissionLiability'), value: formatMoney(summary.commissionLiability) },
    {
      label: t('accruedAwaitingSettlement'),
      value: formatMoney(summary.accruedAwaitingSettlement),
    },
    { label: t('pendingWithdrawals'), value: formatMoney(summary.pendingWithdrawals) },
    { label: t('orderCount'), value: summary.orderCount },
    { label: t('deliveryOrders'), value: summary.deliveryOrderCount },
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
