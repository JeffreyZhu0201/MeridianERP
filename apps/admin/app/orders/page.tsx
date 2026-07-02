import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui/server';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PaginatedResponse, type PlatformOrder } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { OrdersView } from './_components/orders-view';

interface OrdersPageProps {
  searchParams: Promise<{ page?: string; status?: string; fulfillmentType?: string; tab?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.orders');
  const tc = await getTranslations('common');
  const params = await searchParams;
  const activeTab = params.tab === 'delivery' ? 'delivery' : 'all';

  const query = new URLSearchParams();
  query.set('page', params.page ?? '1');
  query.set('limit', '20');
  if (params.status) query.set('status', params.status);
  if (params.fulfillmentType) query.set('fulfillmentType', params.fulfillmentType);

  let orders: PlatformOrder[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  try {
    const res = await apiFetch<PaginatedResponse<PlatformOrder>>(
      `/platform/orders?${query.toString()}`,
      {},
      token,
    );
    orders = res.data;
    meta = res.meta;
  } catch {
    orders = [];
  }

  const metrics = [
    {
      title: activeTab === 'delivery' ? t('tabDelivery') : t('title'),
      value: meta.total,
      description: activeTab === 'delivery' ? t('description') : undefined,
    },
    {
      title: tc('pageOf', {
        page: meta.page,
        total: Math.max(1, Math.ceil(meta.total / meta.limit)),
      }),
      value: orders.length,
    },
  ];

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          emptyState={
            orders.length === 0 ? <EmptyState title={t('empty')} /> : undefined
          }
        >
          <Suspense>
            <OrdersView orders={orders} token={token} activeTab={activeTab} />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
