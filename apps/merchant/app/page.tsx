import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  Badge,
  DashboardPageFrame,
  MetricCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { LeadStage, type MerchantDashboardStats } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

const stageVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  [LeadStage.NEW]: 'default',
  [LeadStage.QUALIFIED]: 'warning',
  [LeadStage.WON]: 'success',
  [LeadStage.LOST]: 'destructive',
};

export default async function DashboardPage() {
  const t = await getTranslations('merchant.dashboard');
  const token = await getToken();
  if (!token) return null;

  let stats: MerchantDashboardStats | null = null;
  let error: string | null = null;
  try {
    stats = await apiFetch<MerchantDashboardStats>('/merchant/dashboard', {}, token);
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadError');
  }

  return (
    <MerchantShellWrapper businessName={stats?.businessName}>
      <DashboardPageFrame
        title={stats ? t('welcome', { name: stats.businessName }) : t('title')}
        alert={
          error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : undefined
        }
      >
        {stats ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title={t('contacts')} value={stats.contactsCount} />
              <MetricCard title={t('openLeads')} value={stats.openLeads} />
              <MetricCard title={t('activeDistributors')} value={stats.activeDistributors} />
              <MetricCard title={t('bindingsLast30')} value={stats.recentBindings} />
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{t('recentLeads')}</h2>
                <div className="flex gap-2">
                  <Link href="/crm/contacts" className="text-sm text-primary hover:underline">
                    {t('addContact')}
                  </Link>
                  <span className="text-muted-foreground">·</span>
                  <Link href="/distributors" className="text-sm text-primary hover:underline">
                    {t('addDistributor')}
                  </Link>
                </div>
              </div>
              {stats.recentLeads.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                  {t('noLeadsYet')}
                </div>
              ) : (
                <div className="rounded-xl border">
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
                            {new Date(lead.updatedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {stats.recentActivity.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-lg font-medium">{t('recentActivity')}</h2>
                <div className="rounded-xl border divide-y text-sm">
                  {stats.recentActivity.map((item, i) => (
                    <div key={`${item.type}-${item.occurredAt}-${i}`} className="flex justify-between gap-4 p-3">
                      <span>
                        {item.type === 'binding.created'
                          ? t('activityBindingCreated', {
                              bindType: item.bindType ?? '—',
                            })
                          : t('activityCommissionAccrued')}
                        {' · '}
                        {item.distributorName}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(item.occurredAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </DashboardPageFrame>
    </MerchantShellWrapper>
  );
}
