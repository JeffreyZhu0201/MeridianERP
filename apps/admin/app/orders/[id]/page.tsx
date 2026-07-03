import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import type { PlatformOrderDetail } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { OrderDetailView } from './_components/order-detail-view';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;
  const locale = await getLocale();

  let order: PlatformOrderDetail;
  try {
    order = await apiFetch<PlatformOrderDetail>(`/platform/orders/${id}`, {}, token);
  } catch {
    notFound();
  }

  return (
    <AdminShellWrapper>
      <OrderDetailView order={order} locale={locale} />
    </AdminShellWrapper>
  );
}
