'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, formatMoney, Select } from '@meridian/ui';
import type { UnifiedStoreProduct } from '@meridian/shared';

import { apiFetch, storePath } from '@/lib/api';

interface UnifiedProductDetailProps {
  product: UnifiedStoreProduct;
  fulfillmentSlug: string;
  token?: string;
}

export function UnifiedProductDetail({
  product,
  fulfillmentSlug,
  token,
}: UnifiedProductDetailProps) {
  const router = useRouter();
  const t = useTranslations('store');
  const variants = product.variants;
  const [variantId, setVariantId] = useState(variants[0]?.id ?? '');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const selected = variants.find((v) => v.id === variantId);
  const outOfStock = !selected?.inStock || !selected.branchVariantId;
  const displayPrice = selected?.branchPrice ?? selected?.flagshipPrice ?? 0;

  async function handleAddToCart() {
    if (!selected?.branchVariantId) return;
    setAdding(true);
    setError('');
    try {
      await apiFetch(
        storePath(fulfillmentSlug, 'cart/items'),
        {
          method: 'POST',
          body: JSON.stringify({ variantId: selected.branchVariantId, quantity: 1 }),
        },
        token ? token : { storeSlug: fulfillmentSlug },
      );
      router.push('/shop/cart');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('product.addFailed'));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="store-bento-card relative aspect-square overflow-hidden bg-muted/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-muted to-accent/30" />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
        <div>
          <h1 className="store-headline-xl text-foreground">{product.name}</h1>
          {product.description ? (
            <p className="store-body-md mt-3 text-muted-foreground">{product.description}</p>
          ) : null}
        </div>

        {variants.length > 1 ? (
          <div className="space-y-2">
            <label htmlFor="variant" className="store-label text-foreground">
              {t('product.variant')}
            </label>
            <Select
              id="variant"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="min-h-11 rounded-lg"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {formatMoney(v.branchPrice ?? v.flagshipPrice)}
                  {!v.inStock ? ` (${t('catalog.outOfStock')})` : ''}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="store-bento-card space-y-4 p-5">
          {selected ? (
            <>
              <p className="store-price text-2xl">{formatMoney(displayPrice)}</p>
              <p className="text-sm text-muted-foreground">
                {outOfStock
                  ? t('product.outOfStock')
                  : selected.inventory <= 5
                    ? t('product.lowStock', { count: selected.inventory })
                    : t('product.inStock')}
              </p>
            </>
          ) : null}

          <Button
            className="min-h-11 w-full rounded-full"
            size="lg"
            disabled={outOfStock || adding}
            onClick={handleAddToCart}
          >
            {adding
              ? t('product.adding')
              : outOfStock
                ? t('product.outOfStock')
                : t('product.addToCart')}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
