import Link from 'next/link';
import { Suspense } from 'react';

import { BentoListHeader, ListPageFrame } from '@meridian/ui/server';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import type { BranchPurchaseOrderSummary } from '@meridian/shared';

import { ProcurementHistoryTable } from '../_components/procurement-history-table';

export default async function ProcurementHistoryPage() {
  const token = await getToken();
  if (!token) return null;

  const [ordersRes, profile] = await Promise.all([
    apiFetch<{ data: BranchPurchaseOrderSummary[] }>(
      '/merchant/procurement/orders?limit=50',
      {},
      token,
    ).catch(() => ({ data: [] })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const orders = ordersRes.data;
  const t = await getTranslations('merchant.inventory.procurement');
  const pendingCount = orders.filter((o) =>
    ['PENDING_PAYMENT', 'PROCESSING', 'SHIPPED'].includes(o.status),
  ).length;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame
        title={t('historyTitle')}
        description={t('historyDescription')}
        action={
          <Link
            href="/inventory/procurement"
            className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
          >
            {t('shopTitle')}
          </Link>
        }
      >
        <BentoListHeader
          metrics={[
            { title: t('historyTitle'), value: orders.length },
            { title: t('awaitingReceipt'), value: pendingCount },
          ]}
        />
        <Suspense>
          <ProcurementHistoryTable orders={orders} />
        </Suspense>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
