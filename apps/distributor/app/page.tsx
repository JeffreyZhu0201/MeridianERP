import { getTranslations } from 'next-intl/server';
import { DashboardPageFrame, MetricCard } from '@meridian/ui';

import {
  apiFetch,
  type DistributorDashboard,
} from '@/lib/api';
import { getToken } from '@/lib/auth';

export default async function DashboardPage() {
  const t = await getTranslations('distributor.dashboard');
  const token = await getToken();
  if (!token) return null;

  let dashboard: DistributorDashboard | null = null;
  let error: string | null = null;

  try {
    dashboard = await apiFetch<DistributorDashboard>('/distributor/me/dashboard', {}, token);
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadError');
  }

  return (
    <DashboardPageFrame
      title={
        dashboard
          ? t('welcome', { name: dashboard.distributorName })
          : t('title')
      }
      description={
        dashboard
          ? t('description', { tenant: dashboard.tenantSlug })
          : undefined
      }
      alert={
        error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : undefined
      }
    >
      {dashboard ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title={t('bindings')} value={dashboard.bindingsCount} />
            <MetricCard title={t('bindingsMerchant')} value={dashboard.bindingsMerchant} />
            <MetricCard title={t('bindingsCustomer')} value={dashboard.bindingsCustomer} />
            <MetricCard title={t('attributedOrders')} value={dashboard.attributedOrderCount} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title={t('orderRevenue')}
              value={`$${Number(dashboard.attributedOrderRevenue).toFixed(2)}`}
            />
            <MetricCard
              title={t('commissionAccrued')}
              value={`$${Number(dashboard.commissionSummary.accruedTotal).toFixed(2)}`}
            />
            <MetricCard
              title={t('commissionSettled')}
              value={`$${Number(dashboard.commissionSummary.settledTotal).toFixed(2)}`}
            />
          </div>
        </>
      ) : null}
    </DashboardPageFrame>
  );
}
