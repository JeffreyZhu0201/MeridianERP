import { getLocale, getTranslations } from 'next-intl/server';
import { BentoChartTile } from '@meridian/ui/client-widgets';
import { BentoDashboardFrame, BentoMetricTile, formatMoney } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';

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
      orderCount: 6 + Math.floor(Math.cos(index * 0.5) * 3) + (index % 2),
      commissionAccrued: 120 + index * 18,
    };
  });
}

export default async function MerchantEmbedPreviewPage() {
  const locale = await getLocale();
  const t = await getTranslations('merchant.dashboard');
  const trend = demoTrend();

  return (
    <MerchantShellWrapper
      businessName="演示分店"
      userDisplayName="分店管理员"
      userEmail="branch@meridian.test"
      installedPluginCodes={['crm']}
      lowStockAlertCount={2}
    >
      <BentoDashboardFrame title={t('welcome', { name: '演示分店' })}>
        <BentoMetricTile title={t('contacts')} value={86} />
        <BentoMetricTile title={t('openLeads')} value={14} />
        <BentoMetricTile title={t('ordersLast30')} value={47} />
        <BentoMetricTile title={t('revenueLast30')} value={formatMoney('18240.00', locale)} />
        <BentoMetricTile
          title={t('commissionAccruedLast30')}
          value={formatMoney('1210.00', locale)}
        />
        <BentoMetricTile title={t('lowStock')} value={2} />
        <BentoChartTile
          title={t('trendChart')}
          colSpan={2}
          rowSpan={2}
          data={trend}
          series={[
            { key: 'orderCount', label: t('ordersLast30') },
            { key: 'commissionAccrued', label: t('commissionAccruedLast30') },
          ]}
        />
      </BentoDashboardFrame>
    </MerchantShellWrapper>
  );
}
