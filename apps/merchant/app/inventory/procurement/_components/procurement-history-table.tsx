'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Badge,
  EmptyState,
  formatMoney,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { BranchPurchaseOrderSummary } from '@meridian/shared';

interface ProcurementHistoryTableProps {
  orders: BranchPurchaseOrderSummary[];
}

export function ProcurementHistoryTable({ orders }: ProcurementHistoryTableProps) {
  const locale = useLocale();
  const t = useTranslations('merchant.inventory.procurement');
  const formatCNY = (value: string | number) => formatMoney(value, 'CNY', locale);

  function statusLabel(status: string) {
    if (
      status === 'PENDING_PAYMENT' ||
      status === 'PAID' ||
      status === 'PROCESSING' ||
      status === 'SHIPPED' ||
      status === 'RECEIVED' ||
      status === 'CANCELLED'
    ) {
      return t(`orderStatus.${status}` as 'orderStatus.PENDING_PAYMENT');
    }
    return status;
  }

  if (orders.length === 0) {
    return (
      <EmptyState title={t('emptyHistory')} description={t('emptyHistoryDescription')} />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('orderNumber')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead className="text-right">{t('total')}</TableHead>
            <TableHead>{t('lines')}</TableHead>
            <TableHead>{t('created')}</TableHead>
            <TableHead className="text-right">{t('viewDetail')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
              <TableCell>
                <Badge variant="secondary">{statusLabel(order.status)}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCNY(order.totalAmount)}
              </TableCell>
              <TableCell>{order.lineCount}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleString(locale)}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/inventory/procurement/${order.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {t('viewDetail')}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
