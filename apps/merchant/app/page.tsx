import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Badge, BentoDashboardFrame, BentoMetricTile, BentoTile, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, formatMoney } from '@meridian/ui/server';
import { BentoChartTile } from '@meridian/ui/client-widgets';
import { LeadStage, type MerchantDashboardStats } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';

const stageVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  [LeadStage.NEW]: 'default',
  [LeadStage.QUALIFIED]: 'warning',
  [LeadStage.WON]: 'success',
  [LeadStage.LOST]: 'destructive',
};

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = await getTranslations('merchant.dashboard');
  const token = await getToken();
  if (!token) return null;

  let stats: MerchantDashboardStats | null = null;
  let error: string | null = null;
  try {
    stats = await apiFetch<MerchantDashboardStats>('/merchant/dashboard', {}, token);
  } catch (err) {
    error = err instanceof ApiError ? err.message : t('loadError');
  }

  return (
    <MerchantShellWrapper businessName={stats?.businessName}>
      <BentoDashboardFrame
        title={stats ? t('welcome', { name: stats.businessName }) : t('title')}
        alert={
          error ? (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : undefined
        }
      >
        {stats ? (
          <>
            <BentoMetricTile title={t('contacts')} value={stats.contactsCount} />
            <BentoMetricTile title={t('openLeads')} value={stats.openLeads} />
            <BentoMetricTile title={t('activeDistributors')} value={stats.activeDistributors} />
            <BentoMetricTile title={t('bindingsLast30')} value={stats.recentBindings} />
            <BentoMetricTile title={t('ordersLast30')} value={stats.ordersLast30Days} />
            <BentoMetricTile
              title={t('revenueLast30')}
              value={formatMoney(stats.revenueLast30Days, locale)}
            />
            <BentoMetricTile
              title={t('commissionAccruedLast30')}
              value={formatMoney(stats.commissionAccruedLast30Days, locale)}
            />
            <BentoMetricTile title={t('lowStock')} value={stats.lowStockCount} />
            <BentoChartTile
              title={t('trendChart')}
              colSpan={2}
              rowSpan={2}
              data={stats.trend.map((point) => ({
                date: point.date,
                orderCount: point.orderCount,
                commissionAccrued: Number(point.commissionAccrued),
              }))}
              series={[
                { key: 'orderCount', label: t('ordersLast30') },
                { key: 'commissionAccrued', label: t('commissionAccruedLast30') },
              ]}
            />
            <BentoTile colSpan={2}>
              <div className="space-y-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">{t('recentLeads')}</h2>
                  <div className="flex gap-2">
                    <Link href="/crm/contacts" className="text-sm text-primary hover:underline">
                      {t('addContact')}
                    </Link>
                  </div>
                </div>
                {stats.recentLeads.length === 0 ? (
                  <EmptyState title={t('noLeadsYet')} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('tableTitle')}</TableHead>
                        <TableHead>{t('tableStage')}</TableHead>
                        <TableHead>{t('tableSource')}</TableHead>
                        <TableHead>{t('tableCreated')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.title}</TableCell>
                          <TableCell>
                            <Badge variant={stageVariant[lead.stage] ?? 'secondary'}>
                              {lead.stage}
                            </Badge>
                          </TableCell>
                          <TableCell>{lead.source ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(lead.updatedAt).toLocaleDateString(locale)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </BentoTile>
            <BentoTile colSpan={2}>
              <div className="space-y-4 p-4 md:p-6">
                <h2 className="text-lg font-medium">{t('recentActivity')}</h2>
                {stats.recentActivity.length === 0 ? (
                  <EmptyState title={t('noLeadsYet')} />
                ) : (
                  <div className="divide-y text-sm">
                    {stats.recentActivity.map((item, i) => (
                      <div
                        key={`${item.type}-${item.occurredAt}-${i}`}
                        className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <span>
                          {item.type === 'binding.created'
                            ? t('activityBindingCreated', {
                                bindType: item.bindType ?? '—',
                              })
                            : item.type === 'order.paid'
                              ? t('activityOrderPaid')
                              : t('activityCommissionAccrued')}
                          {item.distributorName ? ` · ${item.distributorName}` : null}
                          {item.amount != null
                            ? ` · ${formatMoney(item.amount, locale)}`
                            : null}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {new Date(item.occurredAt).toLocaleDateString(locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </BentoTile>
          </>
        ) : null}
      </BentoDashboardFrame>
    </MerchantShellWrapper>
  );
}
