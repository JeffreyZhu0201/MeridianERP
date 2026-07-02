'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, formatMoney, Select } from '@meridian/ui';

import { apiFetch, storePath, type Product } from '@/lib/api';

interface ProductDetailProps {
  product: Product;
  storeSlug: string;
  token?: string;
}

export function ProductDetail({ product, storeSlug, token }: ProductDetailProps) {
  const router = useRouter();
  const t = useTranslations('store');
  const activeVariants = product.variants.filter((v) => v.isActive);
  const [variantId, setVariantId] = useState(activeVariants[0]?.id ?? '');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const selected = activeVariants.find((v) => v.id === variantId);
  const outOfStock = !selected || selected.inventory <= 0;

  async function handleAddToCart() {
    if (!variantId) return;
    setAdding(true);
    setError('');
    try {
      await apiFetch(
        storePath(storeSlug, 'cart/items'),
        {
          method: 'POST',
          body: JSON.stringify({ variantId, quantity: 1 }),
        },
        token ? token : { storeSlug },
      );
      router.push(`/s/${storeSlug}/cart`);
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
        {activeVariants.length > 1 ? (
          <div className="space-y-2">
            <label htmlFor="variant" className="text-sm font-medium">
              {t('product.variant')}
            </label>
            <Select
              id="variant"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
            >
              {activeVariants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {formatMoney(v.price)}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {selected ? (
          <div className="space-y-1">
            <p className="text-2xl font-semibold">{formatMoney(selected.price)}</p>
            <p className="text-sm text-muted-foreground">
              {selected.inventory <= 0
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
