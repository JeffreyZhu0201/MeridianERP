'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Badge, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, formatMoney } from '@meridian/ui';
import type { MerchantOrderListItem } from '@meridian/shared';

interface OrdersTableProps {
  orders: MerchantOrderListItem[];
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'PAID' || status === 'FULFILLED') return 'default';
  if (status === 'CANCELLED' || status === 'REFUNDED') return 'destructive';
  return 'secondary';
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const t = useTranslations('merchant.orders.table');
  const tg = useTranslations('merchant.orders');

  if (orders.length === 0) {
    return (
      <EmptyState title={t('empty')} description={t('emptyHint')} />
    );
  }

  return (
    <div className="rounded-xl ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('order')}</TableHead>
            <TableHead>{t('customer')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead className="text-right">{t('total')}</TableHead>
            <TableHead>{t('date')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link href={`/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline">
                  {order.id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell className="text-sm">
                {order.customer?.email ?? order.guestEmail ?? tg('guest')}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
              </TableCell>
              <TableCell className="text-right text-sm font-medium tabular-nums">
                {formatMoney(order.total, order.currency)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
