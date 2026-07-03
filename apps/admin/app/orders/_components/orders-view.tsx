'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  cn,
  DeliveryShipDialog,
  formatMoney,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { DeliveryAddress, PlatformOrderDetail } from '@meridian/shared';
import { OrderStatus } from '@meridian/shared';

import { apiFetch, type PlatformOrder } from '@/lib/api';

interface OrdersViewProps {
  orders: PlatformOrder[];
  token: string;
  activeTab: 'all' | 'delivery';
  statusFilter?: string;
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

function formatAddress(address: DeliveryAddress): string {
  return [
    address.name,
    address.phone,
    address.line1,
    address.line2,
    [address.city, address.province, address.postalCode].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' · ');
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

const ORDER_STATUSES = Object.values(OrderStatus);

export function OrdersView({ orders, token, activeTab, statusFilter = '' }: OrdersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.orders');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [error, setError] = useState('');
  const [shipTarget, setShipTarget] = useState<PlatformOrderDetail | null>(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [shipping, setShipping] = useState(false);

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`${pathname}?${params.toString()}`);
  }

  function setTab(tab: 'all' | 'delivery') {
    updateParams((params) => {
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
    });
  }

  function setStatus(value: string) {
    updateParams((params) => {
      if (value) {
        params.set('status', value);
      } else {
        params.delete('status');
      }
      params.delete('page');
    });
  }

  async function openShipDialog(orderId: string) {
    setShipLoading(true);
    setError('');
    try {
      const detail = await apiFetch<PlatformOrderDetail>(
        `/platform/orders/${orderId}`,
        {},
        token,
      );
      setShipTarget(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shipFailed'));
    } finally {
      setShipLoading(false);
    }
  }

  async function handleConfirmShip() {
    if (!shipTarget) return;
    setShipping(true);
    setError('');
    try {
      await apiFetch(`/platform/orders/${shipTarget.id}/ship`, { method: 'POST' }, token);
      setShipTarget(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shipFailed'));
    } finally {
      setShipping(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
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

        {activeTab === 'all' ? (
          <div className="space-y-2">
            <Label htmlFor="order-status-filter">{t('filterStatus')}</Label>
            <Select
              id="order-status-filter"
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
              className="w-[180px]"
            >
              <option value="">{t('allStatuses')}</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {orders.length === 0 ? (
        <div className="rounded-xl ring-1 ring-border p-12 text-center">
          <p className="text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
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
                {activeTab === 'delivery' ? (
                  <TableHead className="text-right">{t('columns.actions')}</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/orders/${order.id}`} className="text-primary hover:underline">
                      {order.id.slice(0, 8)}…
                    </Link>
                  </TableCell>
                  <TableCell>{order.tenant.businessName ?? order.tenant.slug}</TableCell>
                  <TableCell>{order.guestEmail ?? tc('emptyDash')}</TableCell>
                  <TableCell>{order.distributor?.name ?? tc('emptyDash')}</TableCell>
                  <TableCell>
                    {order.fulfillmentType ? (
                      <Badge variant={fulfillmentVariant[order.fulfillmentType] ?? 'secondary'}>
                        {order.fulfillmentType === 'DELIVERY'
                          ? t('fulfillmentDelivery')
                          : t('fulfillmentPickup')}
                      </Badge>
                    ) : (
                      tc('emptyDash')
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[order.status] ?? 'secondary'}>
                      {t(`status.${order.status}` as `status.${OrderStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(order.total, order.currency, locale)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt, locale)}
                  </TableCell>
                  {activeTab === 'delivery' ? (
                    <TableCell className="text-right">
                      {order.status === 'PAID' && order.fulfillmentType === 'DELIVERY' ? (
                        <Button
                          size="sm"
                          onClick={() => openShipDialog(order.id)}
                          disabled={shipLoading && shipTarget?.id === order.id}
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
      )}

      {shipTarget ? (
        <DeliveryShipDialog
          open={!!shipTarget}
          onOpenChange={(open) => {
            if (!open) setShipTarget(null);
          }}
          orderId={shipTarget.id}
          branchName={shipTarget.tenant.businessName ?? shipTarget.tenant.slug}
          customerLabel={shipTarget.guestEmail ?? tc('emptyDash')}
          addressSummary={
            shipTarget.deliveryAddress ? formatAddress(shipTarget.deliveryAddress) : tc('emptyDash')
          }
          lines={shipTarget.lines.map((line) => ({
            productName: line.productName,
            quantity: line.quantity,
            skuCode: line.skuCode ?? undefined,
          }))}
          onConfirm={handleConfirmShip}
          isSubmitting={shipping}
        />
      ) : null}
    </div>
  );
}
