import { getTranslations } from 'next-intl/server';
import { StoreCheckoutShell } from '@meridian/ui';

import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getServerCartSession } from '@/lib/cart-session.server';
import { getToken } from '@/lib/auth';
import { CheckoutForm } from './_components/checkout-form';
import type { PublishedStoreListResponse } from '@meridian/shared';

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const token = await getToken();
  const cartSession = token ? undefined : await getServerCartSession(slug);
  const t = await getTranslations('store');

  const [cart, stores] = await Promise.all([
    apiFetch<Cart>(
      storePath(slug, 'cart'),
      {},
      token ? token : cartSession ? { cartSession } : { storeSlug: slug },
    ).catch(() => null),
    apiFetch<PublishedStoreListResponse>('/store/stores').catch(() => ({ items: [] })),
  ]);

  const storeMeta = stores.items.find((s) => s.slug === slug);
  const isFlagship = storeMeta?.isFlagship ?? false;

  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <StoreCheckoutShell
      homeHref={`/s/${slug}`}
      brandLabel={storeName}
      secureLabel={t('checkout.secure')}
    >
      <CheckoutForm
        storeSlug={slug}
        cart={cart}
        token={token}
        basePath={`/s/${slug}`}
        allowPickup={!isFlagship}
        defaultFulfillmentType={isFlagship ? 'DELIVERY' : 'PICKUP'}
      />
    </StoreCheckoutShell>
  );
}
