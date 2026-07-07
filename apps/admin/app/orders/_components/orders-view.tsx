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
  Dialog,
  DialogCloseButton,
  formatMoney,
  Input,
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
import { AdminAiInsightPanel } from '@/app/_components/admin-ai-insight-panel';

interface OrdersViewProps {
  orders: PlatformOrder[];
  token: string;
  variant?: 'default' | 'flagshipDelivery';
  activeTab?: 'all' | 'delivery';
  statusFilter?: string;
  tenantIdFilter?: string;
  guestEmailFilter?: string;
  merchants: Array<{ tenantId: string; businessName: string }>;
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

export function OrdersView({
  orders,
  token,
  variant = 'default',
  activeTab = 'all',
  statusFilter = '',
  tenantIdFilter = '',
  guestEmailFilter = '',
  merchants,
}: OrdersViewProps) {
  const isFlagshipDelivery = variant === 'flagshipDelivery';
  const showShipActions = isFlagshipDelivery || activeTab === 'delivery';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.orders');
  const ta = useTranslations('admin.aiInsight');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [error, setError] = useState('');
  const [shipTarget, setShipTarget] = useState<PlatformOrderDetail | null>(null);
  const [insightOrderId, setInsightOrderId] = useState<string | null>(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [shipping, setShipping] = useState(false);

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`${pathname}?${params.toString()}`);
  }

  function setTab(tab: 'all' | 'delivery') {
    if (tab === 'delivery') {
      router.push('/allocations');
      return;
    }
    updateParams((params) => {
      params.delete('tab');
      params.delete('fulfillmentType');
      params.delete('status');
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

  function setTenantId(value: string) {
    updateParams((params) => {
      if (value) {
        params.set('tenantId', value);
      } else {
        params.delete('tenantId');
      }
      params.delete('page');
    });
  }

  function setGuestEmail(value: string) {
    updateParams((params) => {
      if (value.trim()) {
        params.set('guestEmail', value.trim());
      } else {
        params.delete('guestEmail');
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

  if (isFlagshipDelivery && orders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!isFlagshipDelivery ? (
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
            <>
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
              <div className="space-y-2">
                <Label htmlFor="order-merchant-filter">{t('filterMerchant')}</Label>
                <Select
                  id="order-merchant-filter"
                  value={tenantIdFilter}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="min-w-[200px]"
                >
                  <option value="">{t('allMerchants')}</option>
                  {merchants.map((m) => (
                    <option key={m.tenantId} value={m.tenantId}>
                      {m.businessName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-guest-email">{t('filterGuestEmail')}</Label>
                <Input
                  id="order-guest-email"
                  type="search"
                  defaultValue={guestEmailFilter}
                  placeholder={t('guestEmailPlaceholder')}
                  className="w-[220px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setGuestEmail((e.target as HTMLInputElement).value);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value !== guestEmailFilter) {
                      setGuestEmail(e.target.value);
                    }
                  }}
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}

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
                {!isFlagshipDelivery ? <TableHead>{t('columns.fulfillment')}</TableHead> : null}
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="text-right">{t('columns.total')}</TableHead>
                <TableHead>{t('columns.date')}</TableHead>
                {showShipActions ? (
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
                  {!isFlagshipDelivery ? (
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
                  ) : null}
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
                  {showShipActions ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isFlagshipDelivery && order.fulfillmentType === 'DELIVERY' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setInsightOrderId(order.id)}
                          >
                            {ta('orderButton')}
                          </Button>
                        ) : null}
                        {order.status === 'PAID' && order.fulfillmentType === 'DELIVERY' ? (
                          <Button
                            size="sm"
                            onClick={() => openShipDialog(order.id)}
                            disabled={shipLoading && shipTarget?.id === order.id}
                          >
                            {t('ship')}
                          </Button>
                        ) : null}
                      </div>
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

      <Dialog
        open={!!insightOrderId}
        onOpenChange={(open) => !open && setInsightOrderId(null)}
        title={ta('orderDialogTitle')}
        footer={
          <DialogCloseButton onClose={() => setInsightOrderId(null)}>
            {tc('cancel')}
          </DialogCloseButton>
        }
      >
        {insightOrderId ? (
          <AdminAiInsightPanel
            token={token}
            endpoint="/platform/ai/insights/delivery-order"
            body={{ orderId: insightOrderId }}
            compact
          />
        ) : null}
      </Dialog>
    </div>
  );
}
