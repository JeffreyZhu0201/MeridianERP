import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame, formatMoney } from '@meridian/ui/server';
import type { PlatformFundsNetProfitBreakdown } from '@meridian/shared';

import { AdminBackLink } from '@/components/admin-back-link';
import { AdminFundsAiInsight } from '@/app/_components/admin-funds-ai-insight';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';

type RowKind = 'revenue' | 'cost' | 'total' | 'subtotal' | 'net';

function rowClass(kind: RowKind): string {
  if (kind === 'net') return 'bg-primary/5 font-semibold';
  if (kind === 'total' || kind === 'subtotal') return 'bg-muted/40 font-medium';
  return '';
}

export default async function NetProfitPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const token = await requireToken();
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('admin.funds.netProfitDetail');
  const tb = await getTranslations('admin.funds');
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  let breakdown: PlatformFundsNetProfitBreakdown | null = null;
  try {
    breakdown = await apiFetch<PlatformFundsNetProfitBreakdown>(
      `/platform/funds/net-profit${query.toString() ? `?${query}` : ''}`,
      {},
      token,
    );
  } catch {
    breakdown = null;
  }

  const rawRows = breakdown
    ? [
        { section: t('revenueSection'), label: t('wholesaleAlloc'), value: breakdown.wholesaleFromAllocations, kind: 'revenue' as const },
        { section: null, label: t('wholesaleDelivery'), value: breakdown.wholesaleFromDelivery, kind: 'revenue' as const },
        { section: null, label: t('totalRevenue'), value: breakdown.totalRevenue, kind: 'total' as const },
        { section: t('costsSection'), label: t('cogsAlloc'), value: -breakdown.cogsFromAllocations, kind: 'cost' as const },
        { section: null, label: t('cogsDelivery'), value: -breakdown.cogsFromDelivery, kind: 'cost' as const },
        { section: null, label: t('totalCogs'), value: -breakdown.totalCogs, kind: 'subtotal' as const },
        { section: null, label: t('distributorCommissions'), value: -breakdown.distributorCommissions, kind: 'cost' as const },
        { section: t('resultSection'), label: t('netProfit'), value: breakdown.netProfit, kind: 'net' as const },
      ]
    : [];

  const rows = rawRows.map((row, index) => {
    const prevSection = index > 0 ? rawRows[index - 1]!.section : null;
    const showSection = Boolean(row.section && row.section !== prevSection);
    return { ...row, showSection };
  });

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        {breakdown ? (
          <BentoListHeader
            metrics={[
              { title: t('netProfit'), value: formatMoney(breakdown.netProfit, locale) },
              {
                title: t('totalRevenue'),
                value: formatMoney(breakdown.totalRevenue, locale),
                description: tb('period', { from: breakdown.from, to: breakdown.to }),
              },
            ]}
          />
        ) : null}
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          action={<AdminBackLink href="/funds" label={tb('backToFunds')} />}
        >
          <AdminFundsAiInsight
            token={token}
            metric="net-profit"
            from={params.from}
            to={params.to}
          />
          {breakdown ? (
            <div className="overflow-hidden rounded-xl ring-1 ring-border">
              {rows.map((row) => (
                <div key={row.label}>
                  {row.showSection ? (
                    <div className="border-b border-border bg-muted/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {row.section}
                    </div>
                  ) : null}
                  <div
                    className={`flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0 ${rowClass(row.kind)}`}
                  >
                    <span className="text-sm">{row.label}</span>
                    <span
                      className={`tabular-nums ${
                        row.value < 0
                          ? 'text-destructive'
                          : row.kind === 'net'
                            ? 'text-lg font-semibold text-primary'
                            : ''
                      }`}
                    >
                      {formatMoney(row.value, locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-destructive">{tb('loadError')}</p>
          )}
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
