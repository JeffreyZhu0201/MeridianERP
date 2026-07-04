import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import type { PlatformOrderDetail } from '@meridian/shared';

import { AdminShellWithSession } from '@/components/admin-shell-with-session';
import { apiFetch } from '@/lib/api';
import { requireToken } from '@/lib/auth';
import { OrderDetailShipActions } from './_components/order-detail-ship-actions';
import { OrderDetailView } from './_components/order-detail-view';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const token = await requireToken();

  const { id } = await params;
  const locale = await getLocale();

  let order: PlatformOrderDetail;
  try {
    order = await apiFetch<PlatformOrderDetail>(`/platform/orders/${id}`, {}, token);
  } catch {
    notFound();
  }

  return (
    <AdminShellWithSession>
      <OrderDetailView
        order={order}
        locale={locale}
        shipActions={<OrderDetailShipActions order={order} token={token} />}
      />
    </AdminShellWithSession>
  );
}
