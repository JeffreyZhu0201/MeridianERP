'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge, Button, Select } from '@meridian/ui';

import { apiFetch, storePath, type Product } from '@/lib/api';

interface ProductDetailProps {
  product: Product;
  storeSlug: string;
  token?: string;
}

function formatPrice(price: string | number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(price),
  );
}

export function ProductDetail({ product, storeSlug, token }: ProductDetailProps) {
  const router = useRouter();
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
        token,
      );
      router.push(`/s/${storeSlug}/cart`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-square rounded-xl bg-muted" />

      <div className="space-y-6">
        <div className="space-y-2">
          {product.category ? (
            <Badge variant="secondary">{product.category.name}</Badge>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          {product.description ? (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          ) : null}
        </div>

        {activeVariants.length > 1 ? (
          <div className="space-y-2">
            <label htmlFor="variant" className="text-sm font-medium">
              Variant
            </label>
            <Select
              id="variant"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
            >
              {activeVariants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {formatPrice(v.price)}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {selected ? (
          <div className="space-y-1">
            <p className="text-2xl font-semibold">{formatPrice(selected.price)}</p>
            <p className="text-sm text-muted-foreground">
              {selected.inventory <= 0
                ? 'Out of stock'
                : selected.inventory <= 5
                  ? `Only ${selected.inventory} left`
                  : 'In stock'}
            </p>
          </div>
        ) : null}

        <Button
          className="min-h-11 w-full sm:w-auto"
          size="lg"
          disabled={outOfStock || adding}
          onClick={handleAddToCart}
        >
          {adding ? 'Adding…' : outOfStock ? 'Out of stock' : 'Add to cart'}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
