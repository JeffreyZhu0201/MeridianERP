import { getTranslations } from 'next-intl/server';
import { StoreCheckoutShell } from '@meridian/ui';

import { CheckoutForm } from '@/app/s/[slug]/checkout/_components/checkout-form';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getServerCartSession } from '@/lib/cart-session.server';
import { getToken } from '@/lib/auth';
import { getFulfillmentSlug } from '@/lib/fulfillment';
import type { PublishedStoreListResponse } from '@meridian/shared';

export default async function ShopCheckoutPage() {
  const fulfillmentSlug = await getFulfillmentSlug();
  const token = await getToken();
  const cartSession = token ? undefined : await getServerCartSession(fulfillmentSlug);
  const t = await getTranslations('store');

  const [cart, stores] = await Promise.all([
    fulfillmentSlug
      ? apiFetch<Cart>(
          storePath(fulfillmentSlug, 'cart'),
          {},
          token ? token : cartSession ? { cartSession } : { storeSlug: fulfillmentSlug },
        ).catch(() => null)
      : Promise.resolve(null),
    apiFetch<PublishedStoreListResponse>('/store/stores').catch(() => ({ items: [] })),
  ]);

  const storeMeta = stores.items.find((s) => s.slug === fulfillmentSlug);
  const isFlagship = storeMeta?.isFlagship ?? false;

  return (
    <StoreCheckoutShell
      homeHref="/shop"
      secureLabel={t('checkout.secure')}
    >
      <CheckoutForm
        storeSlug={fulfillmentSlug}
        cart={cart}
        token={token}
        basePath="/shop"
        allowPickup={!isFlagship}
        defaultFulfillmentType={isFlagship ? 'DELIVERY' : 'PICKUP'}
      />
    </StoreCheckoutShell>
  );
}
