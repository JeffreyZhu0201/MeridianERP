'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Input, Label } from '@meridian/ui';
import type { CheckoutResponse } from '@meridian/shared';

import { apiFetch, storePath, type Cart } from '@/lib/api';
import { CheckoutPaymentStep } from './checkout-payment-step';

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
  const t = useTranslations('store');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);

  const subtotal =
    cart?.items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0,
    ) ?? 0;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t('checkout.emptyCart')}</p>
        <Link href={`/s/${storeSlug}`}>
          <Button className="mt-4">{t('cart.continueShopping')}</Button>
        </Link>
      </div>
    );
  }

  if (checkout) {
    return (
      <CheckoutPaymentStep
        storeSlug={storeSlug}
        checkout={checkout}
        token={token}
        onComplete={(orderId) => {
          router.push(`/s/${storeSlug}/orders/${orderId}/confirmation`);
          router.refresh();
        }}
        onError={setError}
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<CheckoutResponse>(
        storePath(storeSlug, 'checkout'),
        {
          method: 'POST',
          body: JSON.stringify({ guestEmail: token ? undefined : email }),
        },
        token ? token : { storeSlug },
      );
      setCheckout(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkout.checkoutFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium">{t('checkout.orderSummary')}</p>
        <p className="mt-1 text-2xl font-semibold">{formatPrice(subtotal)}</p>
        <p className="text-xs text-muted-foreground">
          {t('checkout.items', { count: cart.items.length })}
        </p>
      </div>

      {!token ? (
        <div className="space-y-2">
          <Label htmlFor="email">{t('checkout.email')}</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? t('checkout.creatingOrder') : t('checkout.continueToPayment')}
      </Button>
    </form>
  );
}
