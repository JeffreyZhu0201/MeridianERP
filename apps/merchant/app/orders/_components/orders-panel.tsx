'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  EmptyState,
  OrderListFrame,
  PickupVerifyDialog,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type OrderListRow,
} from '@meridian/ui';
import type { FulfillmentType, MerchantOrderListItem } from '@meridian/shared';
import { formatPickupCodeHint } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface OrdersPanelProps {
  orders: MerchantOrderListItem[];
  pickupPending: MerchantOrderListItem[];
  token: string;
}

function formatMoney(value: string | number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

function customerLabel(order: MerchantOrderListItem, guestLabel: string): string {
  return order.customer?.email ?? order.guestEmail ?? guestLabel;
}

function toRow(order: MerchantOrderListItem, guestLabel: string, withCodeHint = false): OrderListRow {
  return {
    id: order.id,
    customerLabel: customerLabel(order, guestLabel),
    status: order.status,
    fulfillmentType: (order.fulfillmentType ?? 'PICKUP') as FulfillmentType,
    total: formatMoney(order.total, order.currency),
    createdAt: formatDate(order.createdAt),
    meta: withCodeHint ? formatPickupCodeHint(order.pickupCode) : undefined,
  };
}

export function OrdersPanel({ orders, pickupPending, token }: OrdersPanelProps) {
  const t = useTranslations('merchant.orders');
  const router = useRouter();
  const [primaryTab, setPrimaryTab] = useState('all');
  const [verifyTarget, setVerifyTarget] = useState<MerchantOrderListItem | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const allRows = useMemo(
    () => orders.map((o) => toRow(o, t('guest'))),
    [orders, t],
  );
  const pendingRows = useMemo(
    () => pickupPending.map((o) => toRow(o, t('guest'), true)),
    [pickupPending, t],
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
      router.refresh();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : t('verifyPickup.failed'));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <>
      <Tabs value={primaryTab} onValueChange={setPrimaryTab}>
        <TabsList>
          <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="pickup-pending">
            {t('tabs.pickupPending')}
            {pickupPending.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {pickupPending.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <OrderListFrame
            rows={allRows}
            showTabs
            emptyState={
              <EmptyState title={t('table.empty')} description={t('table.emptyHint')} />
            }
            renderRowAction={(row) => (
              <Link
                href={`/orders/${row.id}`}
                className="text-xs text-primary hover:underline"
              >
                View
              </Link>
            )}
          />
        </TabsContent>

        <TabsContent value="pickup-pending" className="mt-4">
          <OrderListFrame
            rows={pendingRows}
            showTabs={false}
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
    </>
  );
}
