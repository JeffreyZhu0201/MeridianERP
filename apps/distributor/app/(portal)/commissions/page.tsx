import { getLocale, getTranslations } from 'next-intl/server';
import { Badge,
  BentoListHeader,
  EmptyState,
  ListPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  formatMoney, } from '@meridian/ui/server';
import { LedgerStatus, type DistributorDashboard } from '@meridian/shared';

import {
  apiFetch,
  type DistributorCommissionListResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';

const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  [LedgerStatus.ACCRUED]: 'warning',
  [LedgerStatus.SETTLED]: 'success',
  [LedgerStatus.VOID]: 'destructive',
};

function sequenceLabel(
  row: {
    merchantAllocationSequence?: number | null;
    customerOrderSequence?: number | null;
  },
  t: Awaited<ReturnType<typeof getTranslations>>,
  emptyDash: string,
): string {
  const seq = row.merchantAllocationSequence ?? row.customerOrderSequence;
  if (seq === 1) return t('allocationSequenceFirst');
  if (seq === 2) return t('allocationSequenceSecond');
  return emptyDash;
}

function sourceLabel(
  _source: string | null | undefined,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string {
  return t('sourceAllocation');
}

function ledgerStatusLabel(
  status: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string {
  if (status === LedgerStatus.ACCRUED || status === LedgerStatus.SETTLED || status === LedgerStatus.VOID) {
    return t(`ledgerStatus.${status}`);
  }
  return status;
}

export default async function CommissionsPage() {
  const locale = await getLocale();
  const t = await getTranslations('distributor.commissions');
  const td = await getTranslations('distributor');
  const tc = await getTranslations('common');
  const token = await getToken();
  if (!token) return null;

  const emptyDash = tc('emptyDash');

  let commissions: DistributorCommissionListResponse | null = null;
  let dashboard: DistributorDashboard | null = null;
  let error: string | null = null;

  try {
    [commissions, dashboard] = await Promise.all([
      apiFetch<DistributorCommissionListResponse>('/distributor/me/commissions', {}, token),
      apiFetch<DistributorDashboard>('/distributor/me/dashboard', {}, token),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadError');
  }

  const isEmpty = !commissions?.items.length;
  const summary = dashboard?.commissionSummary;
  const tDashboard = await getTranslations('distributor.dashboard');

  return (
    <div className="space-y-6">
      {summary ? (
        <BentoListHeader
          metrics={[
            { title: t('title'), value: summary.entryCount },
            {
              title: tDashboard('commissionAccrued'),
              value: formatMoney(summary.accruedTotal, locale),
            },
            {
              title: tDashboard('commissionSettled'),
              value: formatMoney(summary.settledTotal, locale),
            },
            {
              title: tDashboard('availableBalance'),
              value: formatMoney(dashboard?.availableBalance ?? 0, locale),
            },
          ]}
        />
      ) : null}
      <ListPageFrame
        title={t('title')}
        description={t('description')}
        emptyState={
          isEmpty && !error ? (
            <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
          ) : undefined
        }
      >
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {!isEmpty && commissions ? (
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('businessName')}</TableHead>
                  <TableHead>{t('order')}</TableHead>
                  <TableHead>{t('allocationSequence')}</TableHead>
                  <TableHead>{t('commissionSource')}</TableHead>
                  <TableHead>{t('wholesaleBase')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.businessName ?? emptyDash}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.orderReference}</TableCell>
                    <TableCell>
                      {sequenceLabel(row, t, emptyDash)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.commissionSource === 'RETAIL' ? 'outline' : 'secondary'}>
                        {sourceLabel(row.commissionSource, t)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatMoney(row.orderTotal, locale)}</TableCell>
                    <TableCell>{formatMoney(row.amount, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status] ?? 'secondary'}>
                        {ledgerStatusLabel(row.status, td)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString(locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </ListPageFrame>
    </div>
  );
}
