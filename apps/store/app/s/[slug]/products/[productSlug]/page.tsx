import Link from 'next/link';
import { Button } from '@meridian/ui';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ProductDetail } from './_components/product-detail';

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params;
  const token = await getToken();

  const [product, cart] = await Promise.all([
    apiFetch<Product>(storePath(slug, `products/${productSlug}`)).catch(() => null),
    apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (!product) {
    return (
      <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <Link href={`/s/${slug}`}>
            <Button variant="outline">Back to shop</Button>
          </Link>
        </div>
      </StoreShellWrapper>
    );
  }

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <ProductDetail product={product} storeSlug={slug} token={token} />
    </StoreShellWrapper>
  );
}
