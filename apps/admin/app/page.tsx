import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { DashboardPageFrame, MetricCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { StatusBadge } from '@/components/status-badge';
import { apiFetch, ApiError, type DashboardStats } from '@/lib/api';
import { getToken } from '@/lib/auth';

function formatMoney(value: string | number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

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
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('admin.dashboard');
  const tm = await getTranslations('admin.merchants');
  const { stats, error } = await loadDashboard(token, t('loadFailed'));

  return (
    <AdminShellWrapper>
      <DashboardPageFrame
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
        {stats ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard title={t('totalMerchants')} value={stats.totalMerchants} />
              <MetricCard title={t('pendingMerchants')} value={stats.pendingReview} />
              <MetricCard title={t('activeDistributors')} value={stats.activeDistributors} />
              <MetricCard title={t('bindingsLast30Days')} value={stats.bindingsLast30Days} />
              <MetricCard
                title={t('commissionAccruedLast30Days')}
                value={formatMoney(stats.commissionAccruedLast30Days, locale)}
              />
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{t('recentMerchants')}</h2>
                <Link href="/merchants" className="text-sm text-primary hover:underline">
                  {t('viewAll')}
                </Link>
              </div>
              {stats.recentMerchants.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                  {t('emptyMerchants')}
                </div>
              ) : (
                <div className="rounded-xl border">
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
                            <StatusBadge status={merchant.onboardingStatus} />
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
                </div>
              )}
            </section>
          </>
        ) : null}
      </DashboardPageFrame>
    </AdminShellWrapper>
  );
}
