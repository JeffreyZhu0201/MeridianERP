'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, formatMoney, Input, Label } from '@meridian/ui';
import type { CheckoutResponse, DeliveryAddress, FulfillmentType } from '@meridian/shared';

import { apiFetch, storePath, type Cart } from '@/lib/api';
import { CheckoutPaymentStep } from './checkout-payment-step';

interface CheckoutFormProps {
  storeSlug: string;
  cart: Cart | null;
  token?: string;
  basePath?: string;
  allowPickup?: boolean;
  defaultFulfillmentType?: FulfillmentType;
}

const emptyAddress: DeliveryAddress = {
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  province: '',
  postalCode: '',
};

export function CheckoutForm({
  storeSlug,
  cart,
  token,
  basePath = `/s/${storeSlug}`,
  allowPickup = true,
  defaultFulfillmentType = 'PICKUP',
}: CheckoutFormProps) {
  const router = useRouter();
  const t = useTranslations('store');
  const [email, setEmail] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(
    defaultFulfillmentType,
  );
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(emptyAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);

  const subtotal =
    cart?.items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0,
    ) ?? 0;

  function updateAddress(field: keyof DeliveryAddress, value: string) {
    setDeliveryAddress((prev) => ({ ...prev, [field]: value }));
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="store-bento-card p-8 text-center">
        <p className="text-muted-foreground">{t('checkout.emptyCart')}</p>
        <Link href={basePath}>
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
          router.push(`${basePath}/orders/${orderId}/confirmation`);
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
      const payload: Record<string, unknown> = {
        guestEmail: token ? undefined : email,
        fulfillmentType,
      };
      if (fulfillmentType === 'DELIVERY') {
        payload.deliveryAddress = {
          name: deliveryAddress.name,
          phone: deliveryAddress.phone,
          line1: deliveryAddress.line1,
          line2: deliveryAddress.line2 || undefined,
          city: deliveryAddress.city,
          province: deliveryAddress.province || undefined,
          postalCode: deliveryAddress.postalCode || undefined,
        };
      }
      const res = await apiFetch<CheckoutResponse>(
        storePath(storeSlug, 'checkout'),
        {
          method: 'POST',
          body: JSON.stringify(payload),
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <div className="flex flex-col gap-6 md:col-span-7 lg:col-span-8">
        {!token ? (
          <section className="store-bento-card space-y-4 p-6">
            <h2 className="store-headline-lg">{t('checkout.contactInfo')}</h2>
            <div className="space-y-2">
              <Label htmlFor="email">{t('checkout.email')}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </section>
        ) : null}

        <section className="store-bento-card space-y-4 p-6">
          <h2 className="store-headline-lg">{t('checkout.fulfillmentType')}</h2>
          {!allowPickup ? (
            <p className="text-sm text-muted-foreground">{t('checkout.deliveryOnly')}</p>
          ) : null}
          <div
            className={
              allowPickup
                ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
                : 'grid grid-cols-1 gap-3'
            }
          >
            {allowPickup ? (
              <label className="flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-lg border border-border p-4 text-center text-sm has-checked:border-primary has-checked:bg-primary/5">
                <input
                  type="radio"
                  name="fulfillmentType"
                  value="PICKUP"
                  checked={fulfillmentType === 'PICKUP'}
                  onChange={() => setFulfillmentType('PICKUP')}
                  className="sr-only"
                />
                {t('checkout.pickup')}
              </label>
            ) : null}
            <label className="flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-lg border border-border p-4 text-center text-sm has-checked:border-primary has-checked:bg-primary/5">
              <input
                type="radio"
                name="fulfillmentType"
                value="DELIVERY"
                checked={fulfillmentType === 'DELIVERY'}
                onChange={() => setFulfillmentType('DELIVERY')}
                className="sr-only"
              />
              {t('checkout.delivery')}
            </label>
          </div>
        </section>

        {fulfillmentType === 'DELIVERY' ? (
          <section className="store-bento-card space-y-4 p-6">
            <h2 className="store-headline-lg">{t('checkout.deliveryAddress')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="delivery-name">{t('checkout.recipientName')}</Label>
                <Input
                  id="delivery-name"
                  required
                  autoComplete="name"
                  value={deliveryAddress.name}
                  onChange={(e) => updateAddress('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-phone">{t('checkout.phone')}</Label>
                <Input
                  id="delivery-phone"
                  required
                  type="tel"
                  autoComplete="tel"
                  value={deliveryAddress.phone}
                  onChange={(e) => updateAddress('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="delivery-line1">{t('checkout.addressLine1')}</Label>
                <Input
                  id="delivery-line1"
                  required
                  autoComplete="address-line1"
                  value={deliveryAddress.line1}
                  onChange={(e) => updateAddress('line1', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="delivery-line2">{t('checkout.addressLine2')}</Label>
                <Input
                  id="delivery-line2"
                  autoComplete="address-line2"
                  value={deliveryAddress.line2 ?? ''}
                  onChange={(e) => updateAddress('line2', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-city">{t('checkout.city')}</Label>
                <Input
                  id="delivery-city"
                  required
                  autoComplete="address-level2"
                  value={deliveryAddress.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-province">{t('checkout.province')}</Label>
                <Input
                  id="delivery-province"
                  autoComplete="address-level1"
                  value={deliveryAddress.province ?? ''}
                  onChange={(e) => updateAddress('province', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-postal">{t('checkout.postalCode')}</Label>
                <Input
                  id="delivery-postal"
                  autoComplete="postal-code"
                  value={deliveryAddress.postalCode ?? ''}
                  onChange={(e) => updateAddress('postalCode', e.target.value)}
                />
              </div>
            </div>
          </section>
        ) : null}

        {error ? (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full md:hidden" size="lg" disabled={loading}>
          {loading ? t('checkout.creatingOrder') : t('checkout.continueToPayment')}
        </Button>
      </div>

      <div className="md:col-span-5 lg:col-span-4">
        <div className="store-bento-card sticky top-[104px] space-y-4 p-6">
          <h2 className="store-headline-lg">{t('checkout.orderSummary')}</h2>
          <ul className="divide-y divide-border text-sm">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-3">
                <span className="min-w-0">
                  {item.variant.product.name}
                  <span className="block text-xs text-muted-foreground">
                    {item.variant.name} × {item.quantity}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatMoney(Number(item.variant.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="store-label text-muted-foreground">{t('cart.subtotal')}</span>
            <span className="store-headline-lg tabular-nums">{formatMoney(subtotal)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('checkout.items', { count: cart.items.length })}
          </p>
          <Button type="submit" className="hidden w-full md:inline-flex" size="lg" disabled={loading}>
            {loading ? t('checkout.creatingOrder') : t('checkout.continueToPayment')}
          </Button>
        </div>
      </div>
    </form>
  );
}
