'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Input, Label } from '@meridian/ui';

import { apiFetch, type Cart } from '@/lib/api';

interface CheckoutFormProps {
  storeSlug: string;
  cart: Cart | null;
  token?: string;
}

function formatPrice(price: string | number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(price),
  );
}

export function CheckoutForm({ storeSlug, cart, token }: CheckoutFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal =
    cart?.items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0,
    ) ?? 0;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Your cart is empty</p>
        <Link href={`/s/${storeSlug}`}>
          <Button className="mt-4">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch(
        '/store/checkout',
        {
          method: 'POST',
          body: JSON.stringify({ guestEmail: email, createAccount }),
        },
        token,
      );
      router.push(`/s/${storeSlug}/account`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium">Order summary</p>
        <p className="mt-1 text-2xl font-semibold">{formatPrice(subtotal)}</p>
        <p className="text-xs text-muted-foreground">{cart.items.length} item(s)</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {!token ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="size-4 rounded border-input"
            />
            Create an account for faster checkout next time
          </label>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Payment via Stripe will be integrated in a follow-up. This creates a pending order.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Processing…' : 'Place order'}
      </Button>
    </form>
  );
}
