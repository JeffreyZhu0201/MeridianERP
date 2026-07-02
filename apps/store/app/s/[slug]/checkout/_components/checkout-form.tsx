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

export function CheckoutForm({ storeSlug, cart, token }: CheckoutFormProps) {
  const router = useRouter();
  const t = useTranslations('store');
  const [email, setEmail] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('PICKUP');
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
      <div className="rounded-xl ring-1 ring-border p-8 text-center">
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl ring-1 ring-border p-4">
        <p className="text-sm font-medium">{t('checkout.orderSummary')}</p>
        <p className="mt-1 text-2xl font-semibold">{formatMoney(subtotal)}</p>
        <p className="text-xs text-muted-foreground">
          {t('checkout.items', { count: cart.items.length })}
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{t('checkout.fulfillmentType')}</legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-lg ring-1 ring-border px-3 py-2 text-sm has-checked:ring-primary">
            <input
              type="radio"
              name="fulfillmentType"
              value="PICKUP"
              checked={fulfillmentType === 'PICKUP'}
              onChange={() => setFulfillmentType('PICKUP')}
            />
            {t('checkout.pickup')}
          </label>
          <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-lg ring-1 ring-border px-3 py-2 text-sm has-checked:ring-primary">
            <input
              type="radio"
              name="fulfillmentType"
              value="DELIVERY"
              checked={fulfillmentType === 'DELIVERY'}
              onChange={() => setFulfillmentType('DELIVERY')}
            />
            {t('checkout.delivery')}
          </label>
        </div>
      </fieldset>

      {fulfillmentType === 'DELIVERY' ? (
        <div className="space-y-4 rounded-xl ring-1 ring-border p-4">
          <p className="text-sm font-medium">{t('checkout.deliveryAddress')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="delivery-name">{t('checkout.recipientName')}</Label>
              <Input
                id="delivery-name"
                required
                value={deliveryAddress.name}
                onChange={(e) => updateAddress('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-phone">{t('checkout.phone')}</Label>
              <Input
                id="delivery-phone"
                required
                value={deliveryAddress.phone}
                onChange={(e) => updateAddress('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="delivery-line1">{t('checkout.addressLine1')}</Label>
              <Input
                id="delivery-line1"
                required
                value={deliveryAddress.line1}
                onChange={(e) => updateAddress('line1', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="delivery-line2">{t('checkout.addressLine2')}</Label>
              <Input
                id="delivery-line2"
                value={deliveryAddress.line2 ?? ''}
                onChange={(e) => updateAddress('line2', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-city">{t('checkout.city')}</Label>
              <Input
                id="delivery-city"
                required
                value={deliveryAddress.city}
                onChange={(e) => updateAddress('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-province">{t('checkout.province')}</Label>
              <Input
                id="delivery-province"
                value={deliveryAddress.province ?? ''}
                onChange={(e) => updateAddress('province', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-postal">{t('checkout.postalCode')}</Label>
              <Input
                id="delivery-postal"
                value={deliveryAddress.postalCode ?? ''}
                onChange={(e) => updateAddress('postalCode', e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : null}

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
