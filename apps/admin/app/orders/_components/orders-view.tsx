'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  Button,
  cn,
  DeliveryShipDialog,
  OrderListFrame,
  type OrderListRow,
} from '@meridian/ui';
import type { DeliveryAddress, PlatformOrderDetail } from '@meridian/shared';

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

function toRow(order: PlatformOrder, locale: string): OrderListRow {
  return {
    id: order.id,
    customerLabel: order.guestEmail ?? '—',
    status: order.status,
    fulfillmentType: (order.fulfillmentType ?? 'PICKUP') as OrderListRow['fulfillmentType'],
    total: formatPrice(order.total, order.currency, locale),
    createdAt: formatDate(order.createdAt, locale),
  };
}

export function OrdersView({ orders, token, activeTab }: OrdersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.orders');
  const locale = useLocale();
  const [error, setError] = useState('');
  const [shipTarget, setShipTarget] = useState<PlatformOrderDetail | null>(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [shipping, setShipping] = useState(false);

  const rows = useMemo(
    () => orders.map((order) => toRow(order, locale)),
    [orders, locale],
  );

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

      <OrderListFrame
        rows={rows}
        showTabs={false}
        activeTab={activeTab === 'delivery' ? 'delivery' : 'all'}
        showMerchantColumn
        merchantLabel={(row) => {
          const order = orders.find((o) => o.id === row.id);
          return order?.tenant.businessName ?? order?.tenant.slug ?? '—';
        }}
        emptyState={
          <div className="rounded-xl ring-1 ring-border p-12 text-center">
            <p className="text-muted-foreground">{t('empty')}</p>
          </div>
        }
        renderRowAction={
          activeTab === 'delivery'
            ? (row) => {
                const order = orders.find((o) => o.id === row.id);
                if (
                  !order ||
                  order.status !== 'PAID' ||
                  order.fulfillmentType !== 'DELIVERY'
                ) {
                  return null;
                }
                return (
                  <Button
                    size="sm"
                    onClick={() => openShipDialog(order.id)}
                    disabled={shipLoading && shipTarget?.id === order.id}
                  >
                    {t('ship')}
                  </Button>
                );
              }
            : undefined
        }
      />

      {shipTarget ? (
        <DeliveryShipDialog
          open={!!shipTarget}
          onOpenChange={(open) => {
            if (!open) setShipTarget(null);
          }}
          orderId={shipTarget.id}
          branchName={
            shipTarget.tenant.businessName ?? shipTarget.tenant.slug
          }
          customerLabel={shipTarget.guestEmail ?? '—'}
          addressSummary={
            shipTarget.deliveryAddress
              ? formatAddress(shipTarget.deliveryAddress)
              : '—'
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
