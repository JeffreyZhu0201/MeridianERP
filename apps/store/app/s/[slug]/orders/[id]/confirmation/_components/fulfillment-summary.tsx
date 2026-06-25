import { getTranslations } from 'next-intl/server';
import type { DeliveryAddress, StoreOrderDetail } from '@meridian/shared';

interface FulfillmentSummaryProps {
  order: StoreOrderDetail;
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

export async function FulfillmentSummary({ order }: FulfillmentSummaryProps) {
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

  if (order.fulfillmentType === 'PICKUP' && order.pickupCode) {
    return (
      <div className="rounded-xl ring-1 ring-border p-4 text-center">
        <p className="text-sm font-medium">{t('pickupTitle')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('pickupHint')}</p>
        <p className="mt-4 text-xs text-muted-foreground">{t('pickupCodeLabel')}</p>
        <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.3em]">
          {order.pickupCode}
        </p>
      </div>
    );
  }

  return null;
}
