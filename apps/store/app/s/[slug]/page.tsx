import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart, type Product } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ProductGrid } from './_components/product-grid';

interface StoreHomePageProps {
  params: Promise<{ slug: string }>;
}

export default async function StoreHomePage({ params }: StoreHomePageProps) {
  const { slug } = await params;
  const token = await getToken();
  const t = await getTranslations('store');

  const [products, cart] = await Promise.all([
    apiFetch<Product[]>(storePath(slug, 'products')).catch(() => []),
    apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const isEmpty = products.length === 0;

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <ListPageFrame
        title={t('home.shop')}
        description={t('home.browseCatalog')}
        emptyState={
          isEmpty ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <p className="text-muted-foreground">{t('home.empty')}</p>
            </div>
          ) : undefined
        }
      >
        <ProductGrid products={products} storeSlug={slug} />
      </ListPageFrame>
    </StoreShellWrapper>
  );
}
