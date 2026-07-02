import { getLocale, getTranslations } from 'next-intl/server';
import { BentoDashboardFrame, BentoMetricTile, formatMoney } from '@meridian/ui/server';
import { BentoChartTile } from '@meridian/ui/client-widgets';

import { apiFetch, ApiError, type DistributorDashboard } from '@/lib/api';
import { getToken } from '@/lib/auth';

async function loadDashboard(
  token: string,
  loadFailedMessage: string,
): Promise<{ dashboard: DistributorDashboard | null; error: string | null }> {
  try {
    const dashboard = await apiFetch<DistributorDashboard>('/distributor/me/dashboard', {}, token);
    return { dashboard, error: null };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : loadFailedMessage;
    return { dashboard: null, error: message };
  }
}

export default async function DashboardPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('distributor.dashboard');
  const { dashboard, error } = await loadDashboard(token, t('loadError'));

  return (
    <BentoDashboardFrame
      title={
        dashboard ? t('welcome', { name: dashboard.distributorName }) : t('title')
      }
      description={dashboard ? t('description') : undefined}
      alert={
        error ? (
          <div
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm"
            role="alert"
          >
            <p className="font-medium text-destructive">{t('loadError')}</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        ) : undefined
      }
    >
      {dashboard ? (
        <>
          <BentoMetricTile title={t('branchCount')} value={dashboard.branchCount} />
          <BentoMetricTile
            title={t('availableBalance')}
            value={formatMoney(dashboard.availableBalance, locale)}
          />
          <BentoMetricTile title={t('attributedOrders')} value={dashboard.attributedOrderCount} />
          <BentoMetricTile
            title={t('orderRevenue')}
            value={formatMoney(dashboard.attributedOrderRevenue, locale)}
          />
          <BentoMetricTile
            title={t('commissionAccrued')}
            value={formatMoney(dashboard.commissionSummary.accruedTotal, locale)}
          />
          <BentoMetricTile
            title={t('commissionSettled')}
            value={formatMoney(dashboard.commissionSummary.settledTotal, locale)}
          />
          <BentoChartTile
            title={t('trendChart')}
            colSpan={2}
            rowSpan={2}
            data={dashboard.trend.map((point) => ({
              date: point.date,
              orderCount: point.orderCount,
              orderRevenue: Number(point.orderRevenue),
              commissionAccrued: Number(point.commissionAccrued),
            }))}
            series={[
              { key: 'orderCount', label: t('attributedOrders') },
              { key: 'commissionAccrued', label: t('commissionAccrued') },
            ]}
          />
        </>
      ) : null}
    </BentoDashboardFrame>
  );
}
