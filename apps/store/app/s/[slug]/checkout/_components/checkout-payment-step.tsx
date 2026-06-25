'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@meridian/ui';
import type { CheckoutResponse } from '@meridian/shared';

import { apiFetch, storePath } from '@/lib/api';
import { StripePaymentForm } from './stripe-payment-form';

interface CheckoutPaymentStepProps {
  storeSlug: string;
  checkout: CheckoutResponse;
  token?: string;
  onComplete: (orderId: string) => void;
  onError: (message: string) => void;
}

export function CheckoutPaymentStep({
  storeSlug,
  checkout,
  token,
  onComplete,
  onError,
}: CheckoutPaymentStepProps) {
  const t = useTranslations('store');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleError(message: string) {
    setError(message);
    onError(message);
  }

  async function handleSimulatePayment() {
    setLoading(true);
    setError('');
    onError('');
    try {
      await apiFetch(
        storePath(storeSlug, `orders/${checkout.order.id}/simulate-payment`),
        { method: 'POST' },
        token ? token : { storeSlug },
      );
      onComplete(checkout.order.id);
    } catch (err) {
      handleError(err instanceof Error ? err.message : t('checkout.paymentFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (checkout.mockPayment) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('checkout.mockHintLong')}</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full" size="lg" onClick={handleSimulatePayment} disabled={loading}>
          {loading ? t('checkout.processing') : t('checkout.simulatePayment')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('checkout.cardHint')}</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <StripePaymentForm storeSlug={storeSlug} checkout={checkout} onError={handleError} />
    </div>
  );
}
