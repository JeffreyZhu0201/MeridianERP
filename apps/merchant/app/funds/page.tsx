import { getTranslations } from 'next-intl/server';
import type { MerchantFundsSummary } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MerchantFundsPanel } from './_components/merchant-funds-panel';

export default async function FundsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const t = await getTranslations('merchant.funds');
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const path = `/merchant/funds/summary${query.toString() ? `?${query}` : ''}`;

  const [summary, profile] = await Promise.all([
    apiFetch<MerchantFundsSummary>(path, {}, token).catch(() => null),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      {summary ? (
        <MerchantFundsPanel
          initialSummary={summary}
          token={token}
          businessName={profile?.businessName}
        />
      ) : (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {t('loadError')}
        </div>
      )}
    </MerchantShellWrapper>
  );
}
