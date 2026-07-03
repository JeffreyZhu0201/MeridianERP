import { notFound } from 'next/navigation';
import type { UnifiedStoreProduct } from '@meridian/shared';

import { ShopShellWrapper } from '@/components/shop-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { catalogApiPath, getFulfillmentSlug } from '@/lib/fulfillment';
import { UnifiedProductDetail } from '../_components/unified-product-detail';

interface ShopProductPageProps {
  params: Promise<{ productSlug: string }>;
}

export default async function ShopProductPage({ params }: ShopProductPageProps) {
  const { productSlug } = await params;
  const fulfillmentSlug = await getFulfillmentSlug();
  const token = await getToken();

  if (!fulfillmentSlug) notFound();

  const [product, cart] = await Promise.all([
    apiFetch<UnifiedStoreProduct>(catalogApiPath(fulfillmentSlug, productSlug)).catch(() => null),
    apiFetch<Cart>(storePath(fulfillmentSlug, 'cart'), {}, token).catch(() => null),
  ]);

  if (!product) notFound();

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <ShopShellWrapper fulfillmentSlug={fulfillmentSlug} cartCount={cartCount}>
      <UnifiedProductDetail
        product={product}
        fulfillmentSlug={fulfillmentSlug}
        token={token ?? undefined}
      />
    </ShopShellWrapper>
  );
}
