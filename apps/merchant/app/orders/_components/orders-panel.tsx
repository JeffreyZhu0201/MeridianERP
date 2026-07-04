'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from '@meridian/ui';
import {
  Badge,
  Button,
  DeliveryShipDialog,
  EmptyState,
  OrderListFrame,
  PickupVerifyDialog,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  formatMoney,
  type OrderListRow,
} from '@meridian/ui';
import type {
  DeliveryAddress,
  FulfillmentType,
  MerchantOrderListItem,
  OrderStatus,
} from '@meridian/shared';
import { formatPickupCodeHint } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface OrdersPanelProps {
  orders: MerchantOrderListItem[];
  pickupPending: MerchantOrderListItem[];
  deliveryPending: MerchantOrderListItem[];
  token: string;
  businessName: string;
  showDeliveryTab: boolean;
}

function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

function customerLabel(order: MerchantOrderListItem, guestLabel: string): string {
  return order.customer?.email ?? order.guestEmail ?? guestLabel;
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

function toRow(
  order: MerchantOrderListItem,
  guestLabel: string,
  locale: string,
  statusLabel: (status: OrderStatus) => string,
  withCodeHint = false,
): OrderListRow {
  return {
    id: order.id,
    customerLabel: customerLabel(order, guestLabel),
    status: statusLabel(order.status),
    fulfillmentType: (order.fulfillmentType ?? 'PICKUP') as FulfillmentType,
    total: formatMoney(order.total, order.currency),
    createdAt: formatDate(order.createdAt, locale),
    meta: withCodeHint ? formatPickupCodeHint(order.pickupCode) : undefined,
  };
}

export function OrdersPanel({
  orders,
  pickupPending,
  deliveryPending,
  token,
  businessName,
  showDeliveryTab,
}: OrdersPanelProps) {
  const locale = useLocale();
  const t = useTranslations('merchant.orders');
  const router = useRouter();
  const [primaryTab, setPrimaryTab] = useState('all');
  const [verifyTarget, setVerifyTarget] = useState<MerchantOrderListItem | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [shipTarget, setShipTarget] = useState<MerchantOrderListItem | null>(null);
  const [shipping, setShipping] = useState(false);

  const statusLabel = (status: OrderStatus) =>
    t(`status.${status}` as 'status.PAID' | 'status.FULFILLED' | 'status.PENDING_PAYMENT' | 'status.CANCELLED' | 'status.REFUNDED');

  const allRows = useMemo(
    () => orders.map((o) => toRow(o, t('guest'), locale, statusLabel)),
    [orders, t, locale],
  );
  const pendingRows = useMemo(
    () => pickupPending.map((o) => toRow(o, t('guest'), locale, statusLabel, true)),
    [pickupPending, t, locale],
  );
  const deliveryRows = useMemo(
    () => deliveryPending.map((o) => toRow(o, t('guest'), locale, statusLabel)),
    [deliveryPending, t, locale],
  );

  async function handleVerify(code: string) {
    if (!verifyTarget) return;
    setVerifying(true);
    setVerifyError('');
    try {
      await apiFetch(`/merchant/orders/${verifyTarget.id}/verify-pickup`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }, token);
      setVerifyTarget(null);
      toast.success(t('verifyPickup.success'));
      router.refresh();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : t('verifyPickup.failed'));
    } finally {
      setVerifying(false);
    }
  }

  async function handleShip() {
    if (!shipTarget) return;
    setShipping(true);
    try {
      await apiFetch(`/merchant/orders/${shipTarget.id}/ship`, { method: 'POST' }, token);
      setShipTarget(null);
      toast.success(t('shipDelivery.success'));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('shipDelivery.failed'));
    } finally {
      setShipping(false);
    }
  }

  return (
    <>
      <Tabs value={primaryTab} onValueChange={setPrimaryTab} className="gap-3">
        <TabsList className="h-8 p-0.5">
          <TabsTrigger value="all" className="h-7 px-3 text-xs sm:text-sm">
            {t('tabs.all')}
          </TabsTrigger>
          <TabsTrigger value="pickup-pending" className="h-7 gap-1.5 px-3 text-xs sm:text-sm">
            {t('tabs.pickupPending')}
            {pickupPending.length > 0 ? (
              <Badge variant="default" className="h-5 min-w-5 px-1.5 text-[10px] leading-none">
                {pickupPending.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          {showDeliveryTab ? (
            <TabsTrigger value="delivery-pending" className="h-7 gap-1.5 px-3 text-xs sm:text-sm">
              {t('tabs.deliveryPending')}
              {deliveryPending.length > 0 ? (
                <Badge variant="default" className="h-5 min-w-5 px-1.5 text-[10px] leading-none">
                  {deliveryPending.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <OrderListFrame
            rows={allRows}
            showTabs={false}
            className="space-y-3"
            emptyState={
              <EmptyState title={t('table.empty')} description={t('table.emptyHint')} />
            }
            renderRowAction={(row) => (
              <Link
                href={`/orders/${row.id}`}
                className="text-xs text-primary hover:underline"
              >
                {t('table.view')}
              </Link>
            )}
          />
        </TabsContent>

        <TabsContent value="pickup-pending" className="mt-0">
          <OrderListFrame
            rows={pendingRows}
            showTabs={false}
            className="space-y-3"
            showMetaColumn
            metaColumnLabel={t('pickupPending.codeHint')}
            emptyState={
              <EmptyState title={t('pickupPending.empty')} description={t('pickupPending.emptyHint')} />
            }
            renderRowAction={(row) => (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const order = pickupPending.find((o) => o.id === row.id);
                  if (order) {
                    setVerifyError('');
                    setVerifyTarget(order);
                  }
                }}
              >
                {t('pickupPending.verify')}
              </Button>
            )}
          />
        </TabsContent>

        {showDeliveryTab ? (
          <TabsContent value="delivery-pending" className="mt-0">
            <OrderListFrame
              rows={deliveryRows}
              showTabs={false}
              className="space-y-3"
              emptyState={
                <EmptyState
                  title={t('deliveryPending.empty')}
                  description={t('deliveryPending.emptyHint')}
                />
              }
              renderRowAction={(row) => (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const order = deliveryPending.find((o) => o.id === row.id);
                    if (order) setShipTarget(order);
                  }}
                >
                  {t('deliveryPending.ship')}
                </Button>
              )}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      {verifyTarget ? (
        <PickupVerifyDialog
          open={!!verifyTarget}
          onOpenChange={(open) => {
            if (!open) setVerifyTarget(null);
          }}
          orderId={verifyTarget.id}
          customerLabel={customerLabel(verifyTarget, t('guest'))}
          total={formatMoney(verifyTarget.total, verifyTarget.currency)}
          onVerify={handleVerify}
          isSubmitting={verifying}
          error={verifyError}
        />
      ) : null}

      {shipTarget ? (
        <DeliveryShipDialog
          open={!!shipTarget}
          onOpenChange={(open) => {
            if (!open) setShipTarget(null);
          }}
          orderId={shipTarget.id}
          branchName={businessName}
          customerLabel={customerLabel(shipTarget, t('guest'))}
          addressSummary={
            shipTarget.deliveryAddress
              ? formatAddress(shipTarget.deliveryAddress)
              : t('deliveryPending.noAddress')
          }
          lines={shipTarget.lines.map((line) => ({
            productName: line.productName,
            quantity: line.quantity,
          }))}
          onConfirm={handleShip}
          isSubmitting={shipping}
          inventoryScope="branch"
        />
      ) : null}
    </>
  );
}
