import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';
import type { MerchantFundsSummary } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';

function formatMoney(value: string | number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

export default async function FundsPage() {
  const locale = await getLocale();
  const t = await getTranslations('merchant.funds');
  const token = await getToken();
  if (!token) return null;

  const [summary, profile] = await Promise.all([
    apiFetch<MerchantFundsSummary>('/merchant/funds/summary', {}, token).catch(() => null),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        {summary ? (
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground">
              {t('period', { from: summary.from, to: summary.to })}
            </p>
            <BentoListHeader
              metrics={[
                { title: t('salesGmv'), value: formatMoney(summary.salesGmv, locale) },
                { title: t('allocationCost'), value: formatMoney(summary.allocationCost, locale) },
                {
                  title: t('deliveryAllocationCost'),
                  value: formatMoney(summary.deliveryAllocationCost, locale),
                },
                {
                  title: t('payableCommission'),
                  value: formatMoney(summary.payableCommission, locale),
                },
                { title: t('netPosition'), value: formatMoney(summary.netPosition, locale) },
              ]}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {t('loadError')}
          </div>
        )}
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
