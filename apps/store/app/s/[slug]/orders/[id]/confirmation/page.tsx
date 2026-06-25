import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { DetailPageFrame, FulfillmentTypeBadge } from '@meridian/ui';
import type { StoreOrderDetail } from '@meridian/shared';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { FulfillmentSummary } from './_components/fulfillment-summary';
import { PaymentStatusBanner } from './_components/payment-status-banner';

interface OrderConfirmationPageProps {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ redirect_status?: string; payment_intent?: string }>;
}

function formatMoney(value: string | number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const { slug, id } = await params;
  const { redirect_status: redirectStatus } = await searchParams;
  const token = await getToken();
  const t = await getTranslations('store');

  if (!token) {
    redirect(`/s/${slug}/login?from=${encodeURIComponent(`/s/${slug}/orders/${id}/confirmation`)}`);
  }

  const [order, cart] = await Promise.all([
    apiFetch<StoreOrderDetail>(storePath(slug, `orders/${id}`), {}, token).catch(() => null),
    apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (!order) {
    return (
      <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
        <DetailPageFrame
          title={t('confirmation.notFound')}
          backHref={`/s/${slug}/account`}
          backLabel={t('confirmation.backAccount')}
        >
          <p className="text-sm text-muted-foreground">{t('confirmation.notFoundDescription')}</p>
        </DetailPageFrame>
      </StoreShellWrapper>
    );
  }

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <DetailPageFrame
        title={t('confirmation.title')}
        description={t('confirmation.orderDescription', {
          id: order.id.slice(0, 8),
          status: order.status,
        })}
        backHref={`/s/${slug}/account`}
        backLabel={t('confirmation.backAccount')}
      >
        <PaymentStatusBanner redirectStatus={redirectStatus} />
        {order.fulfillmentType ? (
          <FulfillmentTypeBadge type={order.fulfillmentType} />
        ) : null}
        <FulfillmentSummary order={order} />
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
    </StoreShellWrapper>
  );
}
