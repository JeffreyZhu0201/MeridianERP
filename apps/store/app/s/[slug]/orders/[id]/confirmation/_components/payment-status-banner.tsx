'use client';

import { useTranslations } from 'next-intl';

interface PaymentStatusBannerProps {
  redirectStatus?: string;
}

export function PaymentStatusBanner({ redirectStatus }: PaymentStatusBannerProps) {
  const t = useTranslations('store');

  if (!redirectStatus) return null;

  if (redirectStatus === 'succeeded') {
    return (
      <p className="rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400">
        {t('confirmation.paymentSuccess')}
      </p>
    );
  }

  if (redirectStatus === 'processing') {
    return (
      <p className="rounded-lg border border-amber-600/30 bg-amber-600/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
        {t('confirmation.paymentProcessingDetail')}
      </p>
    );
  }

  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
      {t('confirmation.paymentFailedDetail')}
    </p>
  );
}
