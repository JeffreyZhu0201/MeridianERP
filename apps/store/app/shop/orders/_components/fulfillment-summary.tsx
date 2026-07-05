import { getTranslations } from 'next-intl/server';
import type { DeliveryAddress, StoreOrderDetail } from '@meridian/shared';

import { PickupFulfillmentCard } from './pickup-fulfillment-card';

interface FulfillmentSummaryProps {
  fulfillmentSlug: string;
  order: StoreOrderDetail;
  token: string;
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

export async function FulfillmentSummary({
  fulfillmentSlug,
  order,
  token,
}: FulfillmentSummaryProps) {
  const t = await getTranslations('store.confirmation');

  if (order.fulfillmentType === 'DELIVERY' && order.deliveryAddress) {
    return (
      <div className="rounded-xl ring-1 ring-border p-4 text-sm">
        <p className="font-medium">{t('deliveryTitle')}</p>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          {formatAddress(order.deliveryAddress)}
        </p>
        {order.shippedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('shippedAt', { date: new Date(order.shippedAt).toLocaleDateString() })}
          </p>
        ) : null}
      </div>
    );
  }

  if (order.fulfillmentType === 'PICKUP') {
    return (
      <PickupFulfillmentCard
        fulfillmentSlug={fulfillmentSlug}
        order={order}
        token={token}
      />
    );
  }

  return null;
}
