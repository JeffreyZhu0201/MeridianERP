import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui/server';
import type { MasterSkuSummary, ReplenishmentRequestSummary } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ReplenishmentPanel } from './_components/replenishment-panel';

type ReplenishmentListItem = ReplenishmentRequestSummary & {
  lines?: unknown[];
};

function mapRequests(rows: ReplenishmentListItem[]): ReplenishmentRequestSummary[] {
  return rows.map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
    status: row.status,
    note: row.note,
    lineCount: row.lineCount ?? row.lines?.length ?? 0,
    createdAt: row.createdAt,
  }));
}

export default async function ReplenishmentPage() {
  const t = await getTranslations('merchant.replenishment');
  const token = await getToken();
  if (!token) return null;

  const [requestsRes, skus, profile] = await Promise.all([
    apiFetch<ReplenishmentListItem[]>('/merchant/replenishment', {}, token).catch(() => []),
    apiFetch<MasterSkuSummary[]>('/merchant/replenishment/master-skus', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <ReplenishmentPanel
          requests={mapRequests(requestsRes)}
          skus={skus}
          token={token}
        />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
