import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, Button, EmptyState, formatMoney, ListPageFrame } from '@meridian/ui/server';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getServerCartSession } from '@/lib/cart-session.server';
import { getToken } from '@/lib/auth';
import { CartView } from './_components/cart-view';

interface CartPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CartPage({ params }: CartPageProps) {
  const { slug } = await params;
  const token = await getToken();
  const cartSession = token ? undefined : await getServerCartSession(slug);
  const locale = await getLocale();
  const t = await getTranslations('store');

  const cart = await apiFetch<Cart>(
    storePath(slug, 'cart'),
    {},
    token ? token : cartSession ? { cartSession } : { storeSlug: slug },
  ).catch(() => null);
  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const isEmpty = !cart || cart.items.length === 0;

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('cart.qty'), value: cartCount },
            {
              title: t('cart.subtotal'),
              value: cart ? formatMoney(cart.subtotal, locale) : formatMoney(0, locale),
            },
          ]}
        />
        <ListPageFrame
          title={t('cart.title')}
          emptyState={
            isEmpty ? (
              <EmptyState
                title={t('cart.empty')}
                action={
                  <Link href={`/s/${slug}`}>
                    <Button>{t('cart.continueShopping')}</Button>
                  </Link>
                }
              />
            ) : undefined
          }
        >
          {cart ? <CartView cart={cart} storeSlug={slug} token={token} /> : null}
        </ListPageFrame>
      </div>
    </StoreShellWrapper>
  );
}
