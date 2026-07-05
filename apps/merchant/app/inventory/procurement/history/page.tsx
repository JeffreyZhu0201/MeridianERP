import Link from 'next/link';
import { Suspense } from 'react';

import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui/server';

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
  const awaitingReceipt = orders.filter((o) => o.status === 'SHIPPED').length;
  const pendingPayment = orders.filter((o) => o.status === 'PENDING_PAYMENT').length;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('historyTitle'), value: orders.length },
            { title: t('awaitingReceipt'), value: awaitingReceipt },
            { title: t('awaitingPayment'), value: pendingPayment },
          ]}
        />
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
          emptyState={
            orders.length === 0 ? (
              <EmptyState
                title={t('emptyHistory')}
                description={t('emptyHistoryDescription')}
              />
            ) : undefined
          }
        >
          <Suspense>
            <ProcurementHistoryTable orders={orders} />
          </Suspense>
        </ListPageFrame>
      </div>
    </MerchantShellWrapper>
  );
}
