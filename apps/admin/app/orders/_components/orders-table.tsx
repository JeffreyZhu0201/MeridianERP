'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge, formatMoney, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@meridian/ui';

import type { PlatformOrder } from '@/lib/api';

interface OrdersTableProps {
  orders: PlatformOrder[];
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

const fulfillmentVariant: Record<string, 'default' | 'secondary'> = {
  DELIVERY: 'default',
  PICKUP: 'secondary',
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
            <TableHead>{t('columns.fulfillment')}</TableHead>
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
                {order.fulfillmentType ? (
                  <Badge variant={fulfillmentVariant[order.fulfillmentType] ?? 'secondary'}>
                    {order.fulfillmentType === 'DELIVERY' ? t('fulfillmentDelivery') : t('fulfillmentPickup')}
                  </Badge>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[order.status] ?? 'secondary'}>
                  {order.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(order.total, order.currency, locale)}
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
