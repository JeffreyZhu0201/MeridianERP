import { getTranslations } from 'next-intl/server';
import { FormPageFrame } from '@meridian/ui/server';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { CheckoutForm } from '@/app/s/[slug]/checkout/_components/checkout-form';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getServerCartSession } from '@/lib/cart-session.server';
import { getToken } from '@/lib/auth';
import { getFulfillmentSlug } from '@/lib/fulfillment';

export default async function ShopCheckoutPage() {
  const fulfillmentSlug = await getFulfillmentSlug();
  const token = await getToken();
  const cartSession = token ? undefined : await getServerCartSession(fulfillmentSlug);
  const t = await getTranslations('store');

  const cart = fulfillmentSlug
    ? await apiFetch<Cart>(
        storePath(fulfillmentSlug, 'cart'),
        {},
        token ? token : cartSession ? { cartSession } : { storeSlug: fulfillmentSlug },
      ).catch(() => null)
    : null;

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <ShopShellWrapper fulfillmentSlug={fulfillmentSlug} cartCount={cartCount}>
      <FormPageFrame title={t('checkout.title')} className="mx-auto max-w-lg">
        <CheckoutForm storeSlug={fulfillmentSlug} cart={cart} token={token} />
      </FormPageFrame>
    </ShopShellWrapper>
  );
}
