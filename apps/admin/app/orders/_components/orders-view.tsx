'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Badge, Button, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@meridian/ui';

import { apiFetch, type PlatformOrder } from '@/lib/api';

interface OrdersViewProps {
  orders: PlatformOrder[];
  token: string;
  activeTab: 'all' | 'delivery';
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

export function OrdersView({ orders, token, activeTab }: OrdersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.orders');
  const locale = useLocale();
  const [error, setError] = useState('');
  const [shippingId, setShippingId] = useState<string | null>(null);

  function setTab(tab: 'all' | 'delivery') {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'delivery') {
      params.set('tab', 'delivery');
      params.set('fulfillmentType', 'DELIVERY');
      params.set('status', 'PAID');
    } else {
      params.delete('tab');
      params.delete('fulfillmentType');
      params.delete('status');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleShip(orderId: string) {
    setShippingId(orderId);
    setError('');
    try {
      await apiFetch(`/platform/orders/${orderId}/ship`, { method: 'POST' }, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shipFailed'));
    } finally {
      setShippingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl bg-muted/50 p-1 ring-1 ring-border w-fit">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={cn(
            'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'all'
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t('tabAll')}
        </button>
        <button
          type="button"
          onClick={() => setTab('delivery')}
          className={cn(
            'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'delivery'
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t('tabDelivery')}
        </button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-xl ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.orderId')}</TableHead>
              <TableHead>{t('columns.merchant')}</TableHead>
              <TableHead>{t('columns.customer')}</TableHead>
              <TableHead>{t('columns.fulfillment')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead className="text-right">{t('columns.total')}</TableHead>
              <TableHead>{t('columns.date')}</TableHead>
              {activeTab === 'delivery' ? (
                <TableHead className="text-right">{t('columns.actions')}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}…</TableCell>
                <TableCell>{order.tenant.businessName ?? order.tenant.slug}</TableCell>
                <TableCell>{order.guestEmail ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{order.fulfillmentType ?? '—'}</Badge>
                </TableCell>
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
                {activeTab === 'delivery' ? (
                  <TableCell className="text-right">
                    {order.status === 'PAID' && order.fulfillmentType === 'DELIVERY' ? (
                      <Button
                        size="sm"
                        onClick={() => handleShip(order.id)}
                        disabled={shippingId === order.id}
                      >
                        {t('ship')}
                      </Button>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
