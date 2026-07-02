'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, formatMoney } from '@meridian/ui';
import { CommissionType, LedgerStatus, type CommissionStatementRow } from '@meridian/shared';

interface CommissionsTableProps {
  items: CommissionStatementRow[];
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
}

function formatRate(type: string, rate: string | number): string {
  if (type === CommissionType.PERCENT) return `${rate}%`;
  return formatMoney(rate);
}

function statusVariant(status: LedgerStatus): 'default' | 'secondary' | 'outline' {
  if (status === LedgerStatus.SETTLED) return 'default';
  if (status === LedgerStatus.ACCRUED) return 'secondary';
  return 'outline';
}

export function CommissionsTable({ items }: CommissionsTableProps) {
  const t = useTranslations('merchant.commissions.table');
  const ts = useTranslations('merchant.commissions.ledgerStatus');
  const tc = useTranslations('common');

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('date')}</TableHead>
            <TableHead>{t('order')}</TableHead>
            <TableHead>{t('distributor')}</TableHead>
            <TableHead className="text-right">{t('orderTotal')}</TableHead>
            <TableHead className="text-right">{t('rate')}</TableHead>
            <TableHead className="text-right">{t('commission')}</TableHead>
            <TableHead>{tc('status')}</TableHead>
            <TableHead>{t('batchPeriod')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
              <TableCell>
                <Link
                  href={`/orders/${row.orderId}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {row.orderReference}
                </Link>
              </TableCell>
              <TableCell className="text-sm">{row.distributorName}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {formatMoney(row.orderTotal)}
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                {formatRate(row.commissionType, row.commissionRate)}
              </TableCell>
              <TableCell className="text-right text-sm font-medium tabular-nums">
                {formatMoney(row.amount)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(row.status)}>
                  {ts(row.status as 'ACCRUED' | 'SETTLED')}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {row.settlementBatchPeriod ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
