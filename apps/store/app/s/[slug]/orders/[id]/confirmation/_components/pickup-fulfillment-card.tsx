'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import QRCode from 'react-qr-code';
import { Badge } from '@meridian/ui';
import type { PickupTokenResponse, StoreOrderDetail } from '@meridian/shared';

import { apiFetch, storePath } from '@/lib/api';

interface PickupFulfillmentCardProps {
  slug: string;
  order: StoreOrderDetail;
  token: string;
}

export function PickupFulfillmentCard({ slug, order, token }: PickupFulfillmentCardProps) {
  const t = useTranslations('store.confirmation');
  const [pickupToken, setPickupToken] = useState<PickupTokenResponse | null>(null);
  const [loadError, setLoadError] = useState('');

  const isFulfilled = Boolean(order.pickupVerifiedAt) || order.status === 'FULFILLED';
  const showCredentials =
    order.fulfillmentType === 'PICKUP' && order.status === 'PAID' && !isFulfilled;

  useEffect(() => {
    if (!showCredentials) {
      setPickupToken(null);
      return;
    }

    let cancelled = false;
    setLoadError('');

    apiFetch<PickupTokenResponse>(storePath(slug, `orders/${order.id}/pickup-token`), {}, token)
      .then((data) => {
        if (!cancelled) setPickupToken(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load pickup QR');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showCredentials, slug, order.id, token]);

  if (order.fulfillmentType !== 'PICKUP') {
    return null;
  }

  if (isFulfilled) {
    return (
      <div className="rounded-xl ring-1 ring-border p-4 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="default">{t('pickedUpTitle')}</Badge>
          {order.pickupVerifiedAt ? (
            <span className="text-xs text-muted-foreground">
              {t('pickedUpAt', {
                date: new Date(order.pickupVerifiedAt).toLocaleString(),
              })}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (!showCredentials) {
    return null;
  }

  const displayCode = pickupToken?.pickupCode ?? order.pickupCode;
  const qrValue = pickupToken?.qrPayload;

  return (
    <div className="rounded-xl ring-1 ring-border p-4 text-center">
      <p className="text-sm font-medium">{t('pickupTitle')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t('pickupHint')}</p>

      <div className="mt-4 flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-start">
        {qrValue ? (
          <div className="rounded-lg bg-white p-3 ring-1 ring-border">
            <QRCode value={qrValue} size={168} aria-label={t('pickupTitle')} />
          </div>
        ) : null}

        {displayCode ? (
          <div className="text-left sm:pt-2">
            <p className="text-xs text-muted-foreground">{t('pickupCodeLabel')}</p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.3em]">
              {displayCode}
            </p>
          </div>
        ) : null}
      </div>

      {loadError ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
