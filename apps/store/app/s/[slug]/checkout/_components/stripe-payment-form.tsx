'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  PaymentElement,
  useElements,
  useStripe,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { Button } from '@meridian/ui';
import type { CheckoutResponse } from '@meridian/shared';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

function StripePayButton({
  storeSlug,
  orderId,
  onError,
}: {
  storeSlug: string;
  orderId: string;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations('store');
  const [loading, setLoading] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    onError('');

    const returnUrl = `${window.location.origin}/s/${storeSlug}/orders/${orderId}/confirmation`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (error) {
      onError(error.message ?? t('checkout.paymentFailed'));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full" size="lg" disabled={!stripe || loading}>
        {loading ? t('checkout.processing') : t('checkout.payNow')}
      </Button>
    </form>
  );
}

interface StripePaymentFormProps {
  storeSlug: string;
  checkout: CheckoutResponse;
  onError: (message: string) => void;
}

export function StripePaymentForm({ storeSlug, checkout, onError }: StripePaymentFormProps) {
  const t = useTranslations('store');

  if (!publishableKey) {
    return (
      <p className="text-sm text-destructive">
        {t('checkout.stripeUnavailable', { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' })}
      </p>
    );
  }

  const stripePromise = loadStripe(publishableKey);
  const options: StripeElementsOptions = {
    clientSecret: checkout.paymentIntent.clientSecret,
    appearance: { theme: 'stripe' },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePayButton
        storeSlug={storeSlug}
        orderId={checkout.order.id}
        onError={onError}
      />
    </Elements>
  );
}
