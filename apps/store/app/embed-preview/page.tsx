import { getLocale, getTranslations } from 'next-intl/server';
import { StoreShell } from '@meridian/ui';
import {
  ProductCard,
  StoreCatalogHeader,
  StoreFeaturedHero,
  formatMoney,
} from '@meridian/ui/server';

export const metadata = {
  robots: { index: false, follow: false },
};

const DEMO_PRODUCTS = [
  { name: 'Jasmine Tea', slug: 'jasmine-tea', price: 32, badge: 'In stock' },
  { name: 'Summer Hat', slug: 'summer-hat', price: 22, badge: 'Low stock' },
  { name: 'Ceramic Mug', slug: 'ceramic-mug', price: 18, badge: 'In stock' },
  { name: 'Linen Tote', slug: 'linen-tote', price: 45, badge: 'In stock' },
];

export default async function StoreEmbedPreviewPage() {
  const locale = await getLocale();
  const t = await getTranslations('store');

  return (
    <StoreShell
      storeSlug="demo"
      storeName="Meridian Store"
      basePath="/shop"
      cartCount={2}
    >
      <StoreCatalogHeader
        title={t('home.shop')}
        description={t('home.browseCatalog')}
        metrics={[
          { title: t('home.catalogMetric'), value: DEMO_PRODUCTS.length },
          { title: t('nav.cart'), value: t('home.cartItems', { count: 2 }), accent: true },
        ]}
      />

      <StoreFeaturedHero
        badge={t('home.flagshipBadge')}
        title={DEMO_PRODUCTS[0].name}
        description="Premium flagship catalog with branch fulfillment."
        price={formatMoney(DEMO_PRODUCTS[0].price, locale)}
        href="/shop"
        ctaLabel={t('product.viewProduct')}
      />

      <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
        <h3 className="store-headline-lg text-foreground">{t('home.allProducts')}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {DEMO_PRODUCTS.map((product) => (
          <ProductCard
            key={product.slug}
            variant="store"
            name={product.name}
            slug={product.slug}
            storeSlug="demo"
            priceFrom={product.price}
            href="/shop"
          />
        ))}
      </div>
    </StoreShell>
  );
}
