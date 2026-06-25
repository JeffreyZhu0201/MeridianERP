import { getTranslations } from 'next-intl/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  AllocationsPanel,
  type MerchantAllocationOrder,
} from './_components/allocations-panel';

export default async function AllocationsPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('merchant.allocations');

  const [allocations, profile] = await Promise.all([
    apiFetch<MerchantAllocationOrder[]>('/merchant/allocations', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <AllocationsPanel allocations={allocations} token={token} />
    </MerchantShellWrapper>
  );
}
