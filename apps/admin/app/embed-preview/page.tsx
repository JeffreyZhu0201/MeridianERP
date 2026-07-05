import { getLocale, getTranslations } from 'next-intl/server';
import { ADMIN_ROLE_PERMISSIONS } from '@meridian/shared';
import { BentoChartTile } from '@meridian/ui/client-widgets';
import { BentoDashboardFrame, BentoMetricTile, formatMoney } from '@meridian/ui/server';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import type { AdminSession } from '@/lib/api';

export const metadata = {
  robots: { index: false, follow: false },
};

const DEMO_SESSION: AdminSession = {
  id: 'embed-preview',
  email: 'preview@meridian.test',
  role: 'SUPER_ADMIN',
  permissions: ADMIN_ROLE_PERMISSIONS.SUPER_ADMIN,
  homePath: '/',
};

function demoTrend(days = 14) {
  const now = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - index));
    return {
      date: date.toISOString().slice(0, 10),
      orderCount: 18 + Math.floor(Math.sin(index * 0.7) * 6) + (index % 4),
      orderRevenue: 4200 + index * 320,
      commissionAccrued: 380 + index * 28,
    };
  });
}

export default async function AdminEmbedPreviewPage() {
  const locale = await getLocale();
  const t = await getTranslations('admin.dashboard');
  const trend = demoTrend();

  return (
    <AdminShellWithSession session={DEMO_SESSION}>
      <BentoDashboardFrame title={t('title')}>
        <BentoMetricTile title={t('totalMerchants')} value={12} />
        <BentoMetricTile title={t('pendingMerchants')} value={3} />
        <BentoMetricTile title={t('activeDistributors')} value={8} />
        <BentoMetricTile title={t('ordersLast30Days')} value={247} />
        <BentoMetricTile
          title={t('orderRevenueLast30Days')}
          value={formatMoney('128400.00', locale)}
        />
        <BentoMetricTile
          title={t('commissionAccruedLast30Days')}
          value={formatMoney('8640.00', locale)}
        />
        <BentoChartTile
          title={t('trendChart')}
          colSpan={2}
          rowSpan={2}
          data={trend}
          series={[{ key: 'orderCount', label: 'Orders' }]}
        />
      </BentoDashboardFrame>
    </AdminShellWithSession>
  );
}
