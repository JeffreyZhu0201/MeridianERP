'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  Badge,
  formatMoney,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { BranchPurchaseOrderStatus, BranchPurchaseOrderSummary } from '@meridian/shared';
import { formatBranchPurchaseOrderStatus } from '@meridian/shared';

interface ProcurementHistoryTableProps {
  orders: BranchPurchaseOrderSummary[];
}

export function ProcurementHistoryTable({ orders }: ProcurementHistoryTableProps) {
  const locale = useLocale();
  const t = useTranslations('merchant.inventory.procurement');
  const formatCNY = (value: string | number) => formatMoney(value, 'CNY', locale);

  const statusLabels = useMemo(
    () =>
      ({
        PENDING_PAYMENT: t('orderStatus.PENDING_PAYMENT'),
        PAID: t('orderStatus.PAID'),
        PROCESSING: t('orderStatus.PROCESSING'),
        SHIPPED: t('orderStatus.SHIPPED'),
        RECEIVED: t('orderStatus.RECEIVED'),
        CANCELLED: t('orderStatus.CANCELLED'),
      }) satisfies Record<BranchPurchaseOrderStatus, string>,
    [t],
  );

  if (orders.length === 0) {
    return null;
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
                <Badge variant="secondary">
                  {formatBranchPurchaseOrderStatus(order.status, statusLabels)}
                </Badge>
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
