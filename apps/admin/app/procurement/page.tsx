import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import {
  BentoListHeader,
  EmptyState,
  ListPageFrame,
} from '@meridian/ui/server';
import type { PlatformProcurementOrderSummary, PlatformProcurementTabStatus } from '@meridian/shared';
import { PLATFORM_PROCUREMENT_TAB_STATUSES } from '@meridian/shared';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';
import { ProcurementStatusTabs } from './_components/procurement-status-tabs';
import { ProcurementView } from './_components/procurement-view';

interface ProcurementPageProps {
  searchParams: Promise<{ status?: string }>;
}

function resolveTabStatus(status?: string): PlatformProcurementTabStatus {
  if (
    status &&
    (PLATFORM_PROCUREMENT_TAB_STATUSES as readonly string[]).includes(status)
  ) {
    return status as PlatformProcurementTabStatus;
  }
  return 'PROCESSING';
}

function listQuery(tab: PlatformProcurementTabStatus) {
  return tab === 'ALL' ? '?status=ALL' : `?status=${tab}`;
}

export default async function ProcurementPage({ searchParams }: ProcurementPageProps) {
  const token = await requireToken();
  const params = await searchParams;
  const tab = resolveTabStatus(params.status);
  const query = listQuery(tab);

  const ordersPromise = apiFetch<PlatformProcurementOrderSummary[]>(
    `/platform/procurement/orders${query}`,
    {},
    token,
  ).catch(() => [] as PlatformProcurementOrderSummary[]);

  const pendingPromise =
    tab === 'PROCESSING'
      ? ordersPromise
      : apiFetch<PlatformProcurementOrderSummary[]>(
          '/platform/procurement/orders?status=PROCESSING',
          {},
          token,
        ).catch(() => [] as PlatformProcurementOrderSummary[]);

  const [orders, pendingOrders] = await Promise.all([ordersPromise, pendingPromise]);

  const t = await getTranslations('admin.procurement');
  const emptyKey =
    tab === 'SHIPPED'
      ? 'emptyShipped'
      : tab === 'RECEIVED'
        ? 'emptyReceived'
        : tab === 'ALL'
          ? 'emptyAll'
          : 'empty';
  const emptyDescriptionKey =
    tab === 'SHIPPED'
      ? 'emptyShippedDescription'
      : tab === 'RECEIVED'
        ? 'emptyReceivedDescription'
        : tab === 'ALL'
          ? 'emptyAllDescription'
          : 'emptyDescription';

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('title'), value: orders.length },
            { title: t('pendingShip'), value: pendingOrders.length },
          ]}
        />
        <Suspense fallback={null}>
          <ProcurementStatusTabs />
        </Suspense>
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          emptyState={
            orders.length === 0 ? (
              <EmptyState title={t(emptyKey)} description={t(emptyDescriptionKey)} />
            ) : undefined
          }
        >
          <ProcurementView orders={orders} token={token} tab={tab} />
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
