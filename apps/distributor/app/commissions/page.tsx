import { getTranslations } from 'next-intl/server';
import {
  Badge,
  EmptyState,
  ListPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  const t = await getTranslations('distributor.commissions');
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

  return (
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
        <div className="rounded-xl border">
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
                  <TableCell>${Number(row.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status] ?? 'secondary'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </ListPageFrame>
  );
}
