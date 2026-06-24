import Link from 'next/link';
import { Button } from '@meridian/ui';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CartView } from './_components/cart-view';

interface CartPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CartPage({ params }: CartPageProps) {
  const { slug } = await params;
  const token = await getToken();

  const cart = await apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null);
  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        {cart && cart.items.length > 0 ? (
          <CartView cart={cart} storeSlug={slug} token={token} />
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Your cart is empty</p>
            <Link href={`/s/${slug}`}>
              <Button className="mt-4">Continue shopping</Button>
            </Link>
          </div>
        )}
      </div>
    </StoreShellWrapper>
  );
}
