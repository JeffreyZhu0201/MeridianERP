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
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-square rounded-xl bg-muted" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          {product.description ? (
            <p className="mt-2 text-muted-foreground">{product.description}</p>
          ) : null}
        </div>

        {variants.length > 1 ? (
          <div className="space-y-2">
            <label htmlFor="variant" className="text-sm font-medium">
              {t('product.variant')}
            </label>
            <Select
              id="variant"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
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

        {selected ? (
          <div className="space-y-1">
            <p className="text-2xl font-semibold">{formatMoney(displayPrice)}</p>
            <p className="text-sm text-muted-foreground">
              {outOfStock
                ? t('product.outOfStock')
                : selected.inventory <= 5
                  ? t('product.lowStock', { count: selected.inventory })
                  : t('product.inStock')}
            </p>
          </div>
        ) : null}

        <Button
          className="min-h-11 w-full sm:w-auto"
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
  );
}
