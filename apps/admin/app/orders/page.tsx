import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui/server';

import { OnboardingStatus } from '@meridian/shared';

import { ListPagination } from '@meridian/ui';
import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch, type MerchantListItem, type PaginatedResponse, type PlatformOrder } from '@/lib/api';
import { requireToken } from '@/lib/auth';
import { OrdersView } from './_components/orders-view';

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    fulfillmentType?: string;
    tab?: string;
    guestEmail?: string;
    tenantId?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const token = await requireToken();

  const t = await getTranslations('admin.orders');
  const tc = await getTranslations('common');
  const params = await searchParams;
  const activeTab = params.tab === 'delivery' ? 'delivery' : 'all';
  const statusFilter = activeTab === 'delivery' ? 'PAID' : (params.status ?? '');

  const query = new URLSearchParams();
  query.set('page', params.page ?? '1');
  query.set('limit', '20');
  if (activeTab === 'delivery') {
    query.set('deliveryQueue', 'true');
  } else {
    if (params.status) query.set('status', params.status);
    if (params.fulfillmentType) query.set('fulfillmentType', params.fulfillmentType);
  }
  if (params.guestEmail) query.set('guestEmail', params.guestEmail);
  if (params.tenantId) query.set('tenantId', params.tenantId);

  let orders: PlatformOrder[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  let orderMerchants: Array<{ tenantId: string; businessName: string }> = [];
  try {
    const [ordersRes, merchantsRes] = await Promise.all([
      apiFetch<PaginatedResponse<PlatformOrder>>(`/platform/orders?${query.toString()}`, {}, token),
      apiFetch<PaginatedResponse<MerchantListItem>>(
        `/platform/merchants?status=${OnboardingStatus.APPROVED}&limit=500`,
        {},
        token,
      ),
    ]);
    orders = ordersRes.data;
    meta = ordersRes.meta;
    orderMerchants = merchantsRes.data
      .filter((m) => m.tenantId)
      .map((m) => ({ tenantId: m.tenantId, businessName: m.businessName }));
  } catch {
    orders = [];
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const metrics = [
    {
      title: activeTab === 'delivery' ? t('tabDelivery') : t('title'),
      value: meta.total,
      description: activeTab === 'delivery' ? t('description') : undefined,
    },
    {
      title: tc('pageOf', { page: meta.page, total: totalPages }),
      value: orders.length,
    },
  ];

  return (
    <AdminShellWithSession>
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
            <OrdersView
              orders={orders}
              token={token}
              activeTab={activeTab}
              statusFilter={statusFilter}
              tenantIdFilter={params.tenantId ?? ''}
              guestEmailFilter={params.guestEmail ?? ''}
              merchants={orderMerchants}
            />
          </Suspense>
          <Suspense>
            <ListPagination
              basePath="/orders"
              total={meta.total}
              page={meta.page}
              limit={meta.limit}
              summary={t('pagination', { page: meta.page, totalPages, total: meta.total })}
            />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWithSession>
  );
}
