import { getTranslations } from 'next-intl/server';
import { FormPageFrame } from '@meridian/ui';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getServerCartSession } from '@/lib/cart-session.server';
import { getToken } from '@/lib/auth';
import { CheckoutForm } from './_components/checkout-form';

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
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

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <FormPageFrame title={t('checkout.title')} className="mx-auto max-w-lg">
        <CheckoutForm storeSlug={slug} cart={cart} token={token} />
      </FormPageFrame>
    </StoreShellWrapper>
  );
}
