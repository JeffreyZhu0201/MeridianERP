'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Button,
  formatMoney,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

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

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cart.product')}</TableHead>
                <TableHead>{t('cart.variant')}</TableHead>
                <TableHead>{t('cart.qty')}</TableHead>
                <TableHead className="text-right">{t('cart.total')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.variant.product.name}</TableCell>
                  <TableCell>{item.variant.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating === item.id || item.quantity <= 1}
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                      >
                        −
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating === item.id}
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(Number(item.variant.price) * item.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={updating === item.id}
                      onClick={() => removeItem(item.id)}
                    >
                      {t('cart.remove')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl ring-1 ring-border p-4">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>{t('cart.subtotal')}</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <Link href={`${shopBasePath ?? `/s/${storeSlug}`}/checkout`} className="mt-4 block">
            <Button className="w-full" size="lg">
              {t('cart.checkout')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
