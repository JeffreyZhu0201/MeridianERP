import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import {
  BentoDetailHero,
  DetailPageFrame,
  FulfillmentTypeBadge,
  formatMoney,
} from '@meridian/ui/server';
import type { OrderStatus, StoreOrderDetail } from '@meridian/shared';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getFulfillmentSlug } from '@/lib/fulfillment';
import { FulfillmentSummary } from '../../_components/fulfillment-summary';
import { PaymentStatusBanner } from '../../_components/payment-status-banner';

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ redirect_status?: string; payment_intent?: string }>;
}

export default async function ShopOrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const { id } = await params;
  const { redirect_status: redirectStatus } = await searchParams;
  const token = await getToken();
  const fulfillmentSlug = await getFulfillmentSlug();
  const t = await getTranslations('store');
  const ts = await getTranslations('store.orderStatus');

  if (!token) {
    redirect(
      `/login?from=${encodeURIComponent(`/shop/orders/${id}/confirmation`)}`,
    );
  }

  if (!fulfillmentSlug) {
    redirect('/shop');
  }

  const [order, cart] = await Promise.all([
    apiFetch<StoreOrderDetail>(
      storePath(fulfillmentSlug, `orders/${id}`),
      {},
      token,
    ).catch(() => null),
    apiFetch<Cart>(storePath(fulfillmentSlug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = fulfillmentSlug.charAt(0).toUpperCase() + fulfillmentSlug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (!order) {
    return (
      <ShopShellWrapper
        fulfillmentSlug={fulfillmentSlug}
        storeName={storeName}
        cartCount={cartCount}
      >
        <DetailPageFrame
          title={t('confirmation.notFound')}
          backHref="/shop/account"
          backLabel={t('confirmation.backAccount')}
        >
          <p className="text-sm text-muted-foreground">{t('confirmation.notFoundDescription')}</p>
        </DetailPageFrame>
      </ShopShellWrapper>
    );
  }

  const statusLabel = ts(order.status as OrderStatus);
  const lineCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <ShopShellWrapper
      fulfillmentSlug={fulfillmentSlug}
      storeName={storeName}
      cartCount={cartCount}
    >
      <DetailPageFrame
        title={t('confirmation.title')}
        description={t('confirmation.orderDescription', {
          id: order.id.slice(0, 8),
          status: statusLabel,
        })}
        backHref="/shop/account"
        backLabel={t('confirmation.backAccount')}
      >
        <BentoDetailHero
          metrics={[
            { title: t('account.status'), value: statusLabel },
            { title: t('account.total'), value: formatMoney(order.total, order.currency) },
            { title: t('confirmation.lineItems'), value: lineCount },
          ]}
        />
        <PaymentStatusBanner redirectStatus={redirectStatus} />
        {order.fulfillmentType ? (
          <FulfillmentTypeBadge type={order.fulfillmentType} />
        ) : null}
        <FulfillmentSummary
          fulfillmentSlug={fulfillmentSlug}
          order={order}
          token={token}
        />
        <div className="space-y-4 rounded-xl ring-1 ring-border p-4 text-sm">
          <p className="text-lg font-semibold tabular-nums">
            {t('confirmation.orderTotal', {
              amount: formatMoney(order.total, order.currency),
            })}
          </p>
          <ul className="space-y-2">
            {order.lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-4">
                <span>
                  {line.productName} ({line.variantName}) × {line.quantity}
                </span>
                <span className="tabular-nums">{formatMoney(line.lineTotal, order.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      </DetailPageFrame>
    </ShopShellWrapper>
  );
}
