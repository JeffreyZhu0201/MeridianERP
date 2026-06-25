import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Badge, Button, DetailPageFrame } from '@meridian/ui';

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
  const t = await getTranslations('store');

  const [product, cart] = await Promise.all([
    apiFetch<Product>(storePath(slug, `products/${productSlug}`)).catch(() => null),
    apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (!product) {
    return (
      <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
        <DetailPageFrame
          title={t('product.notFound')}
          description={t('product.notFoundDescription')}
          backHref={`/s/${slug}`}
          backLabel={t('nav.shop')}
          actions={
            <Link href={`/s/${slug}`}>
              <Button variant="outline">{t('product.backToShop')}</Button>
            </Link>
          }
        >
          {null}
        </DetailPageFrame>
      </StoreShellWrapper>
    );
  }

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <DetailPageFrame
        title={product.name}
        description={product.description ?? undefined}
        backHref={`/s/${slug}`}
        backLabel={t('nav.shop')}
        badges={
          product.category ? <Badge variant="secondary">{product.category.name}</Badge> : undefined
        }
      >
        <ProductDetail product={product} storeSlug={slug} token={token} />
      </DetailPageFrame>
    </StoreShellWrapper>
  );
}
