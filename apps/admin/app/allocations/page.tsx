import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui/server';

import { ListPagination } from '@meridian/ui';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type PaginatedResponse, type PlatformOrder } from '@/lib/api';
import { requireToken } from '@/lib/auth';
import { OrdersView } from '../orders/_components/orders-view';

interface AllocationsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AllocationsPage({ searchParams }: AllocationsPageProps) {
  const token = await requireToken();
  const params = await searchParams;
  const t = await getTranslations('admin.allocations');
  const tc = await getTranslations('common');

  const query = new URLSearchParams();
  query.set('page', params.page ?? '1');
  query.set('limit', '20');
  query.set('deliveryQueue', 'true');

  let orders: PlatformOrder[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  try {
    const ordersRes = await apiFetch<PaginatedResponse<PlatformOrder>>(
      `/platform/orders?${query.toString()}`,
      {},
      token,
    );
    orders = ordersRes.data;
    meta = ordersRes.meta;
  } catch {
    orders = [];
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <AdminShellWithSession>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[
            { title: t('title'), value: meta.total, description: t('description') },
            {
              title: tc('pageOf', { page: meta.page, total: totalPages }),
              value: orders.length,
            },
          ]}
        />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          emptyState={
            orders.length === 0 ? (
              <EmptyState title={t('empty')} description={t('emptyDescription')} />
            ) : undefined
          }
        >
          <Suspense>
            <OrdersView
              orders={orders}
              token={token}
              variant="flagshipDelivery"
              merchants={[]}
            />
          </Suspense>
          <Suspense>
            <ListPagination
              basePath="/allocations"
              total={meta.total}
              page={meta.page}
              limit={meta.limit}
              summary={tc('pageOf', { page: meta.page, total: totalPages })}
            />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
