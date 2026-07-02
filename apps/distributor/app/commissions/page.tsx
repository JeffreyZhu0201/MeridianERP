import { getLocale, getTranslations } from 'next-intl/server';
import {
  Badge,
  BentoListHeader,
  EmptyState,
  ListPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  formatMoney,
} from '@meridian/ui';
import { LedgerStatus } from '@meridian/shared';

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

export default async function CommissionsPage() {
  const locale = await getLocale();
  const t = await getTranslations('distributor.commissions');
  const td = await getTranslations('distributor.dashboard');
  const token = await getToken();
  if (!token) return null;

  let commissions: DistributorCommissionListResponse | null = null;
  let error: string | null = null;

  try {
    commissions = await apiFetch<DistributorCommissionListResponse>(
      '/distributor/me/commissions',
      {},
      token,
    );
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadError');
  }

  const isEmpty = !commissions?.items.length;
  const accruedTotal = commissions?.items
    .filter((row) => row.status === LedgerStatus.ACCRUED)
    .reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;
  const settledTotal = commissions?.items
    .filter((row) => row.status === LedgerStatus.SETTLED)
    .reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      {commissions ? (
        <BentoListHeader
          metrics={[
            { title: t('title'), value: commissions.total },
            { title: t('amount'), value: formatMoney(accruedTotal + settledTotal, locale) },
            { title: td('commissionAccrued'), value: formatMoney(accruedTotal, locale) },
            { title: td('commissionSettled'), value: formatMoney(settledTotal, locale) },
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
                  <TableHead>{t('order')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.orderReference}</TableCell>
                    <TableCell>{formatMoney(row.amount, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status] ?? 'secondary'}>
                        {row.status}
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
