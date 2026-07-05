import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  BentoDashboardFrame,
  BentoMetricTile,
  BentoTile,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  formatMoney,
} from '@meridian/ui/server';
import { BentoChartTile } from '@meridian/ui/client-widgets';

import { RoleDashboardHints } from '@/app/_components/role-dashboard-hints';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { OnboardingStatusBadge } from '@meridian/ui';
import { apiFetch, ApiError, type DashboardStats } from '@/lib/api';
import { requireAdminSession, requireToken } from '@/lib/auth';

async function loadDashboard(
  token: string,
  loadFailedMessage: string,
): Promise<{ stats: DashboardStats | null; error: string | null }> {
  try {
    const stats = await apiFetch<DashboardStats>('/platform/dashboard', {}, token);
    return { stats, error: null };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : loadFailedMessage;
    return { stats: null, error: message };
  }
}

export default async function DashboardPage() {
  const session = await requireAdminSession();
  const token = await requireToken();

  const locale = await getLocale();
  const t = await getTranslations('admin.dashboard');
  const tm = await getTranslations('admin.merchants');
  const { stats, error } = await loadDashboard(token, t('loadFailed'));

  return (
    <AdminShellWithSession session={session}>
      <BentoDashboardFrame
        title={t('title')}
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
        <RoleDashboardHints role={session.role} />
        {stats ? (
          <>
            <BentoMetricTile title={t('totalMerchants')} value={stats.totalMerchants} />
            <Link href="/merchants?status=SUBMITTED" className="block transition-opacity hover:opacity-90">
              <BentoMetricTile title={t('pendingMerchants')} value={stats.pendingReview} />
            </Link>
            <BentoMetricTile title={t('activeDistributors')} value={stats.activeDistributors} />
            <BentoMetricTile title={t('ordersLast30Days')} value={stats.ordersLast30Days} />
            <BentoMetricTile
              title={t('orderRevenueLast30Days')}
              value={formatMoney(stats.orderRevenueLast30Days, locale)}
            />
            <BentoMetricTile
              title={t('commissionAccruedLast30Days')}
              value={formatMoney(stats.commissionAccruedLast30Days, locale)}
            />
            <BentoMetricTile
              title={t('commissionSettledLast30Days')}
              value={formatMoney(stats.commissionSettledLast30Days, locale)}
            />
            <BentoChartTile
              title={t('trendChart')}
              colSpan={2}
              rowSpan={2}
              data={stats.trend}
              series={[{ key: 'orderCount', label: 'Orders' }]}
            />
            <BentoTile colSpan={4}>
              <div className="space-y-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">{t('recentMerchants')}</h2>
                  <Link href="/merchants" className="text-sm text-primary hover:underline">
                    {t('viewAll')}
                  </Link>
                </div>
                {stats.recentMerchants.length === 0 ? (
                  <EmptyState title={t('emptyMerchants')} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('columns.business')}</TableHead>
                        <TableHead>{t('columns.status')}</TableHead>
                        <TableHead>{t('columns.submitted')}</TableHead>
                        <TableHead className="text-right">{t('columns.action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentMerchants.map((merchant) => (
                        <TableRow key={merchant.id}>
                          <TableCell className="font-medium">{merchant.businessName}</TableCell>
                          <TableCell>
                            <OnboardingStatusBadge status={merchant.onboardingStatus} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {merchant.submittedAt
                              ? new Date(merchant.submittedAt).toLocaleDateString(locale)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/merchants/${merchant.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {tm('view')}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </BentoTile>
          </>
        ) : null}
      </BentoDashboardFrame>
    </AdminShellWithSession>
  );
}
