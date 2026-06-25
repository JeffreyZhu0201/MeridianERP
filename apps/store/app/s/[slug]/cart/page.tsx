import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button, ListPageFrame } from '@meridian/ui';

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
      <ListPageFrame
        title={t('cart.title')}
        emptyState={
          isEmpty ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <p className="text-muted-foreground">{t('cart.empty')}</p>
              <Link href={`/s/${slug}`}>
                <Button className="mt-4">{t('cart.continueShopping')}</Button>
              </Link>
            </div>
          ) : undefined
        }
      >
        {cart ? <CartView cart={cart} storeSlug={slug} token={token} /> : null}
      </ListPageFrame>
    </StoreShellWrapper>
  );
}
