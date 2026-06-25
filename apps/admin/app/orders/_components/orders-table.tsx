'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@meridian/ui';

import type { PlatformOrder } from '@/lib/api';

interface OrdersTableProps {
  orders: PlatformOrder[];
}

function formatPrice(price: string | number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(price));
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PAID: 'default',
  FULFILLED: 'default',
  PENDING_PAYMENT: 'secondary',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const t = useTranslations('admin.orders');
  const locale = useLocale();

  return (
    <div className="rounded-xl ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columns.orderId')}</TableHead>
            <TableHead>{t('columns.merchant')}</TableHead>
            <TableHead>{t('columns.customer')}</TableHead>
            <TableHead>{t('columns.distributor')}</TableHead>
            <TableHead>{t('columns.status')}</TableHead>
            <TableHead className="text-right">{t('columns.total')}</TableHead>
            <TableHead>{t('columns.date')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}…</TableCell>
              <TableCell>
                {order.tenant.businessName ?? order.tenant.slug}
              </TableCell>
              <TableCell>{order.guestEmail ?? '—'}</TableCell>
              <TableCell>{order.distributor?.name ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[order.status] ?? 'secondary'}>
                  {order.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatPrice(order.total, order.currency, locale)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(order.createdAt, locale)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
