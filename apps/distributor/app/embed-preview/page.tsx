import { getLocale, getTranslations } from 'next-intl/server';
import { BentoChartTile } from '@meridian/ui/client-widgets';
import { BentoDashboardFrame, BentoMetricTile, formatMoney } from '@meridian/ui/server';

import { DistributorShellWrapper } from '@/components/distributor-shell-wrapper';

export const metadata = {
  robots: { index: false, follow: false },
};

function demoTrend(days = 14) {
  const now = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - index));
    return {
      date: date.toISOString().slice(0, 10),
      orderCount: 3 + (index % 5),
      orderRevenue: 1800 + index * 140,
      commissionAccrued: 160 + index * 22,
    };
  });
}

export default async function DistributorEmbedPreviewPage() {
  const locale = await getLocale();
  const t = await getTranslations('distributor.dashboard');
  const trend = demoTrend();

  return (
    <DistributorShellWrapper distributorName="演示拓店员">
      <BentoDashboardFrame
        title={t('welcome', { name: '演示拓店员' })}
        description={t('description')}
      >
        <BentoMetricTile title={t('branchCount')} value={9} />
        <BentoMetricTile
          title={t('availableBalance')}
          value={formatMoney('6800.00', locale)}
        />
        <BentoMetricTile
          title={t('commissionAccrued')}
          value={formatMoney('12100.00', locale)}
        />
        <BentoMetricTile
          title={t('commissionSettled')}
          value={formatMoney('9400.00', locale)}
        />
        <BentoMetricTile title={t('attributedOrders')} value={63} />
        <BentoMetricTile
          title={t('orderRevenue')}
          value={formatMoney('42800.00', locale)}
        />
        <BentoChartTile
          title={t('trendChart')}
          colSpan={2}
          rowSpan={2}
          data={trend}
          series={[
            { key: 'orderCount', label: t('attributedOrders') },
            { key: 'commissionAccrued', label: t('commissionAccrued') },
          ]}
        />
      </BentoDashboardFrame>
    </DistributorShellWrapper>
  );
}
