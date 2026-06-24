'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
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
}

function formatPrice(price: string | number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(price),
  );
}

export function CartView({ cart: initial, storeSlug, token }: CartViewProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initial);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateQty(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setUpdating(itemId);
    try {
      await apiFetch(
        storePath(storeSlug, `cart/items/${itemId}`),
        { method: 'PATCH', body: JSON.stringify({ quantity }) },
        token,
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
      await apiFetch(storePath(storeSlug, `cart/items/${itemId}`), { method: 'DELETE' }, token);
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
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
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
                    {formatPrice(Number(item.variant.price) * item.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={updating === item.id}
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link href={`/s/${storeSlug}/checkout`} className="mt-4 block">
            <Button className="w-full" size="lg">
              Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
