import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button, EmptyState, formatMoney, StoreCatalogHeader } from '@meridian/ui/server';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { CartView } from '@/app/shop/_components/cart-view';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getServerCartSession } from '@/lib/cart-session.server';
import { getToken } from '@/lib/auth';
import { getFulfillmentSlug } from '@/lib/fulfillment';

export default async function ShopCartPage() {
  const fulfillmentSlug = await getFulfillmentSlug();
  const token = await getToken();
  const cartSession = token ? undefined : await getServerCartSession(fulfillmentSlug);
  const locale = await getLocale();
  const t = await getTranslations('store');

  const cart = fulfillmentSlug
    ? await apiFetch<Cart>(
        storePath(fulfillmentSlug, 'cart'),
        {},
        token ? token : cartSession ? { cartSession } : { storeSlug: fulfillmentSlug },
      ).catch(() => null)
    : null;

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const isEmpty = !cart || cart.items.length === 0;

  return (
    <ShopShellWrapper fulfillmentSlug={fulfillmentSlug} cartCount={cartCount}>
      <StoreCatalogHeader
        title={t('cart.title')}
        metrics={[
          { title: t('cart.qty'), value: cartCount },
          {
            title: t('cart.subtotal'),
            value: cart ? formatMoney(cart.subtotal, locale) : formatMoney(0, locale),
            accent: cartCount > 0,
          },
        ]}
      />

      {isEmpty ? (
        <EmptyState
          title={t('cart.empty')}
          action={
            <Link href="/shop">
              <Button className="rounded-full">{t('cart.continueShopping')}</Button>
            </Link>
          }
        />
      ) : cart ? (
        <CartView
          cart={cart}
          storeSlug={fulfillmentSlug}
          token={token}
          shopBasePath="/shop"
        />
      ) : null}
    </ShopShellWrapper>
  );
}
