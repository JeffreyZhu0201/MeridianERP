'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, formatMoney } from '@meridian/ui';

import { apiFetch, storePath, type Cart } from '@/lib/api';

interface CartViewProps {
  cart: Cart;
  storeSlug: string;
  token?: string;
  shopBasePath?: string;
}

export function CartView({ cart: initial, storeSlug, token, shopBasePath }: CartViewProps) {
  const router = useRouter();
  const t = useTranslations('store');
  const [cart, setCart] = useState(initial);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateQty(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setUpdating(itemId);
    try {
      await apiFetch(
        storePath(storeSlug, `cart/items/${itemId}`),
        { method: 'PATCH', body: JSON.stringify({ quantity }) },
        token ? token : { storeSlug },
      );
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        ),
      }));
      router.refresh();
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId);
    try {
      await apiFetch(
        storePath(storeSlug, `cart/items/${itemId}`),
        { method: 'DELETE' },
        token ? token : { storeSlug },
      );
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
      router.refresh();
    } finally {
      setUpdating(null);
    }
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0,
  );
  const checkoutBase = shopBasePath ?? `/s/${storeSlug}`;

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-8">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="store-bento-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="store-body-md font-medium text-foreground">
                {item.variant.product.name}
              </p>
              <p className="text-sm text-muted-foreground">{item.variant.name}</p>
              <p className="store-price mt-1 text-base">
                {formatMoney(Number(item.variant.price) * item.quantity)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-border bg-background p-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 rounded-full p-0"
                  disabled={updating === item.id || item.quantity <= 1}
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  −
                </Button>
                <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 rounded-full p-0"
                  disabled={updating === item.id}
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                disabled={updating === item.id}
                onClick={() => removeItem(item.id)}
              >
                {t('cart.remove')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:col-span-4">
        <div className="store-bento-card sticky top-24 space-y-4 p-6">
          <div className="flex items-center justify-between">
            <span className="store-label text-muted-foreground">{t('cart.subtotal')}</span>
            <span className="store-price text-lg">{formatMoney(subtotal)}</span>
          </div>
          <Link href={`${checkoutBase}/checkout`} className="block">
            <Button className="min-h-11 w-full rounded-full" size="lg">
              {t('cart.checkout')}
            </Button>
          </Link>
          <Link
            href={checkoutBase}
            className="block text-center text-sm text-primary hover:underline"
          >
            {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
