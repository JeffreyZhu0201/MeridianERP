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

  const [products, cart] = await Promise.all([
    apiFetch<Product[]>(storePath(slug, 'products')).catch(() => []),
    apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null),
  ]);

  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
          <p className="text-sm text-muted-foreground">Browse our catalog</p>
        </div>
        <ProductGrid products={products} storeSlug={slug} />
      </div>
    </StoreShellWrapper>
  );
}
