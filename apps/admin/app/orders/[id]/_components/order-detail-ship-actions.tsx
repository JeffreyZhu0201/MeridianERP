'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, DeliveryShipDialog } from '@meridian/ui';
import type { DeliveryAddress, PlatformOrderDetail } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

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

interface OrderDetailShipActionsProps {
  order: PlatformOrderDetail;
  token: string;
}

export function OrderDetailShipActions({ order, token }: OrderDetailShipActionsProps) {
  const router = useRouter();
  const t = useTranslations('admin.orders');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [error, setError] = useState('');

  const canShip =
    order.status === 'PAID' && order.fulfillmentType === 'DELIVERY' && !order.shippedAt;

  if (!canShip) return null;

  async function handleConfirmShip() {
    setShipping(true);
    setError('');
    try {
      await apiFetch(`/platform/orders/${order.id}/ship`, { method: 'POST' }, token);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shipFailed'));
    } finally {
      setShipping(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t('ship')}</Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <DeliveryShipDialog
        open={open}
        onOpenChange={setOpen}
        orderId={order.id}
        branchName={order.tenant.businessName ?? order.tenant.slug}
        customerLabel={order.guestEmail ?? order.customer?.email ?? tc('emptyDash')}
        addressSummary={
          order.deliveryAddress ? formatAddress(order.deliveryAddress) : tc('emptyDash')
        }
        lines={order.lines.map((line) => ({
          productName: line.productName,
          quantity: line.quantity,
          skuCode: line.skuCode ?? undefined,
        }))}
        onConfirm={handleConfirmShip}
        isSubmitting={shipping}
      />
    </>
  );
}
